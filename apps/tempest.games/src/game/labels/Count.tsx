import { span } from "src/components/<span>"

import scss from "./Count.module.scss"

export type CountProps = {
	amount: number
	minimal?: boolean
}
export function Count({ amount, minimal }: CountProps): JSX.Element {
	return (
		<span.diagon className={scss.class} data-css="count">
			{amount}
		</span.diagon>
	)
}
