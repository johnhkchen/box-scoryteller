import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { b } from '$lib/baml-wrapper.server';
import {
  hashContent,
  getRecap,
  storeRecap,
  getJob,
  getJobByInputHash,
  createOrGetJob,
  updateJobPhase,
  completeJob,
  failJob,
  deleteJob,
  resetStaleJobs,
  cleanupOldJobs,
  type Job,
} from '$lib/cache';
import type { GameRecap, BaseballGameRecap, WaterPoloGameRecap } from '../../../baml_client/types';

// On server start, reset any stale jobs from previous runs
resetStaleJobs(5);
cleanupOldJobs(60);

// Job timeout in milliseconds (2 minutes)
const JOB_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Check if a job is stale (stuck in processing for too long)
 */
function isJobStale(job: Job): boolean {
  if (job.status !== 'processing' && job.status !== 'pending') {
    return false;
  }
  const updatedAt = new Date(job.updatedAt + 'Z').getTime(); // SQLite stores UTC without Z
  const now = Date.now();
  return (now - updatedAt) > JOB_TIMEOUT_MS;
}

/**
 * Generate a deterministic job ID from input
 */
function generateJobId(input: unknown): string {
  const hash = hashContent(JSON.stringify(input));
  return `recap_${hash}`;
}

/**
 * POST /api/recap
 *
 * Starts or retrieves a recap generation job.
 * - First checks SQLite cache for completed recap
 * - If a job is in progress, returns the current status
 * - If no job exists, starts a new one and returns immediately with job ID
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { boxScore } = await request.json();

    if (!boxScore) {
      return json({ error: 'Box score data is required' }, { status: 400 });
    }

    // Generate hash for cache lookup
    const inputHash = hashContent(JSON.stringify(boxScore));
    const jobId = `recap_${inputHash}`;

    // 1. First check SQLite cache for completed recap
    const cachedRecap = getRecap(inputHash);
    if (cachedRecap) {
      return json({
        jobId,
        status: 'completed',
        phase: 'complete',
        phaseMessage: 'Loaded from cache',
        recap: cachedRecap,
        cached: true,
      });
    }

    // 2. Check if there's an in-progress job for this input
    const existingJob = getJobByInputHash(inputHash, 'recap');
    if (existingJob) {
      // Check if job is stale (stuck for too long)
      if (isJobStale(existingJob)) {
        console.log(`Job ${existingJob.id} is stale, resetting...`);
        deleteJob(existingJob.id);
        // Continue to create new job below
      } else if (existingJob.status === 'processing' || existingJob.status === 'pending') {
        // Job is in progress and not stale
        return json({
          jobId: existingJob.id,
          status: existingJob.status,
          phase: existingJob.phase,
          phaseMessage: existingJob.phaseMessage,
        });
      } else if (existingJob.status === 'completed' && existingJob.result) {
        // Job completed (check result)
        return json({
          jobId: existingJob.id,
          status: existingJob.status,
          phase: existingJob.phase,
          phaseMessage: existingJob.phaseMessage,
          recap: existingJob.result,
        });
      }
      // Job failed - we'll create a new one below
    }

    // 3. Check if job exists by ID (for idempotency)
    const jobById = getJob(jobId);
    if (jobById) {
      // Check if job is stale
      if (isJobStale(jobById)) {
        console.log(`Job ${jobById.id} is stale, resetting...`);
        deleteJob(jobById.id);
        // Continue to create new job below
      } else if (jobById.status === 'completed' && jobById.result) {
        return json({
          jobId,
          status: jobById.status,
          phase: jobById.phase,
          phaseMessage: jobById.phaseMessage,
          recap: jobById.result,
        });
      } else if (jobById.status === 'processing' || jobById.status === 'pending') {
        return json({
          jobId,
          status: jobById.status,
          phase: jobById.phase,
          phaseMessage: jobById.phaseMessage,
        });
      }
      // Failed job - continue to create new one
    }

    // 4. Create new job
    const job = createOrGetJob(jobId, inputHash, 'recap');

    // If job was just created (pending), start processing
    if (job.status === 'pending') {
      // Start async processing - don't await
      processRecapJob(jobId, inputHash, boxScore);
    }

    // Return immediately with job info
    return json({
      jobId,
      status: job.status,
      phase: job.phase,
      phaseMessage: job.phaseMessage,
    });
  } catch (error) {
    console.error('Failed to create recap job:', error);
    return json(
      { error: 'Failed to create recap job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

/**
 * Detect the sport type from the boxScore structure
 */
function detectSportType(boxScore: unknown): 'baseball' | 'waterpolo' | 'basketball' {
  if (typeof boxScore !== 'object' || boxScore === null) return 'basketball';
  const metadata = (boxScore as Record<string, unknown>).metadata;
  if (typeof metadata !== 'object' || metadata === null) return 'basketball';

  // Baseball has innings
  if ('innings' in metadata && !('periods' in metadata)) {
    return 'baseball';
  }

  // Water polo has goalkeepers in team stats
  const homeTeam = (boxScore as Record<string, unknown>).home_team;
  if (typeof homeTeam === 'object' && homeTeam !== null && 'goalkeepers' in homeTeam) {
    return 'waterpolo';
  }

  // Default to basketball
  return 'basketball';
}

/**
 * Process recap generation asynchronously
 */
async function processRecapJob(jobId: string, inputHash: string, boxScore: unknown): Promise<void> {
  try {
    updateJobPhase(jobId, 'validating', 'Validating box score data...');

    // Small delay to allow the initial response to be sent
    await new Promise(resolve => setTimeout(resolve, 100));

    updateJobPhase(jobId, 'calling_llm', 'Generating recap with AI...');

    let recap: GameRecap | BaseballGameRecap | WaterPoloGameRecap;

    const sportType = detectSportType(boxScore);
    if (sportType === 'baseball') {
      recap = await b.GenerateBaseballRecap(boxScore as Parameters<typeof b.GenerateBaseballRecap>[0]);
    } else if (sportType === 'waterpolo') {
      recap = await b.GenerateWaterPoloRecap(boxScore as Parameters<typeof b.GenerateWaterPoloRecap>[0]);
    } else {
      recap = await b.GenerateRecap(boxScore as Parameters<typeof b.GenerateRecap>[0]);
    }

    updateJobPhase(jobId, 'parsing_response', 'Processing response...');

    // Store in SQLite cache for future requests
    storeRecap(inputHash, recap, 'claude-sonnet-4');

    // Complete the job
    completeJob(jobId, recap);
    console.log(`Job ${jobId} completed successfully and cached`);
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
}
