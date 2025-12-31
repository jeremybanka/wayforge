import { atomFamily } from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { eq } from "drizzle-orm"

import { users } from "../database/tempest-db-schema"
import type { Username } from "./data-constraints"
import { IS_SERVER } from "./env"

export const usernameAtoms = atomFamily<Username, UserKey>({
	key: `usernames`,
	default: (userKey) => userKey.slice(6, 12) as Username,
	effects: (userKey) => [
		({ setSelf }) => {
			if (IS_SERVER) {
				const rawUserId = userKey.replace(/^user::/, ``)
				void import(`@backend/db`).then(({ db }) =>
					db.drizzle.query.users
						.findFirst({
							columns: { username: true },
							where: eq(users.id, rawUserId),
						})
						.then((user) => {
							if (user) {
								setSelf(user.username)
							}
						}),
				)
			}
		},
	],
})
