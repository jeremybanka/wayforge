import { fireEvent, prettyDOM, render } from "@testing-library/react"
import type { FC } from "react"
import { useEffect } from "react"
import type { RecoilState, RecoilValueReadOnly } from "recoil"
import { RecoilRoot, atom, useRecoilState, useRecoilValue } from "recoil"
import { vitest } from "vitest"

import { Combo } from "./Combo"

export const onChange = vitest.fn()

export type RecoilObserverProps = {
	node: RecoilState<any> | RecoilValueReadOnly<any>
	onChange: (value: any) => void
}
export const RecoilObserver: FC<RecoilObserverProps> = ({
	node,
	onChange: handler,
}) => {
	const value = useRecoilValue(node)
	useEffect(() => {
		handler(value)
	}, [handler, value])
	return null
}

const lettersState = atom<string[]>({
	key: `letters`,
	default: [],
})

const externallyManagedScenario = () => {
	const Managed: FC = () => {
		const [letters, setLetters] = useRecoilState(lettersState)
		return (
			<main>
				<Combo options={[`a`]} selections={letters} setSelections={setLetters} />
			</main>
		)
	}
	const utils = render(
		<RecoilRoot>
			<RecoilObserver node={lettersState} onChange={onChange} />
			<Managed />
		</RecoilRoot>,
	)
	const combo = utils.getByLabelText(`Multiple Choice`) as HTMLDivElement
	const inputSearch = utils.getByLabelText(`Search`) as HTMLInputElement
	return {
		combo,
		inputSearch,
		...utils,
	}
}

it(`accepts user input with externally managed state`, () => {
	const { inputSearch, getByLabelText } = externallyManagedScenario()
	fireEvent.change(inputSearch, { target: { value: `a` } })
	expect(inputSearch.value).toBe(`a`)
	expect(inputSearch.getElementsByTagName)

	const option = getByLabelText(`Choose`) as HTMLButtonElement
	fireEvent.click(option)
	expect(onChange).toHaveBeenCalledWith([`a`])
})

const selfManagedScenario = () => {
	const SelfManaged: FC = () => (
		<Combo options={[`a`]} selectionsState={lettersState} />
	)
	const utils = render(
		<RecoilRoot>
			<RecoilObserver node={lettersState} onChange={onChange} />
			<SelfManaged />
		</RecoilRoot>,
	)
	const combo = utils.getByLabelText(`Multiple Choice`) as HTMLDivElement
	const inputSearch = utils.getByLabelText(`Search`) as HTMLInputElement
	return {
		combo,
		inputSearch,
		...utils,
	}
}

it(`accepts user input with internally managed state`, () => {
	const { inputSearch } = selfManagedScenario()
	fireEvent.change(inputSearch, { target: { value: `a` } })
	expect(inputSearch.value).toBe(`a`)
	expect(inputSearch.getElementsByTagName)

	fireEvent.keyDown(inputSearch, { key: `Enter`, code: `Enter` })
	expect(onChange).toHaveBeenCalledWith([`a`])

	console.log(prettyDOM(document))
})
