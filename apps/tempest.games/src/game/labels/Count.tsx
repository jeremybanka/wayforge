import { span } from "tempest.games/components/<span>"

import scss from "./Count.module.scss"

export type CountProps = {
	amount: number
	minimal?: boolean
}
export function Count({ amount }: CountProps): JSX.Element {
	return (
		<span.diagon className={scss.class} data-css="count">
			{amount}
		</span.diagon>
	)
}
