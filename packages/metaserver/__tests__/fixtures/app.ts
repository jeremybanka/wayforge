import { serve } from "bun"

const PORT = 3000

serve({
	port: PORT,
	fetch(req) {
		console.log(req)
		return new Response(`Hello World!`)
	},
})

console.log(`Now listening on http://localhost:${PORT}`)
