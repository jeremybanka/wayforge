import type { IncomingHttpHeaders, IncomingHttpStatusHeader } from "node:http2"
import { connect } from "node:http2"

const client = connect(`http://localhost:8080/`)

const req = client.request({
	":method": `POST`,
	":path": `/`,
	authorization: `Bearer secret`,
})

const response = await new Promise<{
	headers: IncomingHttpHeaders & IncomingHttpStatusHeader
	flags: number
}>((pass) => {
	req.on(`response`, (headers, flags) => {
		console.log(headers)
		pass({ headers, flags })
	})
	req.on(`error`, pass)
	req.end()
})
console.log(response)
process.exit(0)
