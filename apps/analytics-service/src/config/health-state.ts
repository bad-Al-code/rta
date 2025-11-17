type Dependency = 'postgres' | 'redis' | 'mongo';
type DependencyStatus = { status: 'UP' | 'DOWN'; details?: string };

class HealthStateManager {
  private state: Record<Dependency, DependencyStatus> = {
    postgres: { status: 'DOWN', details: 'Initializing...' },
    redis: { status: 'DOWN', details: 'Initializing...' },
    mongo: { status: 'DOWN', details: 'Initializing...' },
  };

  /**
   * Sets the health status of a critical dependency.
   * @param dependency The name of the dependency.
   * @param isHealthy Whether the dependency is connected and healthy.
   * @param details An optional error message if the dependency is unhealthy.
   */
  public set(
    dependency: Dependency,
    isHealthy: boolean,
    details?: string
  ): void {
    this.state[dependency] = {
      status: isHealthy ? 'UP' : 'DOWN',
      details: isHealthy ? undefined : details,
    };
  }

  /**
   * Checks if all critical dependencies are healthy.
   * @returns True if all dependencies are 'UP', otherwise false.
   */
  public isReady(): boolean {
    return Object.values(this.state).every((dep) => dep.status === 'UP');
  }

  /**
   * Generates a full health report.
   * @returns An object containing the overall status and the status for each dependency.
   */
  public getReport() {
    const isReady = this.isReady();

    return {
      status: isReady ? 'UP' : 'DOWN',
      dependencies: this.state,
    };
  }
}

export const healthState = new HealthStateManager();
