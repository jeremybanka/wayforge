import { readdirSync } from "fs"

import mock from "mock-fs"

import { DEFAULT_JSON_STORE_OPTIONS } from "./core"
import { initIndexer, initReader } from "./file-manager/read.node"
import { initWriter } from "./file-manager/write.node"

const write = initWriter(DEFAULT_JSON_STORE_OPTIONS)
const read = initReader(DEFAULT_JSON_STORE_OPTIONS)
const readIndex = initIndexer(DEFAULT_JSON_STORE_OPTIONS)

describe(`read script`, () => {
  beforeEach(() => {
    mock({
      json: {
        whatever: {
          "foo.json": `{ "id": "foo", "type": "whatever", "bar": "baz" }`,
        },
      },
    })
  })

  it(`reads a file`, () => {
    const result = read({ id: `foo`, type: `whatever` })
    expect(result).toEqual({ id: `foo`, type: `whatever`, bar: `baz` })
  })

  it(`writes a file`, () => {
    write({
      id: `new`,
      type: `whatever`,
      value: { id: `new`, type: `whatever`, bar: `baz` },
    })
    console.log(readdirSync(`./json`))
    const result = read({ id: `new`, type: `whatever` })
    expect(result).toEqual({ id: `new`, type: `whatever`, bar: `baz` })
  })

  it(`reads the index`, () => {
    const result = readIndex({ type: `whatever` })
    expect(result).toEqual([`foo`])
  })

  afterEach(() => {
    mock.restore()
  })
})
