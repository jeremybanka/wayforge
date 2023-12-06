export interface Lineage {
	parent: typeof this | null
	child: typeof this | null
}

export function newest<T extends Lineage>(scion: T): T {
	while (scion.child !== null) {
		scion = scion.child
	}
	return scion
}

export function eldest<T extends Lineage>(scion: T): T {
	while (scion.parent !== null) {
		scion = scion.parent
	}
	return scion
}
