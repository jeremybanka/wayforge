type StringInterface<T> = {
	stringify: (t: T) => string
	parse: (s: string) => T
}
