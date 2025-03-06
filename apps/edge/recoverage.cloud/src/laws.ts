import type { Join, Tree, TreePathName } from "treetrunks"

export type Roles<L extends Laws<any, any, any, any>> = L extends Laws<
	infer Role,
	any,
	any,
	any
>
	? Role
	: never

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

type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type Count<N extends number, A extends any[] = []> = [
	...A,
	any,
][`length`] extends N
	? A[`length`]
	: A[`length`] | Count<N, [...A, any]>

type Entries<K extends PropertyKey = keyof any, V = any> = [K, V][]

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
