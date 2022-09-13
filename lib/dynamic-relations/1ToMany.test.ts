import { vitest } from "vitest"

import { Index1ToMany } from "./1ToMany"

const A = `A`
const B = `B`
const C = `C`

describe(`Join1ToMany`, () => {
  it(`retrieves a parent's children`, () => {
    const groupOfNodesIndex = new Index1ToMany<string, number>()
    groupOfNodesIndex.set(A, 2)
    groupOfNodesIndex.set(A, 3)
    expect(groupOfNodesIndex.getChildren(A)).toEqual(new Set([2, 3]))
  })
  it(`retrieves a child's parent`, () => {
    const join = new Index1ToMany<string, number>()
    join.set(A, 2)
    join.set(B, 3)
    expect(join.getParent(2)).toBe(A)
    expect(join.getParent(3)).toBe(B)
  })
  it(`reassigns a child to a new parent`, () => {
    const join = new Index1ToMany<string, number>()
    join.set(A, 1)
    join.set(A, 2)
    join.set(B, 3)
    join.set(C, 2)
    join.set(C, 3)
    expect(join.getChildren(A)).toEqual(new Set([1]))
    expect(join.getChildren(B)).toEqual(undefined)
    expect(join.getChildren(C)).toEqual(new Set([2, 3]))
    expect(join.getParent(1)).toBe(A)
    expect(join.getParent(2)).toBe(C)
    expect(join.getParent(3)).toBe(C)
  })
  it(`won't reassign a child to a new parent without force`, () => {
    const join = new Index1ToMany<string, number>()
    join.set(A, 1)
    join.set(B, 1, { force: false })
    expect(join.getChildren(A)).toEqual(new Set([1]))
    expect(join.getChildren(B)).toBe(undefined)
  })
  it(`can dissolve a group`, () => {
    const join = new Index1ToMany<string, number>()
    join.set(A, 1)
    join.set(A, 2)
    join.delete(A)
    expect(join.getChildren(A)).toBe(undefined)
    expect(join.getParent(1)).toBe(undefined)
    expect(join.getParent(2)).toBe(undefined)
  })
  it(`should warn you if you try to dissolve a nonexistent group`, () => {
    console.warn = () => undefined
    const warn = vitest.spyOn(global.console, `warn`)
    const join = new Index1ToMany<string, number>()
    join.delete(A, 1)
    expect(warn).toHaveBeenCalled()
  })
  it(`self serialize and deserialize`, () => {
    const original = new Index1ToMany<string, number>()
    original.set(A, 1)
    original.set(A, 2)
    const serialized = JSON.stringify(original.toJson())
    const deserialized = new Index1ToMany(JSON.parse(serialized))
    expect(typeof serialized).toBe(`string`)
    expect(original.getChildren(A)).toEqual(deserialized.getChildren(A))
  })
})
