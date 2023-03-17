import { CardValueId } from "../util/Id"

interface ICardValueProps {
  id?: string
  content: unknown
}

export class CardValue {
  public id: CardValueId

  public content: unknown

  public constructor({ id, content }: ICardValueProps) {
    this.id = new CardValueId(id)
    this.content = content
  }
}
