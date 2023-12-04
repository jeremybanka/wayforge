import { fireEvent, render, waitFor } from "@testing-library/react"
import * as AR from "atom.io/react"
import type { FC } from "react"

import type { ƒn } from "atom.io"
import { atom } from "atom.io"
import { Observer } from "./__util__/Observer"

export const onChange = [() => undefined, console.log][0]

describe(`single atom`, () => {
	const setters: ƒn[] = []
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const letter = AR.useO(letterState)
			setters.push(setLetter)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<button
						type="button"
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
			</AR.StoreProvider>,
		)
		return { ...utils }
	}

	it(`accepts user input with externally managed state`, () => {
		const { getByTestId } = scenario()
		const changeStateButton = getByTestId(`changeStateButton`)
		fireEvent.click(changeStateButton)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
	})
})
