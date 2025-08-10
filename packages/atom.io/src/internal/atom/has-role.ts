import type { Atom } from ".."

export const INTERNAL_ROLES = [`tracker:signal`] as const
export type internalRole = (typeof INTERNAL_ROLES)[number]

export function hasRole(atom: Atom<any>, role: internalRole): boolean {
	if (`internalRoles` in atom === false) {
		return false
	}

	return atom.internalRoles.includes(role)
}
