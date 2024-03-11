import { fireEvent, render } from "@testing-library/react"
import type { WritableToken } from "atom.io"
import { useO } from "atom.io/react"
import type { FC } from "react"
import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"

import { Division } from "./components/Demos/Division"

export const onChange = [() => undefined, console.log][0]

export type ObserverProps = {
	node: WritableToken<any>
	onChange: (value: any) => void
}
export const Observer: FC<ObserverProps> = ({ node, onChange: handler }) => {
	const value = useO(node)
	useEffect(() => {
		handler(value)
	}, [handler, value])
	return null
}

describe(`App`, () => {
	it(`Shows a basic state graph in operation`, () => {
		const { getByTestId } = render(
			<BrowserRouter>
				<Division />
			</BrowserRouter>,
		)

		const incDividend = getByTestId(`dividendButton+`)
		const decDividend = getByTestId(`dividendButton-`)
		const incDivisor = getByTestId(`divisorButton+`)
		const decDivisor = getByTestId(`divisorButton-`)
		const incQuotient = getByTestId(`quotientButton+`)
		const decQuotient = getByTestId(`quotientButton-`)
		const dividend = getByTestId(`dividend`)
		const divisor = getByTestId(`divisor`)
		const quotient = getByTestId(`quotient`)

		expect(dividend.textContent).toContain(`1`)
		expect(divisor.textContent).toContain(`2`)
		expect(quotient.textContent).toContain(`.5`)

		fireEvent.click(incDividend)
		expect(dividend.textContent).toContain(`2`)
		expect(divisor.textContent).toContain(`2`)
		expect(quotient.textContent).toContain(`1`)

		fireEvent.click(incQuotient)
		expect(dividend.textContent).toContain(`4`)
		expect(divisor.textContent).toContain(`2`)
	})
})
