export interface Lineage {
	parent: Lineage | null
	child: Lineage | null
}

export function newest<T extends Lineage>(
	origin: T,
): Exclude<T[`child`], null> | T {
	let scion: Exclude<T[`child`], null> | T = origin
	while (scion.child !== null) {
		scion = scion.child as Exclude<T[`child`], null>
	}
	return scion
}

export function eldest<T extends Lineage>(
	origin: T,
): Exclude<T[`parent`], T[`child`] | null> {
	let scion: Exclude<T[`parent`], T[`child`] | null> | T = origin
	while (scion.parent !== null) {
		scion = scion.parent as Exclude<T[`parent`], T[`child`] | null>
	}
	return scion as Exclude<T[`parent`], T[`child`] | null>
}
