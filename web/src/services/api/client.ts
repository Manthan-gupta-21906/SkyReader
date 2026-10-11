/**
 * Resilient HTTP Client.
 * Features:
 * - Configurable request timeout via AbortController
 * - Automatic exponential backoff retries on transient errors
 * - Structured error handling with custom error types
 * - Support for intercepting request options
 */

import { ApiError, NetworkError, TimeoutError } from '../../utils/errors'
import type { RequestOptions } from '../../types/api'
import { env } from '../../config/env'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function httpClient<T>(
  url: string | URL,
  options: RequestOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? env.apiTimeoutMs
  const maxRetries = options.retries ?? env.apiMaxRetries
  const initialRetryDelay = options.retryDelayMs ?? 500

  let attempt = 0

  while (attempt <= maxRetries) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Treat 5xx and 429 as transient retryable errors
        const isTransient = response.status >= 500 || response.status === 429
        if (isTransient && attempt < maxRetries) {
          attempt++
          const delay = initialRetryDelay * Math.pow(2, attempt - 1)
          await wait(delay)
          continue
        }

        let errorMessage = `HTTP request failed with status ${response.status}`
        try {
          const errorBody = await response.json()
          if (errorBody && errorBody.reason) {
            errorMessage = errorBody.reason
          } else if (errorBody && errorBody.message) {
            errorMessage = errorBody.message
          }
        } catch {
          // Response body was not JSON
        }

        throw new ApiError(errorMessage, response.status)
      }

      const data = (await response.json()) as T
      return data
    } catch (err: unknown) {
      clearTimeout(timeoutId)

      // Handle abort / timeout
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < maxRetries) {
          attempt++
          await wait(initialRetryDelay * Math.pow(2, attempt - 1))
          continue
        }
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`)
      }

      // If it's already an ApiError, rethrow directly
      if (err instanceof ApiError) {
        throw err
      }

      // Network errors (e.g., DNS failure, offline)
      if (attempt < maxRetries) {
        attempt++
        await wait(initialRetryDelay * Math.pow(2, attempt - 1))
        continue
      }

      if (err instanceof Error) {
        throw new NetworkError(err.message)
      }
      throw new NetworkError('Unknown network failure')
    }
  }

  throw new NetworkError('Max retry attempts exceeded')
}
