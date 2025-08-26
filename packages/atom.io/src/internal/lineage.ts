/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export interface Lineage {
	parent: typeof this | null
	child: typeof this | null
}

export function newest<T extends Lineage>(
	scion: T,
): Exclude<T[`child`], null> | T {
	while (scion.child !== null) {
		scion = scion.child
	}
	return scion
}

export function eldest<T extends Lineage>(
	scion: T,
): Exclude<T[`parent`], T[`child`] | null> {
	while (scion.parent !== null) {
		scion = scion.parent
	}
	return scion as Exclude<T[`parent`], T[`child`] | null>
}
