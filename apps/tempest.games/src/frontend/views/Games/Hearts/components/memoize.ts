import * as React from "react"

export function memoize<Props>(
	displayName: string,
	component: React.ComponentType<Props>,
): React.MemoExoticComponent<React.ComponentType<Props>> {
	const memoized = React.memo(component)
	memoized.displayName = displayName
	return memoized
}
