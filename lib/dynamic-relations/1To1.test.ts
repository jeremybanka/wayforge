import { Index1To1 } from "./1To1"

const A = `A`
const B = `B`

describe(`Join1To1`, () => {
  it(`sets and retrieves pairs`, () => {
    const riderOfHorseIndex = new Index1To1<string, number>()
    riderOfHorseIndex.set(A, 1)
    expect(riderOfHorseIndex.getChild(A)).toBe(1)
    expect(riderOfHorseIndex.getParent(1)).toBe(A)
  })
  it(`can override a pair by key`, () => {
    const pairing = new Index1To1<string, number>()
    pairing.set(A, 2)
    pairing.set(A, 3)
    expect(pairing.getChild(A)).toBe(3)
    expect(pairing.core.size).toBe(1)
  })
  it(`overrides a pair by value`, () => {
    const join = new Index1To1<string, number>()
    join.set(A, 2)
    join.set(B, 2)
    expect(join.getChild(A)).toBe(undefined)
    expect(join.getChild(B)).toBe(2)
    expect(join.core.size).toBe(1)
  })
  it(`won't override an existing pair without force`, () => {
    const join = new Index1To1<string, number>()
    join.set(A, 2)
    join.set(B, 2, false)
    expect(join.getChild(A)).toBe(2)
    expect(join.getChild(B)).toBe(undefined)
    expect(join.core.size).toBe(1)
  })
  it(`self serialize and deserialize`, () => {
    const original = new Index1To1<string, number>()
    original.set(A, 1)
    original.set(B, 2)
    const serialized = JSON.stringify(original.toJson())
    const deserialized = new Index1To1(JSON.parse(serialized))
    expect(typeof serialized).toBe(`string`)
    expect(original.getChild(A)).toBe(deserialized.getChild(A))
    expect(original.getChild(B)).toBe(deserialized.getChild(B))
  })
})
