import { fireEvent, prettyDOM, render } from "@testing-library/react"
import type { FC } from "react"
import { useEffect } from "react"
import type { RecoilState, RecoilValueReadOnly } from "recoil"
import { atom, RecoilRoot, useRecoilState, useRecoilValue } from "recoil"
import { vitest } from "vitest"

import { Combo } from "./Combo"

const handleChange = vitest.fn()

type RecoilObserverProps = {
	node: RecoilState<any> | RecoilValueReadOnly<any>
	onChange: (value: any) => void
}
const RecoilObserver: FC<RecoilObserverProps> = ({ node, onChange }) => {
	const value = useRecoilValue(node)
	useEffect(() => {
		onChange(value)
	}, [onChange, value])
	return null
}

const lettersState = atom<string[]>({
	key: `letters`,
	default: [],
})

const scenarioA_Managed = () => {
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
			<RecoilObserver node={lettersState} onChange={handleChange} />
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
	const { inputSearch, getByLabelText } = scenarioA_Managed()
	fireEvent.change(inputSearch, { target: { value: `a` } })
	expect(inputSearch.value).toBe(`a`)
	expect(inputSearch.getElementsByTagName)

	const option = getByLabelText(`Choose`) as HTMLButtonElement
	fireEvent.click(option)
	expect(handleChange).toHaveBeenCalledWith([`a`])
})

const scenarioB_SelfManaged = () => {
	const SelfManaged: FC = () => (
		<Combo options={[`a`]} selectionsState={lettersState} />
	)
	const utils = render(
		<RecoilRoot>
			<RecoilObserver node={lettersState} onChange={handleChange} />
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
	const { inputSearch } = scenarioB_SelfManaged()
	fireEvent.change(inputSearch, { target: { value: `a` } })
	expect(inputSearch.value).toBe(`a`)
	expect(inputSearch.getElementsByTagName)

	fireEvent.keyDown(inputSearch, { key: `Enter`, code: `Enter` })
	expect(handleChange).toHaveBeenCalledWith([`a`])

	console.log(prettyDOM(document))
})
