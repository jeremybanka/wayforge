import http from "http"
import { atom, getState } from "atom.io"
import { Loadable } from "atom.io/data"

const server = http.createServer((req, res) =>
	req.on(`end`, () => {
		res.writeHead(200, { "Content-Type": `text/plain` })
		res.end(`The best way to predict the future is to invent it.`)
	}),
)
server.listen(3000)

export const quoteState = atom<Loadable<string | Error>>({
	key: `quote`,
	default: async () => {
		try {
			const response = await fetch(`http://localhost:3000`)
			return response.text()
		} catch (thrown) {
			if (thrown instanceof Error) {
				return thrown
			}
			throw thrown
		}
	},
})

getState(quoteState) // Promise { <pending> }
await getState(quoteState) // "The best way to predict the future is to invent it."
getState(quoteState) // "The best way to predict the future is to invent it."
