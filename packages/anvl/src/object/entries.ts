export type Entries<K extends PropertyKey, V> = [key: K, value: V][]

export const recordToEntries = <K extends PropertyKey, V>(
	obj: Record<K, V>,
): Entries<K, V> => Object.entries(obj) as Entries<K, V>

export const entriesToRecord = <K extends PropertyKey, V>(
	entries: Entries<K, V>,
): Record<K, V> => Object.fromEntries(entries) as Record<K, V>
