/* eslint-disable max-lines */

import schema07 from "~/app/node/wayforge-server/projects/wayfarer/07.schema.json"

import {
  isJsonSchema,
  isJsonSchemaCore,
  dereference,
  refineJsonSchema,
  isJsonSchemaRoot,
  isMixedSchema,
  isJsonSchemaRef,
  isArraySchema,
  arraySchemaStructure,
  unionSchemaStructure,
  mixedSchemaStructure,
} from "./json-schema"

describe(`isJsonSchema`, () => {
  it(`should recognize booleans as schemas`, () => {
    expect(isJsonSchema(true)).toBe(true)

    expect(isJsonSchema(false)).toBe(true)
  })
  it(`should validate the draft 7 meta schema as a schema`, () => {
    const result = isJsonSchema(schema07)
    console.log({
      isJsonSchemaRoot: isJsonSchemaRoot(schema07),
      isJsonSchemaCore: isJsonSchemaCore(schema07),
      isMixedSchema: isMixedSchema(schema07),
      properties: {
        fitsMixedSchema: mixedSchemaStructure.properties(schema07.properties),
      },
    })
    for (const [key, value] of Object.entries(mixedSchemaStructure)) {
      console.log({ key, matches: value(schema07[key]) })
    }
    const failingCases = Object.entries(schema07.properties)
      .map(([key, value]) => {
        const isRef = isJsonSchemaRef(value)
        const isSch = isJsonSchema(value)
        const isValid = isRef || isSch
        return [+isValid, { key, c: +isSch, r: +isRef }]
      })
      .filter(([key]) => key === 0)
    failingCases.forEach(([key, value]) => console.log(key, value))
    console.log({ failingCases: failingCases.length })
    console.log(`type`, schema07.properties.type, {
      isJsonSchema: isJsonSchema(schema07.properties.type),
    })
    const failingTypeCases = Object.entries(unionSchemaStructure).map(
      ([key, value]) =>
        console.log(`type.${key}`, value(schema07.properties.type[key]))
    )
    console.log({ 0: isJsonSchemaRef(schema07.properties.type.anyOf[0]) })
    console.log({ 1: isJsonSchema(schema07.properties.type.anyOf[1]) })
    console.log({ 1: isArraySchema(schema07.properties.type.anyOf[1]) })

    console.log(`type.anyOf[1]`, schema07.properties.type.anyOf[1], {
      isJsonSchema: isJsonSchema(schema07.properties.type),
    })
    const failingTypeAnyOf1Cases = Object.entries(arraySchemaStructure).map(
      ([key, value]) =>
        console.log(
          `type.anyOf[1].${key}`,
          value(schema07.properties.type.anyOf[1][key])
        )
    )
    expect(result).toBe(true)
  })
})

describe(`dereference`, () => {
  it(`should dereference a simple object`, () => {
    const result = dereference({ a: 1, b: { $ref: `#/a` } })
    expect(result).toStrictEqual({ a: 1, b: 1 })
  })
  it(`should dereference a simple array`, () => {
    const result = dereference([1, { $ref: `#/0` }])
    expect(result).toStrictEqual([1, 1])
  })
  it(`should dereference a simple array with a reference to a parent`, () => {
    const result = dereference([1, { $ref: `#` }])
    const expected: unknown[] = [1]
    expected.push(expected)
    expect(result).toStrictEqual(expected)
  })
  it(`should dereference schema 7`, () => {
    const result = dereference(schema07)
    // console.log({ result })
    expect(result).toStrictEqual(schema07)
  })
})

describe(`refineJsonSchema`, () => {
  it(`should refine a simple schema`, () => {
    const result = refineJsonSchema({ type: `string` })
    expect(result).toStrictEqual([{ type: `string`, data: { type: `string` } }])
  })
  it(`refines a mixed schema`, () => {
    const result = refineJsonSchema({
      type: [`object`, `string`],
      properties: {
        a: { type: `string` },
        b: { type: `number` },
      },
      maxLength: 10,
    })
    // console.log({ result })
    expect(result).toStrictEqual([
      {
        type: `object`,
        data: {
          type: `object`,
          properties: {
            a: { type: `string` },
            b: { type: `number` },
          },
        },
      },
      {
        type: `string`,
        data: {
          type: `string`,
          maxLength: 10,
        },
      },
    ])
  })
  it(`refines a simple schema with a reference`, () => {
    const result = refineJsonSchema({
      description: `A flavor of stuff in the world.`,
      type: `object`,
      properties: {
        color: {
          description: `The main color of the energy, the color of its icon and the seed for the background of its cards.`,
          $ref: `#/definitions/color`,
        },
      },
      definitions: {
        color: {
          type: `object`,
          properties: {
            hue: {
              type: `number`,
              description: `The hue of the color.`,
            },
            sat: {
              type: `number`,
              description: `The saturation of the color.`,
            },
            lum: {
              type: `number`,
              description: `The luminosity of the color.`,
            },
            prefer: {
              type: `string`,
              enum: [`sat`, `lum`],
              description: `Which is more important when rendering this color.`,
            },
          },
          required: [`hue`, `sat`, `lum`, `prefer`],
        },
      },
    })
    expect(result).toStrictEqual([
      {
        type: `object`,
        data: {
          type: `object`,
          description: `A flavor of stuff in the world.`,
          properties: {
            color: {
              type: `object`,
              required: [`hue`, `sat`, `lum`, `prefer`],
              description: `The main color of the energy, the color of its icon and the seed for the background of its cards.`,
              properties: {
                hue: {
                  type: `number`,
                  description: `The hue of the color.`,
                },
                sat: {
                  type: `number`,
                  description: `The saturation of the color.`,
                },
                lum: {
                  type: `number`,
                  description: `The luminosity of the color.`,
                },
                prefer: {
                  type: `string`,
                  enum: [`sat`, `lum`],
                  description: `Which is more important when rendering this color.`,
                },
              },
            },
          },
          definitions: {
            color: {
              type: `object`,
              description: `The main color of the energy, the color of its icon and the seed for the background of its cards.`,
              properties: {
                hue: {
                  type: `number`,
                  description: `The hue of the color.`,
                },
                sat: {
                  type: `number`,
                  description: `The saturation of the color.`,
                },
                lum: {
                  type: `number`,
                  description: `The luminosity of the color.`,
                },
                prefer: {
                  type: `string`,
                  enum: [`sat`, `lum`],
                  description: `Which is more important when rendering this color.`,
                },
              },
              required: [`hue`, `sat`, `lum`, `prefer`],
            },
          },
        },
      },
    ])
  })
  // it(`refines schema 7`, () => {
  //   const result = refineJsonSchema(schema07)
  //   // expect(result).toStrictEqual()
  // })
})

describe(`validateWithSchema`, () => {
  it(`should produce a function to validate a simple object`, () => {
    const result = validateWithSchema({ a: 1, b: 2 }, { type: `object` })
    expect(result).toBe(true)
  })
})
