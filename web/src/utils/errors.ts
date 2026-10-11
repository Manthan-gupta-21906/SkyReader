/**
 * Custom error hierarchy for robust application error handling.
 */

export class AppError extends Error {
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, code = 'APP_ERROR', isOperational = true) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.isOperational = isOperational
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed. Please check your internet.', code = 'NETWORK_ERROR') {
    super(message, code)
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'The request timed out. Please try again.', code = 'TIMEOUT_ERROR') {
    super(message, code)
  }
}

export class ApiError extends AppError {
  public readonly status: number

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message, code)
    this.status = status
  }
}

export class CameraError extends AppError {
  public readonly reason: 'permission_denied' | 'not_supported' | 'in_use' | 'unknown'

  constructor(
    message: string,
    reason: 'permission_denied' | 'not_supported' | 'in_use' | 'unknown' = 'unknown'
  ) {
    super(message, `CAMERA_${reason.toUpperCase()}`)
    this.reason = reason
  }
}

export class StorageError extends AppError {
  constructor(message: string, code = 'STORAGE_ERROR') {
    super(message, code)
  }
}

/**
 * Safely extracts a readable string message from any caught error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred. Please try again.'
}
