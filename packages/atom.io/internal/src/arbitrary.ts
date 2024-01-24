export function arbitrary(random: () => number = Math.random): string {
	return random().toString(36).slice(2)
}
