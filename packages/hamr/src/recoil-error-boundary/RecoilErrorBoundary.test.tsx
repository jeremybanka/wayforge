import { prettyDOM, render } from "@testing-library/react"
import { RecoilRoot } from "recoil"

import { RecoverableErrorBoundary } from "./RecoilErrorBoundary"
import { ThrowOnRender } from "../react-error-boundary"

let expectedErrors = 0
let actualErrors = 0
function onError(e) {
	e.preventDefault()
	actualErrors++
}

beforeEach(() => {
	expectedErrors = 0
	actualErrors = 0
	window.addEventListener(`error`, onError)
})

afterEach(() => {
	window.removeEventListener(`error`, onError)
	expect(actualErrors).toBe(expectedErrors)
	expectedErrors = 0
})

const scenarios = {
	componentThrowsOnRender: () => {
		const utils = render(
			<RecoilRoot>
				<RecoverableErrorBoundary>
					<ThrowOnRender />
				</RecoverableErrorBoundary>
				,
			</RecoilRoot>,
		)
		const errorBoundary = utils.getByTestId(`error-boundary`) as HTMLDivElement
		return {
			errorBoundary,
			...utils,
		}
	},
}

it(`renders the text of the thrown error`, () => {
	expectedErrors = 4
	const { errorBoundary } = scenarios.componentThrowsOnRender()
	expect(errorBoundary.textContent).toContain(
		`⚠️ ThrowOnRender ⚠️ TypeError: NOT_A_FUNCTION is not a function`,
	)
	console.log(prettyDOM(document))
})
