// Stub for ErrorTrackingService
export class ErrorTrackingService {
  static getInstance() {
    return new ErrorTrackingService();
  }
  
  async logError() {
    return { message: 'Error tracking temporarily disabled' };
  }

  async captureError(error: any, context?: any, req?: any) {
    console.log('Error captured (stub):', error.message, context);
    return { id: 'stub-error-id' };
  }

  async capturePerformanceIssue(operation: string, duration: number, threshold: number, metadata?: any) {
    console.log('Performance issue captured (stub):', operation, duration, threshold, metadata);
    return { id: 'stub-perf-id' };
  }
}
