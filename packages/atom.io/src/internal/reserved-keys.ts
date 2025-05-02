export type ReservedIntrospectionKey = `🔍 ${string}`

export function isReservedIntrospectionKey(
	value: string,
): value is ReservedIntrospectionKey {
	return value.startsWith(`🔍 `)
}
