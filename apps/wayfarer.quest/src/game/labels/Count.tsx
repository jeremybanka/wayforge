import { span } from "wayfarer.quest/components/<span>"

import scss from "./Count.module.scss"

export type CountProps = {
	amount: number
	minimal?: boolean
}
export function Count({ amount }: CountProps): React.ReactNode {
	return (
		<span.diagon className={scss[`class`]} data-css="count">
			{amount}
		</span.diagon>
	)
}
