import render from "preact-render-to-string"

import * as form from "./<form>"
import * as html from "./<html>"
import * as main from "./<main>"
import { apologize } from "./apologize"
import { users } from "./demo-users"
import { hashSHA256 } from "./hash"

addEventListener(`fetch`, (event) => {
	const request = event.request
	const url = new URL(request.url)
	const path = url.pathname.split(`/`).filter(Boolean)
	let response: Response | Promise<Response>
	try {
		switch (request.method) {
			case `GET`:
				switch (path[0]) {
					case undefined: {
						const text = render(
							<html.body>
								<main.layout>
									<form.welcome />
								</main.layout>
							</html.body>,
						)
						response = new Response(text, {
							status: 200,
							headers: { "Content-Type": `text/html` },
						})
						break
					}
					case `login`: {
						response = new Response(
							render(
								<html.body>
									<main.layout>
										<form.login />
									</main.layout>
								</html.body>,
							),
							{
								status: 200,
								headers: { "Content-Type": `text/html` },
							},
						)
						break
					}
					default:
						throw 404
				}
				break
			case `POST`:
				switch (path[0]) {
					case `login`: {
						// formData() seems broken between htmx-fastly so use text() instead
						response = request.text().then(async (text) => {
							try {
								const params = new URLSearchParams(text)
								const username = params.get("username")
								const password = params.get("password")
								if (username === null || password === null) throw 400
								if (!(username in users)) throw 401
								const user = users[username]
								const hash = await hashSHA256(password + user.salt)
								if (user.hash !== hash) throw 401
								return new Response(null, {
									status: 204,
									headers: { "Set-Cookie": `username=${username}` },
								})
							} catch (thrown) {
								return apologize(thrown)
							}
						})
						break
					}
					default:
						throw 404
				}
				break
			default:
				throw 405
		}
		event.respondWith(response)
	} catch (thrown) {
		response = apologize(thrown)
		event.respondWith(response)
	}
})
