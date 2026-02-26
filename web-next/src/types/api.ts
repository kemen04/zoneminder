export interface LoginResponse {
  version: string
  apiversion: string
  access_token: string
  access_token_expires: number
  refresh_token: string
  refresh_token_expires: number
  credentials?: string
  append_password?: number
}

export interface ApiPagination {
  page: number
  current: number
  count: number
  prevPage: boolean
  nextPage: boolean
  pageCount: number
  order: Record<string, string>
  limit: number
}

export interface ApiResponse<T> {
  [key: string]: T | ApiPagination | undefined
  pagination?: ApiPagination
}
