export const expandPathForSchema = (
  path: (keyof any)[]
): (number | string)[] | Error => {
  try {
    return path
      .map((key) => {
        switch (typeof key) {
          case `string`:
            return [`properties`, key]
          case `number`:
            return [`items`, key]
          case `symbol`:
            throw new TypeError(
              `The key ${String(
                key
              )} is not a valid JSON key; expected string or number, got symbol`
            )
          default:
            throw new TypeError(
              `The key ${key} is not a valid JSON key; expected string or number, got ${typeof key}`
            )
        }
      })
      .flat()
  } catch (caught) {
    if (caught instanceof TypeError) return caught
    throw caught
  }
}
