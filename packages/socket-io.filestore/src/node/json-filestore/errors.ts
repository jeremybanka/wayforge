export class NotFoundError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = `NotFound`
  }
}
export class BadRequestError extends TypeError {
  public constructor(message: string) {
    super(message)
    this.name = `BadRequest`
  }
}
