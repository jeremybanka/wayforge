import type { Endpoints } from "@octokit/types"
import type { DrizzleD1Database } from "drizzle-orm/d1"

import type * as Schema from "./schema"

type Bindings = {
	DB: D1Database
	GITHUB_CLIENT_ID: string
	GITHUB_CLIENT_SECRET: string
	COOKIE_SECRET: string
}
type Variables = {
	drizzle: DrizzleD1Database<typeof Schema>
	githubUserData: Endpoints[`GET /user`][`response`][`data`]
}
export type Env = { Bindings: Bindings; Variables: Variables }

export const GITHUB_CALLBACK_ENDPOINT = `/oauth/github/callback`
