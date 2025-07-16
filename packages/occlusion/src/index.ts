import type { Docket as Identifier } from "anvl/id"
import { isUndefined } from "anvl/nullish"
import { Dictionary } from "anvl/object"
import { nanoid } from "nanoid"

export interface TrueIdentifier<TypeName extends string>
	extends Identifier<TypeName> {
	isVirtual: false
}
export interface VirtualIdentifier<TypeName extends string>
	extends Identifier<TypeName> {
	isVirtual: true
}

export class Perspective extends Dictionary<
	string,
	string,
	`trueId`,
	`virtualId`
> {
	public idFn: () => string = nanoid

	public constructor(options?: {
		base?: Record<string, string>
		idFn?: () => string
	}) {
		super({
			...(options ? { base: options?.base } : {}),
			from: `trueId`,
			into: `virtualId`,
		})
		if (options?.idFn) this.idFn = options?.idFn
	}

	public occlude<T extends string>(
		trueIdentifier: TrueIdentifier<T>,
	): VirtualIdentifier<T> {
		let virtualId = this.get(trueIdentifier.id)
		if (isUndefined(virtualId)) {
			virtualId = this.idFn()
			this.add({ trueId: trueIdentifier.id, virtualId })
		}
		return {
			id: virtualId,
			type: trueIdentifier.type,
			isVirtual: true,
		}
	}

	public reveal<T extends string>(
		virtualIdentifier: VirtualIdentifier<T>,
	): TrueIdentifier<T> {
		const trueId = this.get(virtualIdentifier.id)
		if (isUndefined(trueId)) {
			throw new Error(
				`Could not find trueId for ${JSON.stringify(virtualIdentifier)}`,
			)
		}
		return {
			id: trueId,
			type: virtualIdentifier.type,
			isVirtual: false,
		}
	}
}
