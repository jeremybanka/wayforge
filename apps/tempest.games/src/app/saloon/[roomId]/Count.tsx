import { span } from "src/components/<span>"

import scss from "./Count.module.scss"

export type CountProps = {
	amount: number
}
export function Count({ amount }: CountProps): JSX.Element {
	return (
		<span.diagon className={scss.class} data-css="count">
			{amount}
		</span.diagon>
	)
}
