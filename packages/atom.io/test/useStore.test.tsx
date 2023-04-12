import type { FC } from "react"
import { useEffect, useState } from "react"

import { render, fireEvent } from "@testing-library/react"
import { vitest } from "vitest"

import type { StateToken } from "../src"
import { ReadonlyValueToken, setState, atom } from "../src"
import { composeStoreHook } from "../src/react"

const { useStore } = composeStoreHook({ useState, useEffect })

export const onChange = console.log

export type ObserverProps = {
  node: StateToken<any>
  onChange: (value: any) => void
}
export const Observer: FC<ObserverProps> = ({ node, onChange }) => {
  const value = useStore(node)
  useEffect(() => onChange(value), [onChange, value])
  return null
}

const lettersState = atom<string[]>({
  key: `letters`,
  default: [`A`],
})

const scenarioA_Managed = () => {
  const Managed: FC = () => {
    const [letters, setLetters] = useStore(lettersState)
    return (
      <manager is="div">
        {letters.map((letter) => (
          <div key={letter} data-testid={letter}>
            {letter}
          </div>
        ))}
      </manager>
    )
  }
  const utils = render(
    <>
      <Observer node={lettersState} onChange={onChange} />
      <Managed />
    </>
  )
  const combo = utils.getByTestId(`A`) as HTMLDivElement
  return {
    combo,
    ...utils,
  }
}

it(`accepts user input with externally managed state`, () => {
  const { getByTestId } = scenarioA_Managed()
  setState(lettersState, [`B`])
  const option = getByTestId(`B`)
  expect(option).toBeTruthy()
})
