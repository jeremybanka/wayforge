import type { FC } from "react"

import { render, fireEvent } from "@testing-library/react"
import * as AR from "atom.io/react"

import { Observer } from "./__util__/Observer"
import { isDefault, atom } from "../src"

const { useIO } = AR.composeStoreHooks()

export const onChange = [() => undefined, console.log][0]

describe(`single atom`, () => {
  const scenario = () => {
    const letterState = atom<string>({
      key: `letter`,
      default: `A`,
    })
    const Letter: FC = () => {
      const [letter, setLetter] = useIO(letterState)
      const isDefaultLetter = isDefault(letterState)
      return (
        <>
          <div data-testid={letter}>{letter}</div>
          <div data-testid={isDefaultLetter}>{isDefaultLetter}</div>
          <button
            onClick={() => setLetter(`B`)}
            data-testid="changeStateButton"
          />
        </>
      )
    }
    const utils = render(
      <AR.StoreProvider>
        <Observer node={letterState} onChange={onChange} />
        <Letter />
      </AR.StoreProvider>
    )
    return { ...utils }
  }

  it(`accepts user input with externally managed state`, () => {
    const { getByTestId } = scenario()
    expect(getByTestId(`true`)).toBeTruthy()
    const changeStateButton = getByTestId(`changeStateButton`)
    fireEvent.click(changeStateButton)
    const option = getByTestId(`B`)
    expect(option).toBeTruthy()
    expect(getByTestId(`false`)).toBeTruthy()
  })
})
