import { randomUUID } from "node:crypto"

import { getState } from "atom.io"
import { eq } from "drizzle-orm"

import { users, userSessions } from "../database/tempest-db-schema"
import { usernameType } from "../library/data-constraints"
import { usernameAtoms } from "../library/username-state"
import { db } from "./db"
import { sessionMiddleware } from "./websockets"

// Vitest runs on Node; only the Bun cookie reader needs a runtime substitute.
vi.mock(`bun`, () => ({
	CookieMap: class {
		private readonly values: Map<string, string>
		public constructor(cookie: string) {
			this.values = new Map(
				cookie.split(`;`).map((part) => {
					const [name, ...value] = part.trim().split(`=`)
					return [name, value.join(`=`)]
				}),
			)
		}
		public get(name: string): string | null {
			return this.values.get(name) ?? null
		}
	},
}))

test(`authenticated usernames are ready before synchronous room permissions mount`, async () => {
	const id = randomUUID()
	const sessionKey = randomUUID()
	const username = usernameType.assert(`host${id.slice(0, 8)}`)
	const email = `${id}@example.test`
	await db.drizzle.insert(users).values({
		id,
		username,
		emailOffered: email,
		emailVerified: email,
		createdIp: `127.0.0.1`,
	})
	try {
		await db.drizzle.insert(userSessions).values({ sessionKey, userId: id })
		const userKey = await sessionMiddleware({
			auth: { username },
			headers: { cookie: `sessionKey=${sessionKey}` },
			time: new Date().toISOString(),
			address: `127.0.0.1`,
			xdomain: false,
			secure: false,
			issued: Date.now(),
			url: `/socket.io/`,
			query: {},
		})
		expect(userKey).toBe(`user::${id}`)
		// Reading immediately would previously start an asynchronous username lookup
		// and return the user-key fallback while room services checked permissions.
		expect(getState(usernameAtoms, `user::${id}`)).toBe(username)
	} finally {
		await db.drizzle.delete(users).where(eq(users.id, id))
	}
})
