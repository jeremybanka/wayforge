import { atom, selector } from "atom.io"

export const dividendState = atom<number>({
  key: `dividend`,
  default: 0,
})

export const divisorState = atom<number>({
  key: `divisor`,
  default: 2,
})

export const quotientState = selector<number>({
  key: `quotient`,
  get: ({ get }) => {
    const dividend = get(dividendState)
    const divisor = get(divisorState)
    return dividend / divisor
  },
})