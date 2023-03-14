export class NotFoundError extends Error {
  // public type = `NotFound`
  public constructor(message: string) {
    super(message)
  }
}
export class BadRequestError extends TypeError {
  // public type = `BadRequest`
  public constructor(message: string) {
    super(message)
  }
}
