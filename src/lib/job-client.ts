/**
 * Client-side utilities for interacting with the job queue API
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type JobPhase =
  | 'queued'
  | 'validating'
  | 'calling_llm'
  | 'parsing_response'
  | 'complete'
  | 'error';

export interface JobResponse<T = unknown> {
  jobId: string;
  status: JobStatus;
  phase: JobPhase;
  phaseMessage: string;
  createdAt?: number;
  updatedAt?: number;
  result?: T;
  error?: string;
  // For recap specifically
  recap?: T;
}

export interface PollOptions {
  /** Polling interval in ms (default: 1000) */
  interval?: number;
  /** Maximum time to wait in ms (default: 120000 = 2 minutes) */
  timeout?: number;
  /** Callback for status updates */
  onStatusChange?: (status: JobResponse) => void;
}

/**
 * Poll for job completion
 * Returns the final result when complete, or throws on failure/timeout
 */
export async function pollForResult<T>(
  jobId: string,
  options: PollOptions = {}
): Promise<T> {
  const { interval = 1000, timeout = 120000, onStatusChange } = options;

  const startTime = Date.now();

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new Error(`Job ${jobId} timed out after ${timeout}ms`);
    }

    // Fetch job status
    const response = await fetch(`/api/jobs/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job ${jobId} not found`);
      }
      throw new Error(`Failed to fetch job status: ${response.statusText}`);
    }

    const job: JobResponse<T> = await response.json();

    // Notify of status change
    if (onStatusChange) {
      onStatusChange(job as JobResponse);
    }

    // Check if complete
    if (job.status === 'completed') {
      return (job.result ?? job.recap) as T;
    }

    // Check if failed
    if (job.status === 'failed') {
      throw new Error(job.error || 'Job failed');
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Submit a recap request and poll for results
 */
export async function generateRecap<T>(
  boxScore: unknown,
  options: PollOptions = {}
): Promise<{ jobId: string; recap: T }> {
  // Submit the job
  const submitResponse = await fetch('/api/recap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boxScore }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.json();
    throw new Error(error.error || 'Failed to submit recap job');
  }

  const submitResult: JobResponse<T> = await submitResponse.json();

  // If already complete (cached result), return immediately
  if (submitResult.status === 'completed' && (submitResult.recap || submitResult.result)) {
    return {
      jobId: submitResult.jobId,
      recap: (submitResult.recap ?? submitResult.result) as T,
    };
  }

  // Poll for completion
  const recap = await pollForResult<T>(submitResult.jobId, options);

  return {
    jobId: submitResult.jobId,
    recap,
  };
}

/**
 * Delete a job (useful for retrying with fresh state)
 */
export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete job');
  }
}
