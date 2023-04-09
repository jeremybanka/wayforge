import { Perspective } from "../src"

describe(`createPerspective`, () => {
  it(`creates a new perspective`, () => {
    const perspective = new Perspective()
    expect(perspective).toBeDefined()
  })
})
