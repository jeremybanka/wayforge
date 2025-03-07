import type { Permissions, Roles } from "jurist"
import { Escalator, Laws, optional, required } from "jurist"

export type Role = Roles<typeof authorization>
export type Permission = Permissions<typeof authorization>
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

export const projectsAllowed = new Escalator({
	style: `untilMiss`,
	laws: authorization,
	permissionData: [[`ownProjects_upTo3`, 3]] as const,
	fallback: 0 as const,
})

export const tokensAllowed = new Escalator({
	style: `untilMiss`,
	laws: authorization,
	permissionData: [[`ownProjects_attachTokens_upTo12`, 12]] as const,
	fallback: 0 as const,
})

export const reportsAllowed = new Escalator({
	style: `untilMiss`,
	laws: authorization,
	permissionData: [[`ownProjects_attachReports_upTo3`, 3]] as const,
	fallback: 0 as const,
})
