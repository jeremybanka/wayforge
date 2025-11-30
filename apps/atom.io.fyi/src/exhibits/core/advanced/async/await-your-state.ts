import http from "node:http"

import type { Loadable } from "atom.io"
import { atom, getState, resetState } from "atom.io"

const server = http.createServer((req, res) => {
	let data: Uint8Array[] = []
	req
		.on(`data`, (chunk) => data.push(chunk))
		.on(`end`, () => {
			res.writeHead(200, { "Content-Type": `text/plain` })
			res.end(`The best way to predict the future is to invent it.`)
			data = []
		})
})
server.listen(3000)

export const quoteState = atom<Loadable<Error | string>>({
	key: `quote`,
	default: async () => {
		try {
			const response = await fetch(`http://localhost:3000`)
			return await response.text()
		} catch (thrown) {
			if (thrown instanceof Error) {
				return thrown
			}
			throw thrown
		}
	},
})

void getState(quoteState) // Promise { <pending> }
await getState(quoteState) // "The best way to predict the future is to invent it."
void getState(quoteState) // "The best way to predict the future is to invent it."
resetState(quoteState)
void getState(quoteState) // Promise { <pending> }
