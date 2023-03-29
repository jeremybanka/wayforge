import { Perspective } from "../src"

describe(`Perspective`, () => {
  describe(`constructor`, () => {
    it(`creates a new perspective`, () => {
      const p = new Perspective()
      expect(p).toBeInstanceOf(Perspective)
    })
  })
})
