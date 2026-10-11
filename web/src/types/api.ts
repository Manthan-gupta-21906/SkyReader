/**
 * API client request, response, and error payload definitions.
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
}

export interface ApiErrorPayload {
  message: string
  status?: number
  code?: string
  details?: unknown
}
