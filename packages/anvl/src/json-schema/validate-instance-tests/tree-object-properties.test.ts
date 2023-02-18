import { select } from "../../object"
import { Int } from "../integer"
import type { ReffedJsonSchema } from "../refs"
import { validateBy } from "../validate-instance"

const color = {
  $defs: {
    colorChannel: {
      type: `integer`,
      minimum: Int(0),
      maximum: Int(255),
    },
  },
  type: `object`,
  properties: {
    red: { $ref: `#/$defs/colorChannel` },
    green: { $ref: `#/$defs/colorChannel` },
    blue: { $ref: `#/$defs/colorChannel` },
  },
} as const satisfies ReffedJsonSchema

const validate = validateBy(color)

describe(`properties`, () => {
  it(`fails instances with a malformed property`, () => {
    const instance = {
      red: 255.1,
    }
    const expected = {
      isValid: false,
      violations: [
        {
          instance: select(`red`)(instance),
          schema: color.$defs.colorChannel,
        },
        {
          instance,
          schema: select(`properties`)(color),
        },
      ],
    }
    // expect(validate(instance)).toStrictEqual(expected)
  })
})
