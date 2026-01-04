export function stringToColor(input: string): string {
	let hash = 0
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash |= 0 // Convert to 32-bit integer
	}
	let hexColor = (hash & 0xffffff).toString(16) // Reduce to 24-bit
	// Pad with zeros to ensure it's 6 digits long (24-bit)
	while (hexColor.length < 6) {
		hexColor = `0` + hexColor
	}
	return `#${hexColor}`
}
