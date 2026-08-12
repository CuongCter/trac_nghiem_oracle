/** Generic API response envelope */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

/** Pagination metadata */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated payload */
export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

/** Common query parameters */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** HTTP error returned from the API */
export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  status?: number;
}
