import { hasExactProperties } from "anvl/object"
import { isString } from "atom.io/json"
import { jwt, sign } from "hono/jwt"
import { Hono } from "hono/quick"
import { validator } from "hono/validator"
import { validator } from "hono/validator"
import * as html from "./<html>"
import * as main from "./<main>"
import { hashSHA256 } from "./hash"

const app = new Hono()
app.use(`/protected/*`, jwt({ secret: `YOUR_SECRET_KEY` }))

app.get(`/`, (c) => {
	return c.html(
		<html.body>
			<main.layout>
				<form>
					<button type="submit" class="primary" id="sign-up">
						Sign Up
					</button>
					<button
						type="submit"
						class="secondary"
						id="login"
						hx-get="/login"
						hx-select="#login"
						hx-swap="outerHTML"
					>
						Log In
					</button>
				</form>
			</main.layout>
		</html.body>,
	)
})

app.get(`/login`, (c) => {
	return c.html(
		<html.body>
			<main.layout>
				<form id="login" hx-post="/login" hx-swap="outerHTML">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						autocomplete="username"
					/>
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						autocomplete="current-password"
					/>
					<button type="submit" class="primary">
						Log In
					</button>
				</form>
			</main.layout>
		</html.body>,
	)
})

const users = {
	admin: {
		name: `Jeremy Banka`,
		username: `admin`,
		role: `admin`,
		hash: `40ad2a71bf6bed79078820bbb17d3c99a4876aa9c7911e2f40454c18f17cfcaa`,
		salt: 0.7755874590188496,
	},
}

const loginAttemptRequestBodyIsValid = hasExactProperties({
	password: isString,
	username: isString,
})

// Login route
app.post(
	`/login`,
	// validator(`form`, (value, c) => {
	// 	console.log(value)
	// 	if (!loginAttemptRequestBodyIsValid(value)) {
	// 		return c.text(`Invalid request`, 400)
	// 	}
	// 	return value
	// }),
	async (c) => {
		// console.log(c.req)
		const body = await c.req.parseBody()
		console.log(c.req.parseBody())
		if (!loginAttemptRequestBodyIsValid(body)) {
			return c.text(`json`, 400)
		}
		const { username, password } = body
		const user = users[username as keyof typeof users]
		if (!user) {
			return c.text(`Authentication failed`, 401)
		}
		const hash = await hashSHA256(password + user.salt)
		if (hash === user.hash) {
			const token = sign(
				{ username: user.username, role: user.role },
				`YOUR_SECRET_KEY`,
				`HS256`,
			)
			return c.json({ token })
		}

		return c.text(`Authentication failed`, 401)
	},
)

app.fire()
