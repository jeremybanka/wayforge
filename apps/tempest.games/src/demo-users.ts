export type User = {
	name: string
	username: string
	role: `admin` | `user`
	hash: string
	salt: number
}

export const users: Record<string, User> = {
	admin: {
		name: `Jeremy Banka`,
		username: `admin`,
		role: `admin`,
		hash: `40ad2a71bf6bed79078820bbb17d3c99a4876aa9c7911e2f40454c18f17cfcaa`,
		salt: 0.7755874590188496,
	},
}
