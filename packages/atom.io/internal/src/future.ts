/**
 * A Promise whose incoming value can be hot swapped.
 * @internal
 * @private
 * @typeParam T The type of the value that the promise will resolve to.
 *
 * @remarks
 * Can be constructed like a Promise, or from an existing Promise.
 */
export class Future<T> extends Promise<T> {
	private destiny: Promise<T> | undefined
	private resolve: (value: T) => void
	private reject: (reason?: any) => void

	public constructor(
		executor:
			| Promise<T>
			| ((resolve: (value: T) => void, reject: (reason?: any) => void) => void),
	) {
		let promise: Promise<T> | undefined
		let superResolve: ((value: T) => void) | undefined
		let superReject: ((reason?: any) => void) | undefined
		super((resolve, reject) => {
			superResolve = resolve
			superReject = reject
			promise = executor instanceof Promise ? executor : new Promise(executor)
			promise.then(
				(value) => {
					if (promise) {
						this.pass(promise, value)
					}
				},
				(reason) => {
					if (promise) {
						this.fail(promise, reason)
					}
				},
			)
		})
		this.destiny = promise
		this.resolve = superResolve as (value: T) => void
		this.reject = superReject as (reason?: any) => void
	}

	private pass(promise: Promise<T>, value: T) {
		if (promise === this.destiny) {
			this.resolve(value)
		}
	}
	private fail(promise: Promise<T>, reason: any) {
		if (promise === this.destiny) {
			this.reject(reason)
		}
	}

	public use(value: Promise<T> | T): void {
		if (value instanceof Promise) {
			const promise = value
			this.destiny = promise
			promise.then(
				(resolved) => {
					this.pass(promise, resolved)
				},
				(reason) => {
					this.fail(promise, reason)
				},
			)
		} else {
			this.resolve(value)
			this.destiny = undefined
		}
	}
}
