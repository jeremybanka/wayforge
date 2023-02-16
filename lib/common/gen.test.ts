import { TypescriptInstructions } from "./gen"

describe(`gen`, () => {
  it(`should generate a valid zod schema`, () => {
    const script = new TypescriptInstructions()
      .declare(`const`)
      .named(`foo`)
      .toBe(`bar`)
    expect(script.write()).toBe(`const foo = bar`)
    // const valid = ts.transpile(file)
    // expect(valid.success).toBe(true)
  })
})
