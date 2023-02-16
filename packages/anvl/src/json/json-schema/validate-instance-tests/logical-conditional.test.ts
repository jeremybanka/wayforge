import { select } from "../../../object"
import type {
  BooleanSchema,
  ConditionalSchema,
  JsonSchema,
  NumberSchema,
} from "../json-schema"
import { validateBy } from "../validate-instance"

const trueFalse: BooleanSchema = { type: `boolean` }
const onlyFalse: BooleanSchema = { type: `boolean`, enum: [false] }
const number123: NumberSchema = { type: `number`, enum: [1, 2, 3] }

const validate = (instance: unknown) => ({
  by: (schema: JsonSchema) => validateBy(schema)(instance),
})

describe(`conditional validation: only IF`, () => {
  const onlyIf: ConditionalSchema = {
    if: trueFalse,
  }

  it(`validates no matter what, disregarding the condition`, () => {
    const instance = `hello, I am a string`
    expect(validate(instance).by(onlyIf)).toStrictEqual({
      isValid: true,
      violations: [],
    })
  })
})

describe(`conditional validation: IF THEN`, () => {
  const ifThen: ConditionalSchema = {
    if: trueFalse,
    then: onlyFalse,
  }

  it(`validates an instance that validates against the THEN option`, () => {
    const instance = false
    expect(validate(instance).by(ifThen)).toStrictEqual({
      isValid: true,
      violations: [],
    })
  })
  it(`does not validate an instance that fails to validate against the THEN option`, () => {
    const instance = true
    expect(validate(instance).by(ifThen)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            if: select(`type`)(trueFalse),
            then: select(`enum`)(onlyFalse),
          },
        },
      ],
    })
  })
})

describe(`conditional validation: IF ELSE`, () => {
  const ifElse: ConditionalSchema = {
    if: trueFalse,
    else: number123,
  }

  it(`validates an instance that validates against the ELSE option`, () => {
    const instance = 2
    expect(validate(instance).by(ifElse)).toStrictEqual({
      isValid: true,
      violations: [],
    })
  })
  it(`does not validate an instance that fails to validate against the ELSE option`, () => {
    const instance = `hello, I am a string`
    expect(validate(instance).by(ifElse)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            if: select(`type`)(trueFalse),
            else: select(`type`)(number123),
          },
        },
      ],
    })
  })
})

describe(`conditional validation: IF THEN ELSE`, () => {
  const ifThenElse: ConditionalSchema = {
    if: trueFalse,
    then: onlyFalse,
    else: number123,
  }

  it(`validates an instance that validates against the THEN option`, () => {
    const instance = false
    expect(validate(instance).by(ifThenElse)).toStrictEqual({
      isValid: true,
      violations: [],
    })
  })
  it(`does not validate an instance that fails to validate against the THEN option`, () => {
    const instance = true
    expect(validate(instance).by(ifThenElse)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            if: select(`type`)(trueFalse),
            then: select(`enum`)(onlyFalse),
          },
        },
      ],
    })
  })
  it(`validates an instance that validates against the ELSE option`, () => {
    const instance = 2
    expect(validate(instance).by(ifThenElse)).toStrictEqual({
      isValid: true,
      violations: [],
    })
  })
  it(`does not validate an instance that fails to validate against the ELSE option`, () => {
    const instance = `hello, I am a string`
    expect(validate(instance).by(ifThenElse)).toStrictEqual({
      isValid: false,
      violations: [
        {
          instance,
          schema: {
            if: select(`type`)(trueFalse),
            else: select(`type`)(number123),
          },
        },
      ],
    })
  })
})
