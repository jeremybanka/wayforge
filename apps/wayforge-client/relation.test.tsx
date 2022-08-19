// global.setImmediate = jest.useRealTimers as unknown as typeof setImmediate
import * as React from "react"

import { render } from "@testing-library/react"

import { RelationManager } from "../../logic/relation-manager"
import { App } from "./app"

describe(`App`, () => {
  it(`should render successfully`, () => {
    const { baseElement } = render(<App />)

    expect(baseElement).toBeTruthy()
  })
})

describe(`RelationManager`, () => {
  it(`can be found`, () => {
    // new RelationManager()
  })
})
