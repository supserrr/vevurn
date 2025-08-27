export class ApiResponse {
  static success(message: string, data?: any, pagination?: any) {
    return {
      success: true,
      message,
      data,
      ...(pagination && { pagination })
    };
  }

  static error(message: string, error?: any) {
    return {
      success: false,
      message,
      ...(error && { error })
    };
  }

  static paginated(message: string, data: any[], page: number, limit: number, total: number) {
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}