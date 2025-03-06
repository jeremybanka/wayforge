import { optional, required } from "treetrunks"

import type { Roles } from "./laws"
import { Laws } from "./laws"

export type Role = Roles<typeof authorization>
export const authorization = new Laws({
	roles: [`free`],
	permissions: required({
		ownProjects: optional({
			upTo3: null,
			attachReports: optional({
				upTo3: null,
			}),
			attachTokens: optional({
				upTo12: null,
			}),
		}),
	}),
	rolePermissions: {
		free: new Set([
			`ownProjects_upTo3`,
			`ownProjects_attachReports_upTo3`,
			`ownProjects_attachTokens_upTo12`,
		]),
	},
})
