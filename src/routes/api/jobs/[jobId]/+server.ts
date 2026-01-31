import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getJob, deleteJob } from '$lib/cache';

/**
 * GET /api/jobs/[jobId]
 *
 * Poll for job status and results
 */
export const GET: RequestHandler = async ({ params }) => {
  const { jobId } = params;

  if (!jobId) {
    return json({ error: 'Job ID is required' }, { status: 400 });
  }

  const job = getJob(jobId);

  if (!job) {
    return json({ error: 'Job not found' }, { status: 404 });
  }

  // Return full job state
  return json({
    jobId: job.id,
    status: job.status,
    phase: job.phase,
    phaseMessage: job.phaseMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    ...(job.result && { result: job.result }),
    ...(job.error && { error: job.error }),
  });
};

/**
 * DELETE /api/jobs/[jobId]
 *
 * Delete a job (useful for retrying)
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const { jobId } = params;

  if (!jobId) {
    return json({ error: 'Job ID is required' }, { status: 400 });
  }

  const job = getJob(jobId);

  if (!job) {
    return json({ error: 'Job not found' }, { status: 404 });
  }

  deleteJob(jobId);

  return json({ success: true, message: `Job ${jobId} deleted` });
};
