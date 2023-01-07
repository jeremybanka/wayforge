import type { ResourceIdentifierObject } from "../../packages/Anvil/src/json/json-api"
import { extractPriorRelations } from "./json-fs.node"

describe(`extractPriorRelations`, () => {
  it(`should extract prior relations`, () => {
    const resourceIdentifier: ResourceIdentifierObject = {
      id: `1`,
      type: `rocket`,
    }
    const data = {
      id: `65`,
      type: `hangar`,
      rockets: [
        {
          id: `1`,
          type: `rocket`,
          meta: 3,
        },
      ],
    }
    const { data: newData, priorRelations } = extractPriorRelations(
      resourceIdentifier,
      data
    )
    expect(newData).toEqual({
      id: `65`,
      type: `hangar`,
      rockets: [],
    })
    expect(priorRelations).toEqual([
      {
        path: [`rockets`, 0],
        to: {
          id: `65`,
          type: `hangar`,
        },
        meta: 3,
      },
    ])
  })
})
