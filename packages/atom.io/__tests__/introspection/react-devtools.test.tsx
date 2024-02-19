import { fireEvent, render } from "@testing-library/react"
import type { Logger, ƒn } from "atom.io"
import { atom } from "atom.io"
import * as Internal from "atom.io/internal"
import * as AR from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger
let iteration = 0

const templateStore = new Internal.Store(`template`, Internal.IMPLICIT.STORE)

beforeEach(() => {
	Internal.IMPLICIT.STORE_INTERNAL = new Internal.Store(
		`default_${iteration++}`,
		templateStore,
	)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})
const onChange = [() => undefined, console.log][0]

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
			<AR.StoreProvider store={Internal.IMPLICIT.STORE}>
				<Letter />
				<AtomIODevtools />
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
