export interface Lineage<L extends Lineage<any>> {
	parent: L | null
	child: L | null
}

export class Lin implements Lineage<Lin> {
	public parent: Lin | null = null
	public child: Lin | null = null
}

export function newest<T extends Lineage<any>>(scion: T): T {
	while (scion.child !== null) {
		scion = scion.child
	}
	return scion
}
