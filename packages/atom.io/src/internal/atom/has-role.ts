import type { Atom } from "../state-types"

export const INTERNAL_ROLES = [`tracker:signal`] as const
export type InternalRole = (typeof INTERNAL_ROLES)[number]

export function hasRole(atom: Atom<any, any>, role: InternalRole): boolean {
	if (`internalRoles` in atom === false) {
		return false
	}

	return atom.internalRoles.includes(role)
}
