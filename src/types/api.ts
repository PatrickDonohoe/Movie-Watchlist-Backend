export type ApiSuccess<T> = {
  status: 'success';
  data: T;
};

export type ApiError = {
  status: 'error';
  error: {
    message: string;
    deatils?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
