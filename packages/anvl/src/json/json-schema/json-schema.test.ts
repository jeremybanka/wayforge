import { writeFileSync } from "fs"

import schema07 from "~/app/node/wayforge-server/projects/wayfarer/07.schema.json"

import {
  isJsonSchema,
  isJsonSchemaCore,
  dereference,
  refineJsonSchema,
} from "./json-schema"

describe(`isJsonSchema`, () => {
  it(`should recognize booleans as schemas`, () => {
    expect(isJsonSchema(true)).toBe(true)
    expect(isJsonSchema(false)).toBe(true)
  })
  it(`should validate the draft 7 meta schema as a schema`, () => {
    const result = isJsonSchema(schema07)
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
  it(`should refine a simple schema with a reference`, () => {
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
})
