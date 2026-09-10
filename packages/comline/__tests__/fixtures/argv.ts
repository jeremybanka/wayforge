/** Construct full runtime argv for parser tests. */
export function argv(...words: readonly string[]): string[] {
	return [`/runtime`, `/mycli`, ...words]
}
