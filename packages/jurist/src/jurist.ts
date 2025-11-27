import type { Join, Tree, TreePathName } from "treetrunks"

export * from "treetrunks"

export type Roles<L extends Laws<any, any, any, any>> =
	L extends Laws<infer Role, any, any, any> ? Role : never

export type Permissions<L extends Laws<any, any, any, any>> =
	L extends Laws<any, any, infer Permission, any> ? Permission : never

export type PermissionData<L extends Laws<any, any, any, any>, D> = Entries<
	Permissions<L>,
	D
>

export class Laws<
	Role extends string,
	PermissionTree extends Tree,
	Permission extends Join<TreePathName<PermissionTree>, `_`>,
	RolePermissions extends { [r in Role]: ReadonlySet<Permission> },
> {
	public readonly roles: Role[]
	public readonly permissionTree: PermissionTree
	public readonly rolePermissions: RolePermissions
	protected readonly decompressedRolePermissions: {
		[r in Role]: ReadonlySet<string>
	}

	public constructor(options: {
		roles: Role[]
		permissions: PermissionTree
		rolePermissions: RolePermissions
	}) {
		const { roles, permissions, rolePermissions } = options
		this.roles = roles
		this.permissionTree = permissions
		this.rolePermissions = rolePermissions
		this.decompressedRolePermissions = fromEntries(
			toEntries<RolePermissions>(rolePermissions).map(
				([role, permissionsOfRole]) => [
					role,
					decompressRolePermissions(permissionsOfRole),
				],
			),
		)
	}

	public check(role: Role, permission: Permission): boolean {
		return this.decompressedRolePermissions[role].has(permission)
	}
}

function decompressRolePermissions(
	permissionSet: ReadonlySet<string>,
): ReadonlySet<string> {
	const decompressed = new Set<string>(permissionSet)
	for (const permission of permissionSet) {
		const preconditions = permission.split(`_`)
		for (let i = 0; i < preconditions.length - 1; i++) {
			const subPermission = preconditions.slice(0, i + 1).join(`_`)
			decompressed.add(subPermission)
		}
	}
	return decompressed
}

export type EscalatorStyle = `firstFound` | `lastFound` | `untilMiss`
export class Escalator<
	S extends EscalatorStyle,
	L extends Laws<any, any, any, any>,
	P extends PermissionData<L, any>,
	D extends P extends PermissionData<L, infer d> ? d : never,
	F,
> {
	public readonly style: S
	public readonly laws: L
	public readonly permissionData: P
	public readonly fallback: F
	public constructor(
		options: Readonly<{
			style: S
			laws: L
			permissionData: P
			fallback: F
		}>,
	) {
		const { style, laws, permissionData, fallback } = options
		this.style = style
		this.laws = laws
		this.permissionData = permissionData
		this.fallback = fallback
	}

	public get(role: Roles<L>): D | F {
		let result: D | F = this.fallback
		for (const [permission, data] of this.permissionData) {
			const hasPermission = this.laws.check(role, permission)
			switch (this.style) {
				case `firstFound`:
					if (hasPermission) return data
					break
				case `lastFound`:
					if (hasPermission) result = data
					break
				case `untilMiss`:
					if (hasPermission) result = data
					else return result
			}
		}
		return result
	}
}

type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type Count<N extends number, A extends any[] = []> = [
	...A,
	any,
][`length`] extends N
	? A[`length`]
	: A[`length`] | Count<N, [...A, any]>

type Entries<K extends PropertyKey = PropertyKey, V = any> = [K, V][]

type KeyOfEntries<E extends Entries> = E extends [infer K, any][] ? K : never

type ValueOfEntry<E extends Entries, K extends KeyOfEntries<E>> = {
	[P in Count<E[`length`]>]: E[P] extends [K, infer V] ? V : never
}[Count<E[`length`]>]

type FromEntries<E extends Entries> = Flat<{
	[K in KeyOfEntries<E>]: ValueOfEntry<E, K>
}>

function fromEntries<E extends Entries>(entries: E): FromEntries<E> {
	return Object.fromEntries(entries) as FromEntries<E>
}

function toEntries<T extends object>(obj: T): Entries<keyof T, T[keyof T]> {
	return Object.entries(obj) as Entries<keyof T, T[keyof T]>
}
