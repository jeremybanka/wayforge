import { optional, required } from "treetrunks"

import type { Permissions, Roles } from "../src/jurist"
import { Escalator, Laws } from "../src/jurist"

test(`laws`, () => {
	type Role = Roles<typeof authorization>
	type Permission = Permissions<typeof authorization>
	const authorization = new Laws({
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

	const hasPermission = authorization.check(`free`, `ownProjects_upTo3`)
	expect(hasPermission).toBe(true)

	const projectsAllowed = new Escalator({
		style: `untilMiss`,
		laws: authorization,
		permissionData: [[`ownProjects_upTo3`, 3]] as const,
		fallback: 0 as const,
	})

	const tokensAllowed = new Escalator({
		style: `untilMiss`,
		laws: authorization,
		permissionData: [[`ownProjects_attachTokens_upTo12`, 12]] as const,
		fallback: 0 as const,
	})

	const reportsAllowed = new Escalator({
		style: `untilMiss`,
		laws: authorization,
		permissionData: [[`ownProjects_attachReports_upTo3`, 3]] as const,
		fallback: 0 as const,
	})

	expect(projectsAllowed.get(`free`)).toBe(3)
	expect(tokensAllowed.get(`free`)).toBe(12)
	expect(reportsAllowed.get(`free`)).toBe(3)
})
