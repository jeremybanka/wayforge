import { render } from "@testing-library/react"
import { ErrorBoundary } from "atom.io/react-devtools"
import type { FunctionComponent } from "react"

const NOT_A_FUNCTION = true
// @ts-expect-error (that's the point)
const throwTypeError = (): never => NOT_A_FUNCTION()
const ThrowOnRender: FunctionComponent = () => throwTypeError()

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
			<ErrorBoundary>
				<ThrowOnRender />
			</ErrorBoundary>,
		)
		const errorBoundary = utils.getByTestId(`error-boundary`) as HTMLDivElement
		return {
			errorBoundary,
			...utils,
		}
	},
}

it(`renders the text of the thrown error`, () => {
	expectedErrors = 2
	const { errorBoundary } = scenarios.componentThrowsOnRender()
	expect(errorBoundary.textContent).toContain(
		`⚠️ ThrowOnRender ⚠️ TypeError: NOT_A_FUNCTION is not a function`,
	)
})
