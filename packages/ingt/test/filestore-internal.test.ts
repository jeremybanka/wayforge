import { readdirSync } from "fs"

import mock from "mock-fs"

import { DEFAULT_FILESTORE_OPTIONS } from "../src/options"
import { initIndexer, initResourceReader } from "../src/read"
import { initResourceWriter } from "../src/write"

const write = initResourceWriter(DEFAULT_FILESTORE_OPTIONS)
const read = initResourceReader(DEFAULT_FILESTORE_OPTIONS)
const readIndex = initIndexer(DEFAULT_FILESTORE_OPTIONS)

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

  it(`writes a file`, async () => {
    await write({
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
