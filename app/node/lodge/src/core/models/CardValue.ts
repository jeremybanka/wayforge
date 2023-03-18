import { CardValueId } from "../util/Id"

type CardValueOptions<T> = {
  id?: string
  content: T
}

export class CardValue<T> {
  public id: CardValueId

  public content: T

  public constructor({ id, content }: CardValueOptions<T>) {
    this.id = new CardValueId(id)
    this.content = content
  }
}
