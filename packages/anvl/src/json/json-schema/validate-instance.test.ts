import { Int } from "./integer"
import type {
  BooleanSchema,
  IntegerSchema,
  JsonSchema,
  UnionSchema,
} from "./json-schema"
import { validateInstanceBy } from "./validate-instance"

const minMaxIntegerSchema: IntegerSchema = {
  type: `integer`,
  minimum: Int(2),
  maximum: Int(8),
}
const onlyTrueSchema: BooleanSchema = {
  type: `boolean`,
  enum: [true],
}

describe(`integer validation`, () => {
  it(`validates an integer instance against a schema`, () => {
    const a = Int(5)
    const b = Int(1)
    const c = Int(9)
    const validateInstance = validateInstanceBy(minMaxIntegerSchema)
    const aResult = validateInstance(a)
    const bResult = validateInstance(b)
    const cResult = validateInstance(c)
    console.log({ aResult, bResult, cResult })
    expect(aResult).toStrictEqual({ isValid: true, details: null })
    expect(bResult).toStrictEqual({
      isValid: false,
      details: {
        instance: b,
        schema: minMaxIntegerSchema,
        failedConstraints: { minimum: Int(2) },
      },
    })
    expect(cResult).toStrictEqual({
      isValid: false,
      details: {
        instance: c,
        schema: minMaxIntegerSchema,
        failedConstraints: { maximum: Int(8) },
      },
    })
  })
})

describe(`union validation`, () => {
  it(`validates a union instance against a schema`, () => {
    const schema: JsonSchema = {
      anyOf: [minMaxIntegerSchema, onlyTrueSchema],
    }
    const a = Int(5)
    const b = Int(1)
    const c = Int(9)
    const d = true
    const e = false
    const validate = validateInstanceBy(schema)
    const aResult = validate(a)
    const bResult = validate(b)
    const cResult = validate(c)
    const dResult = validate(d)
    const eResult = validate(e)
    console.log({ aResult, bResult, cResult, dResult, eResult })
    expect(aResult).toStrictEqual({ isValid: true, details: null })
    expect(bResult).toStrictEqual({
      isValid: false,
      details: {
        instance: b,
        schema,
        failedConstraints: { anyOf: [minMaxIntegerSchema, onlyTrueSchema] },
      },
    })
    expect(cResult).toStrictEqual({
      isValid: false,
      details: {
        instance: c,
        schema,
        failedConstraints: { anyOf: [minMaxIntegerSchema, onlyTrueSchema] },
      },
    })
    expect(dResult).toStrictEqual({ isValid: true, details: null })
    expect(eResult).toStrictEqual({
      isValid: false,
      details: {
        instance: e,
        schema,
        failedConstraints: { anyOf: [minMaxIntegerSchema, onlyTrueSchema] },
      },
    })
  })
})
