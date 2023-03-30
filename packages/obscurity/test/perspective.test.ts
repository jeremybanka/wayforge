import { createPerspective } from "../src"

describe(`createPerspective`, () => {
  it(`creates a new perspective`, () => {
    const perspective = createPerspective()
    expect(perspective).toBeDefined()
  })
})
