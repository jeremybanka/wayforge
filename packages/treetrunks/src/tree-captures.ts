/** Named values captured by a path name, including nonempty rest captures. */
export type TreePathParams<Path extends string[]> = Path extends unknown
	? {
			[
				Segment in Path[number] as Segment extends `$...${infer Name}`
					? Name
					: Segment extends `$${infer Name}`
						? Name
						: never
			]: Segment extends `$...${string}` ? [string, ...string[]] : string
		}
	: never
