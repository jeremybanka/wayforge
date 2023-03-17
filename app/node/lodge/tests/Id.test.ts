/* eslint-disable no-restricted-syntax */
import Id, {
  freezeId,
  isNanoId,
  thawId,
  VirtualCardId,
} from "../src/core/util/Id"

/* eslint-disable @typescript-eslint/ban-types */
const areDeepSame = (
  thing1:object,
  thing2:object
):boolean => {
  const entries = Object.keys(thing1)
  for (const key of entries) {
    const value1 = thing1[key]
    const value2 = thing2[key]
    switch (typeof value1) {
      case `object`:
        if (value1 === null && value2 === null) continue
        if (!areDeepSame(value1, value2)) return false
        break
      case `function`:
        if (typeof value2 !== `function`) return false
        if (!areDeepSame(value1(), value2())) return false
        break
      default:
        if (value1 !== value2) return false
    }
  }
  return true
}
/* eslint-enable @typescript-eslint/ban-types */

describe(`Id Constructors`, () => {
  it(`makes a new Id`, () => {
    const id = new Id()
    const idString = id.toString()
    const idStringIsNanoId = isNanoId(idString)
    // console.log(id)
    // console.log(idString)
    // console.log(idStringIsNanoId)
    expect(idStringIsNanoId).toBe(true)
  })
})

describe(`freezeId and thawId`, () => {
  it(`produces an equivalent Id`, () => {
    const original = new VirtualCardId()
    const frozen = freezeId(original)
    const thawed = thawId(frozen)
    // console.log(original)
    // console.log(frozen)
    // console.log(thawed)
    // console.log(areTheSame(original, thawed))
    expect(areDeepSame(original, thawed))
  })
})
