import { Int } from "../integer"
import type { NegationSchema, StringSchema } from "../json-schema"
import { validateBy } from "../validate-instance"

const stringWithMaxLength2: StringSchema = {
  type: `string`,
  maxLength: Int(2),
}

describe(`logical negation`, () => {
  const negated: NegationSchema = {
    not: stringWithMaxLength2,
  }
  it(`should fail when the negated schema passes`, () => {
    expect(validateBy(negated)(`hi`)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance: `hi`,
          // problem: `this schema was able to validate the instance`,
          schema: negated,
        },
      ],
    })
  })
})
