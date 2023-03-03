import wrapAround from "./wrapAround"

describe(`wrapAround`, () => {
  it(`wraps numbers into a range`, () => {
    expect(wrapAround(5, [0, 3])).toBe(2)
    expect(wrapAround(5, [0, 4])).toBe(1)
    expect(wrapAround(200, [0, 3])).toBe(2)
  })
})
