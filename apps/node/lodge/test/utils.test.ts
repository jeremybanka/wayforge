import { ID } from "./test-utils"

describe(`id tools`, () => {
  it(`generates unique ids in order, with the idx first`, () => {
    const makeId = ID.style_$_000000()
    expect(makeId()).toEqual(`0_000000`)
    expect(makeId()).toEqual(`1_000000`)
    expect(makeId()).toEqual(`2_000000`)
  })
  it(`generates unique ids in order, with the idx last`, () => {
    const makeId = ID.style_000000_$()
    expect(makeId()).toEqual(`000000_0`)
    expect(makeId()).toEqual(`000000_1`)
    expect(makeId()).toEqual(`000000_2`)
  })
})
