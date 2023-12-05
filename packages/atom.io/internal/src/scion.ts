export interface Scion {
	parent: typeof this | null
	child: typeof this | null
}

export function toYoungest<T extends Scion>(scion: T): T {
	while (scion.child !== null) {
		scion = scion.child
	}
	return scion
}

export function toEldest<T extends Scion>(scion: T): T {
	while (scion.parent !== null) {
		scion = scion.parent
	}
	return scion
}
