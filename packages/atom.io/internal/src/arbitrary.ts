let i = 0

export function arbitrary(random: () => number = Math.random): string {
	return `${i++}:${random().toString(36).slice(2)}`
}
