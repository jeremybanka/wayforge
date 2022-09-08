import { schemaToTemplate } from "./json-schema"

describe(`schemaToTemplate`, () => {
  it(`should convert a boolean schema to a template`, () => {
    expect(schemaToTemplate(true)).toEqual({})
    expect(schemaToTemplate(false)).toBeNull()
  })
  it(`should convert a number schema to a template`, () => {
    expect(schemaToTemplate({ type: `number` })).toBe(0)
    expect(schemaToTemplate({ type: `integer` })).toBe(0)
  })
  it(`should convert a string schema to a template`, () => {
    expect(schemaToTemplate({ type: `string` })).toBe(``)
  })
  it(`should convert a null schema to a template`, () => {
    expect(schemaToTemplate({ type: `null` })).toBeNull()
  })
  it(`should convert an array schema to a template`, () => {
    expect(schemaToTemplate({ type: `array` })).toEqual([])
    expect(
      schemaToTemplate({ type: `array`, items: { type: `number` } })
    ).toEqual([0])
  })
  it(`should convert an object schema to a template`, () => {
    expect(schemaToTemplate({ type: `object` })).toEqual({})
    expect(
      schemaToTemplate({
        type: `object`,
        properties: { foo: { type: `number` } },
      })
    ).toEqual({ foo: 0 })
  })
})
