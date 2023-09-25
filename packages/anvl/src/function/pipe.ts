/* ❤️ fp-ts */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */

export function pipe<A>(a: A): A
export function pipe<A, B>(a: A, ab: (a: A) => B): B
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C
export function pipe<A, B, C, D>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
): D
export function pipe<A, B, C, D, E>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
): E
export function pipe<A, B, C, D, E, F>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
): F
export function pipe<A, B, C, D, E, F, G>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
): G
export function pipe<A, B, C, D, E, F, G, H>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
): H
export function pipe<A, B, C, D, E, F, G, H, I>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
): I
export function pipe<A, B, C, D, E, F, G, H, I, J>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
): J
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
): K
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
): L
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
): M
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
): N
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
): O

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
	op: (o: O) => P,
): P

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
	op: (o: O) => P,
	pq: (p: P) => Q,
): Q

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
	op: (o: O) => P,
	pq: (p: P) => Q,
	qr: (q: Q) => R,
): R

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
	op: (o: O) => P,
	pq: (p: P) => Q,
	qr: (q: Q) => R,
	rs: (r: R) => S,
): S

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
	a: A,
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
	fg: (f: F) => G,
	gh: (g: G) => H,
	hi: (h: H) => I,
	ij: (i: I) => J,
	jk: (j: J) => K,
	kl: (k: K) => L,
	lm: (l: L) => M,
	mn: (m: M) => N,
	no: (n: N) => O,
	op: (o: O) => P,
	pq: (p: P) => Q,
	qr: (q: Q) => R,
	rs: (r: R) => S,
	st: (s: S) => T,
): T
export function pipe(
	a: unknown,
	ab?: Function,
	bc?: Function,
	cd?: Function,
	de?: Function,
	ef?: Function,
	fg?: Function,
	gh?: Function,
	hi?: Function,
): unknown {
	// biome-ignore lint/style/noArguments: <explanation>
	switch (arguments.length) {
		case 1:
			return a
		case 2:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return ab!(a)
		case 3:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return bc!(ab!(a))
		case 4:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return cd!(bc!(ab!(a)))
		case 5:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return de!(cd!(bc!(ab!(a))))
		case 6:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return ef!(de!(cd!(bc!(ab!(a)))))
		case 7:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return fg!(ef!(de!(cd!(bc!(ab!(a))))))
		case 8:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))
		case 9:
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))
		default: {
			// biome-ignore lint/style/noArguments: <explanation>
			let ret = arguments[0]
			// biome-ignore lint/style/noArguments: <explanation>
			for (let i = 1; i < arguments.length; i++) {
				// biome-ignore lint/style/noArguments: <explanation>
				ret = arguments[i](ret)
			}
			return ret
		}
	}
}
