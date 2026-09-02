export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details)
export const unauthorized = (message = 'Sign in to continue') => new HttpError(401, message)
export const forbidden = (message = 'You do not have access to this') => new HttpError(403, message)
export const notFound = (message = 'Not found') => new HttpError(404, message)
export const conflict = (message: string, details?: unknown) => new HttpError(409, message, details)
export const unprocessable = (message: string, details?: unknown) => new HttpError(422, message, details)
