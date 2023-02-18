export type Substitute<Container, Content, Substitution> =
  Container extends Record<keyof any, any>
    ? {
        [K in keyof Container]: Container[K] extends Content
          ? Substitute<Container[K], Content, Substitution> | Substitution
          : Substitute<Container[K], Content, Substitution>
      }
    : Container extends (infer Item)[]
    ? (Item extends Content
        ? Substitute<Item, Content, Substitution> | Substitution
        : Substitute<Item, Content, Substitution>)[]
    : Container
// extends Content
// ? Substitution
// : Container
