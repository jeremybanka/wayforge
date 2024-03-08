import { KVStore } from "fastly:kv-store"
import render from "preact-render-to-string"

import * as form from "./<form>"
import * as html from "./<html>"
import * as main from "./<main>"
import { apologize } from "./apologize"
import { hashSHA256 } from "./hash"
import { userSchema } from "./schema"

addEventListener(`fetch`, (event) => {
	const request = event.request
	const url = new URL(request.url)
	const path = url.pathname.split(`/`).filter(Boolean)
	let response: Promise<Response> | Response
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
						response = request.text().then(async (requestText) => {
							try {
								const params = new URLSearchParams(requestText)
								const username = params.get(`username`)
								const password = params.get(`password`)
								if (username === null || password === null) throw 400
								const kvStore = new KVStore(`tempest_users`)
								const entry = await kvStore.get(username)
								if (entry === null) throw 401
								const entryText = await entry.text()
								const jsonBlob = JSON.parse(entryText)
								const user = userSchema.parse(jsonBlob)
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
