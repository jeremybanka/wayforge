/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
export function curry<F extends (...args: any[]) => any>(
	f: F,
): (
	a0: Parameters<F>[0],
) => Parameters<F>[`length`] extends 2
	? (a1: Parameters<F>[1]) => ReturnType<F>
	: Parameters<F>[`length`] extends 3
	? (a1: Parameters<F>[1]) => (a2: Parameters<F>[2]) => ReturnType<F>
	: Parameters<F>[`length`] extends 4
	? (
			a1: Parameters<F>[1],
	  ) => (a2: Parameters<F>[2]) => (a3: Parameters<F>[3]) => ReturnType<F>
	: Parameters<F>[`length`] extends 5
	? (
			a1: Parameters<F>[1],
	  ) => (
			a2: Parameters<F>[2],
	  ) => (a3: Parameters<F>[3]) => (a4: Parameters<F>[4]) => ReturnType<F>
	: Parameters<F>[`length`] extends 6
	? (
			a1: Parameters<F>[1],
	  ) => (
			a2: Parameters<F>[2],
	  ) => (
			a3: Parameters<F>[3],
	  ) => (a4: Parameters<F>[4]) => (a5: Parameters<F>[5]) => ReturnType<F>
	: Parameters<F>[`length`] extends 7
	? (
			a1: Parameters<F>[1],
	  ) => (
			a2: Parameters<F>[2],
	  ) => (
			a3: Parameters<F>[3],
	  ) => (
			a4: Parameters<F>[4],
	  ) => (a5: Parameters<F>[5]) => (a6: Parameters<F>[6]) => ReturnType<F>
	: Parameters<F>[`length`] extends 8
	? (
			a1: Parameters<F>[1],
	  ) => (
			a2: Parameters<F>[2],
	  ) => (
			a3: Parameters<F>[3],
	  ) => (
			a4: Parameters<F>[4],
	  ) => (
			a5: Parameters<F>[5],
	  ) => (a6: Parameters<F>[6]) => (a7: Parameters<F>[7]) => ReturnType<F>
	: Parameters<F>[`length`] extends 9
	? (
			a1: Parameters<F>[1],
	  ) => (
			a2: Parameters<F>[2],
	  ) => (
			a3: Parameters<F>[3],
	  ) => (
			a4: Parameters<F>[4],
	  ) => (
			a5: Parameters<F>[5],
	  ) => (
			a6: Parameters<F>[6],
	  ) => (a7: Parameters<F>[7]) => (a8: Parameters<F>[8]) => ReturnType<F>
	: never {
	if (f.length === 0)
		throw new Error(`Currying a function with no arguments does not make sense`)
	if (f.length > 9)
		throw new Error(
			`Currying a function with more than 9 arguments is not supported`,
		)
	return f.length === 1
		? (a0) => f(a0)
		: f.length === 2
		? (a0) => (a1) => f(a0, a1)
		: f.length === 3
		? (a0) => (a1) => (a2) => f(a0, a1, a2)
		: f.length === 4
		? (a0) => (a1) => (a2) => (a3) => f(a0, a1, a2, a3)
		: f.length === 5
		? (a0) => (a1) => (a2) => (a3) => (a4) => f(a0, a1, a2, a3, a4)
		: f.length === 6
		? (a0) => (a1) => (a2) => (a3) => (a4) => (a5) => f(a0, a1, a2, a3, a4, a5)
		: f.length === 7
		? (a0) => (a1) => (a2) => (a3) => (a4) => (a5) => (a6) =>
				f(a0, a1, a2, a3, a4, a5, a6)
		: f.length === 8
		? (a0) => (a1) => (a2) => (a3) => (a4) => (a5) => (a6) => (a7) =>
				f(a0, a1, a2, a3, a4, a5, a6, a7)
		: f.length === 9
		? (a0) => (a1) => (a2) => (a3) => (a4) => (a5) => (a6) => (a7) => (a8) =>
				f(a0, a1, a2, a3, a4, a5, a6, a7, a8)
		: (`This result is impossible` as never)
}
