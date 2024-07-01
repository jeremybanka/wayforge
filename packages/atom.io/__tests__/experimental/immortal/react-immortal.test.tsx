import { fireEvent, render } from "@testing-library/react"
import type { CtorToolkit, Func, Logger } from "atom.io"
import {
	atomFamily,
	makeMolecule,
	makeRootMolecule,
	moleculeFamily,
} from "atom.io"
import * as Internal from "atom.io/internal"
import * as AR from "atom.io/react"
import type { FC } from "react"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.config.lifespan = `immortal`
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

describe(`family usage`, () => {
	const setters: Func[] = []
	const scenario = () => {
		const letterAtoms = atomFamily<string, string>({
			key: `letter`,
			default: `A`,
		})
		const componentMolecules = moleculeFamily({
			key: `component`,
			new: class Component {
				public constructor(
					tools: CtorToolkit<string>,
					public key: string,
					public letterState = tools.bond(letterAtoms),
				) {}
			},
		})

		const Letter: FC = () => {
			const setLetter = AR.useI(letterAtoms, `letter`)
			const letter = AR.useO(letterAtoms, `letter`)
			setters.push(setLetter)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeStateButton"
					/>
				</>
			)
		}
		function run() {
			return render(
				<AR.StoreProvider>
					<Letter />
				</AR.StoreProvider>,
			)
		}
		return { run, componentMolecules }
	}

	it(`successfully finds a state preexisting in the store`, () => {
		const { run, componentMolecules } = scenario()
		const rootMolecule = makeRootMolecule(`root`)
		makeMolecule(rootMolecule, componentMolecules, `letter`)
		const { getByTestId } = run()
		const changeStateButton = getByTestId(`changeStateButton`)
		fireEvent.click(changeStateButton)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
	})

	it(`throws an error if the state is not found`, () => {
		const { run } = scenario()
		expect(run).toThrowError(
			`Atom Family "letter" member "letter" not found in store "IMPLICIT_STORE".`,
		)
	})
})
