export type ApiSuccess<T> = {
  status: 'success';
  data: T;
};

export type ApiError = {
  status: 'error';
  error: {
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
