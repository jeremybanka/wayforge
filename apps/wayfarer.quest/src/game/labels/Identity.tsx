import { span } from "wayfarer.quest/components/<span>"

import scss from "./Identity.module.scss"

export type IdentityProps = { id: string }
export function Identity({ id }: IdentityProps): React.ReactNode {
	return (
		<span className={scss[`class`]} data-css="identity">
			{/* first three chars */}
			{id.slice(0, 3)}
		</span>
	)
}
