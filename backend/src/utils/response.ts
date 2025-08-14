export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ApiResponse {
  static success<T>(message: string, data?: T, meta?: any): ApiResponseData<T> {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(message: string, errors?: any): ApiResponseData {
    return {
      success: false,
      message,
      errors,
    };
  }

  static paginated<T>(
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): ApiResponseData<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
