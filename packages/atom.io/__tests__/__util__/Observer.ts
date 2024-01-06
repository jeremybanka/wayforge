import type * as AtomIO from "atom.io"
import * as ReactIO from "atom.io/react"
import * as React from "react"

export type ObserverProps = {
	node: AtomIO.WritableToken<any>
	onChange: (value: any) => void
}
export const Observer: React.FC<ObserverProps> = ({ node, onChange }) => {
	const value = ReactIO.useO(node)
	React.useEffect(() => onChange(value), [onChange, value])
	return null
}
