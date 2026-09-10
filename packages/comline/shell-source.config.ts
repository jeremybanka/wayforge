import { readFileSync } from "node:fs"

// Bun handles `with { type: "text" }` natively. Vite and tsdown use this loader
// so all three consume the same shell files and embed them without runtime I/O.
export const shellSource: {
	name: string
	load: (id: string) => string | undefined
} = {
	name: `comline-shell-source`,
	load(id) {
		if (/\/shells\/completion\.(bash|zsh|fish)$/.test(id)) {
			return `export default ${JSON.stringify(readFileSync(id, `utf8`))}`
		}
	},
}
