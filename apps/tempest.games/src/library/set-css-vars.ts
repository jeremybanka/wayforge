export function setCssVars(
	vars: Record<`--${string}`, number | string | undefined>,
): Partial<React.CSSProperties> {
	return vars as any
}
