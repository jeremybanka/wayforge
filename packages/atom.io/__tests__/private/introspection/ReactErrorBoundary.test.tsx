import { render } from "@testing-library/react"
import { ErrorBoundary } from "atom.io/react-devtools"
import type { FunctionComponent } from "react"

beforeEach(() => {
	console.error = () => undefined
	vitest.spyOn(console, `error`)
})

const NOT_A_FUNCTION = true
// @ts-expect-error (that's the point)
const ThrowOnRender: FunctionComponent = () => NOT_A_FUNCTION()

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
	const { errorBoundary } = scenarios.componentThrowsOnRender()
	expect(errorBoundary.textContent).toContain(
		`⚠️ ThrowOnRender ⚠️ TypeError: NOT_A_FUNCTION is not a function`,
	)
	expect(console.error).toHaveBeenCalledTimes(1)
})
