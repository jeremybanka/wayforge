import { isBoolean } from "fp-ts/lib/boolean"
import { isNumber } from "fp-ts/lib/number"
import { isString } from "fp-ts/lib/string"

import { isObject } from "./object"

describe(`isObject`, () => {
  it(`refines an empty object`, () => {
    const isEmptyObject = isObject({})
    expect(isEmptyObject({})).toBe(true)
  })
  it(`refines an object with keys of different types`, () => {
    const isMyFancyType = isObject({
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
})
