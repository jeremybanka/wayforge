/* eslint-disable max-lines */

import schema07 from "./07.schema.json"
import { dereference } from "./dereference"
import { refineJsonSchema } from "./refine-schema"

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
    expect(Boolean(result)).toBe(true)
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

// const validateWithSchema = (schema: JsonSchema) => {
//   const refinedSchema = refineJsonSchema(schema)
//   return (value: unknown) => {
//     if (refinedSchema.length === 1) {
//       return validate(refinedSchema[0].data, value)
//     }
//     return refinedSchema.some((refined) => validate(refined.data, value))
//   }
// }

// describe(`validateWithSchema`, () => {
//   it(`should produce a function to validate a simple object`, () => {
//     const result = validateWithSchema({ type: `object` })
//     expect(result({})).toBe(true)
//     expect(result(``)).toBe(false)
//   })
// })

// input: unknown
// validateSchema:
