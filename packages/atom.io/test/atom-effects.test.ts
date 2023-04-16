import { readFileSync, writeFileSync, readFile, writeFile } from "fs"

import mock from "mock-fs"
import { vitest } from "vitest"

import * as UTIL from "./-util"
import {
  __INTERNAL__,
  atom,
  atomFamily,
  configure,
  getState,
  setState,
} from "../src"

const loggers = [UTIL.silence, console] as const
const choose = 0
const logger = loggers[choose]

configure({ logger })

beforeEach(() => {
  __INTERNAL__.clearStore()
  vitest.spyOn(logger, `error`)
  vitest.spyOn(logger, `warn`)
  vitest.spyOn(logger, `info`)
  vitest.spyOn(UTIL, `stdout`)
  mock({
    "name.txt": `Mavis`,
  })
})

describe(`atom effects`, () => {
  it(`runs a function onSet`, () => {
    const findCoordinateState = atomFamily<{ x: number; y: number }, string>({
      key: `coordinate`,
      default: { x: 0, y: 0 },
      effects: (key) => [
        ({ onSet }) => {
          onSet((newValue) => {
            UTIL.stdout(`onSet`, key, newValue)
          })
        },
      ],
    })
    setState(findCoordinateState(`a`), { x: 1, y: 1 })
    expect(UTIL.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
      newValue: { x: 1, y: 1 },
      oldValue: { x: 0, y: 0 },
    })
  })
  it(`sets itself from the file-system, then writes to the filestore onSet`, () => {
    const nameState = atom<string>({
      key: `name`,
      default: ``,
      effects: [
        ({ setSelf, onSet }) => {
          const name = readFileSync(`name.txt`, `utf8`)
          setSelf(name)
          onSet((change) => {
            writeFileSync(`name.txt`, change.newValue)
          })
        },
      ],
    })
    expect(getState(nameState)).toBe(`Mavis`)
    setState(nameState, `Mavis2`)
    expect(readFileSync(`name.txt`, `utf8`)).toBe(`Mavis2`)
  })
  test(`effects can operate with asynchronous functions`, () => {
    const nameState = atom<string>({
      key: `name`,
      default: ``,
      effects: [
        ({ setSelf, onSet }) => {
          readFile(`name.txt`, `utf8`, (_, data) => {
            setSelf(data)
          })
          onSet((change) => {
            writeFile(`name.txt`, change.newValue, () => UTIL.stdout(`done`))
          })
        },
      ],
    })
    setTimeout(() => {
      expect(getState(nameState)).toBe(`Mavis`)
      setState(nameState, `Mavis2`)
      setTimeout(() => {
        expect(readFileSync(`name.txt`, `utf8`)).toBe(`Mavis2`)
        expect(UTIL.stdout).toHaveBeenCalledWith(`done`)
      }, 100)
    })
  })
})
