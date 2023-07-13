import type { FC } from "react"
import { useEffect } from "react"

import { render, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"

import type { StateToken } from "~/packages/atom.io/src"

import { Division } from "./components/Demos/Division"
import { useO } from "./services/store"

export const onChange = [() => undefined, console.log][0]

export type ObserverProps = {
	node: StateToken<any>
	onChange: (value: any) => void
}
export const Observer: FC<ObserverProps> = ({ node, onChange }) => {
	const [value] = useO(node)
	useEffect(() => onChange(value), [onChange, value])
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
