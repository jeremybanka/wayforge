import type { FC } from "react"
import { useEffect, useState } from "react"

import { render, fireEvent } from "@testing-library/react"

import type { StateToken } from "../src"
import { atom } from "../src"
import { composeStoreHook } from "../src/react"

const { useStore } = composeStoreHook({ useState, useEffect })

export const onChange = [() => undefined, console.log][0]

export type ObserverProps = {
  node: StateToken<any>
  onChange: (value: any) => void
}
export const Observer: FC<ObserverProps> = ({ node, onChange }) => {
  const [value] = useStore(node)
  useEffect(() => onChange(value), [onChange, value])
  return null
}

describe(`single atom`, () => {
  const scenario = () => {
    const letterState = atom<string>({
      key: `letter`,
      default: `A`,
    })
    const Letter: FC = () => {
      const [letter, setLetter] = useStore(letterState)
      return (
        <>
          <div data-testid={letter}>{letter}</div>
          <button
            onClick={() => setLetter(`B`)}
            data-testid="changeStateButton"
          />
        </>
      )
    }
    const utils = render(
      <>
        <Observer node={letterState} onChange={onChange} />
        <Letter />
      </>
    )
    return { ...utils }
  }

  it(`accepts user input with externally managed state`, () => {
    const { getByTestId } = scenario()
    const changeStateButton = getByTestId(`changeStateButton`)
    fireEvent.click(changeStateButton)
    const option = getByTestId(`B`)
    expect(option).toBeTruthy()
  })
})
