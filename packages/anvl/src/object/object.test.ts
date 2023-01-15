import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import { hasProperties } from "."

describe(`hasProperties`, () => {
  it(`refines an empty object`, () => {
    const isEmptyObject = hasProperties({})
    expect(isEmptyObject({})).toBe(true)
  })
  it(`refines an object with keys of different types`, () => {
    const isMyFancyType = hasProperties({
      a: isString,
      b: isNumber,
      c: isBoolean,
    })
    const myFancyObject: unknown = JSON.parse(`{
      "a": "hello",
      "b": 42,
      "c": true
    }`)
    const doesMatch = isMyFancyType(myFancyObject)
    expect(doesMatch).toBe(true)
    if (doesMatch) {
      expect(myFancyObject.a).toBe(`hello`)
      expect(myFancyObject.b).toBe(42)
      expect(myFancyObject.c).toBe(true)
    }
  })
  it(`won't match an object with a missing key`, () => {
    const isMyFancyType = hasProperties({
      a: isString,
      b: isNumber,
      c: isBoolean,
    })
    const myFancyObject: unknown = JSON.parse(`{
      "a": "hello",
      "b": 42
    }`)
    expect(isMyFancyType(myFancyObject)).toBe(false)
  })
})
