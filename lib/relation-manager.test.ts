import { RelationManager } from "./relation-manager"

describe(`RelationManager`, () => {
  it(`can be found`, () => {
    expect(RelationManager).toBeDefined()
  })
  it(`can be constructed`, () => {
    const manager = new RelationManager({
      config: {
        reagents: `energy`,
        products: `energy`,
      },
      relations: {
        a: {
          members: {
            reagents: [{ data: 1, id: `fire` }],
            products: [{ data: 1, id: `water` }],
          },
          data: {
            time: 1,
            timeUnits: `s`,
          },
        },
      },
    })
    console.log(manager.toJSON().relations)
    expect(manager).toBeDefined()
  })
})
