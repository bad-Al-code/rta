import { MAX_RETRIES, RETRY_DELAY_MS } from '../config/constants';
import logger from '../config/logger';

interface RetryOptions {
  retries?: number;
  delayMs?: number;
  serviceName?: string;
}
export class RetryService {
  private retries: number;
  private delayMs: number;
  private serviceName: string;

  constructor(options: RetryOptions = {}) {
    const { retries, delayMs, serviceName } = options;

    this.retries = retries ?? MAX_RETRIES;
    this.delayMs = delayMs ?? RETRY_DELAY_MS;
    this.serviceName = serviceName ?? 'service';
  }

  /**
   * Retries an asynchronous function until it succeeds or max retries are reached.
   * @param fn The asynchronous function to execute.
   * @returns The result of the function if successful.
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (attempt < this.retries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        const error = err as Error;

        logger.error(
          `Failed to connect to ${this.serviceName}. Retrying in ${this.delayMs / 1000}s... (${attempt}/${this.retries}) %o`,
          { error: error.message }
        );

        if (attempt >= this.retries) {
          logger.error(`Max retries reached for ${this.serviceName}.`);
          throw error;
        }

        await this.delay(this.delayMs);
      }
    }

    throw new Error(
      `Failed to connect to ${this.serviceName} after ${this.retries} attempts.`
    );
  }

  /**
   * Utility method to delay execution for a given time.
   * @param ms Delay in milliseconds.
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
