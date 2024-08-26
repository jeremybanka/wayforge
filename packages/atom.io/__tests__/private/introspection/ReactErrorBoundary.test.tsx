import { render } from "@testing-library/react"
import { ErrorBoundary, RecoverableErrorBoundary } from "atom.io/react-devtools"
import type { FunctionComponent } from "react"

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
	recoverable: () => {
		const utils = render(
			<RecoverableErrorBoundary>
				<ThrowOnRender />
			</RecoverableErrorBoundary>,
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
})
