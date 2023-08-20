import type * as AtomIO from "atom.io"
import * as ReactIO from "atom.io/react"
import * as React from "react"

export type ObserverProps = {
	node: AtomIO.StateToken<any>
	onChange: (value: any) => void
	hooks?: ReactIO.StoreHooks
}
export const Observer: React.FC<ObserverProps> = ({
	node,
	onChange,
	hooks = {
		useI: ReactIO.useI,
		useO: ReactIO.useO,
		useIO: ReactIO.useIO,
	},
}) => {
	const [value] = hooks.useIO(node)
	React.useEffect(() => onChange(value), [onChange, value])
	return null
}
