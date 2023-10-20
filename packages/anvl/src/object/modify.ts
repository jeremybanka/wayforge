export const modify =
	<Mod extends Record<keyof any, any>>(modifications: Mod) =>
	<
		Obj extends {
			[Key in keyof Mod]?: Key extends keyof Mod
				? Mod[Key] extends (v: any) => any
					? Parameters<Mod[Key]>[0]
					: Obj[Key]
				: Obj[Key]
		},
	>(
		obj: Obj,
	): {
		[K in keyof Obj]: K extends keyof Mod
			? Mod[K] extends (v: any) => any
				? ReturnType<Mod[K]>
				: Mod[K]
			: Obj[K]
	} =>
		Object.entries(modifications).reduce(
			(acc, [key, mod]) => (
				obj[key] &&
					(acc[key as keyof Obj] =
						typeof mod === `function` ? mod?.(obj[key]) : mod),
				acc
			),
			{ ...obj } as Obj,
		) as any
// const a = modify({ a: (v: string) => v.length })({ a: `hello` })
// const b = modify({ a: `hello` })({ a: `hello` })
