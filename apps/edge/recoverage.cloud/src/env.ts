export type Bindings = {
	DB: D1Database
	GITHUB_CLIENT_ID: string
	GITHUB_CLIENT_SECRET: string
	COOKIE_SECRET: string
}

export const GITHUB_CALLBACK_ENDPOINT = `/oauth/github/callback`
