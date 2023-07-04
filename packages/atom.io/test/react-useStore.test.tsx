import type { FC } from "react"

import { render, fireEvent } from "@testing-library/react"

import { Observer } from "./__util__/Observer"
import { isDefault, atom } from "../src"
import { composeStoreHooks } from "../src/react"

const { useIO } = composeStoreHooks()

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
      <>
        <Observer node={letterState} onChange={onChange} />
        <Letter />
      </>
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
