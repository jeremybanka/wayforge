export type Eventful<T> = Promise<T> | T

/**
 * A Promise that can be canceled.
 * @internal
 * @private
 * @typeParam T The type of the value that the promise will resolve to.
 *
 * @remarks
 * Can be constructed like a Promise, or from an existing Promise.
 */
export class Future<T> extends Promise<T> {
	private isCanceled = false

	public constructor(
		executor:
			| Promise<T>
			| ((resolve: (value: T) => void, reject: (reason?: any) => void) => void),
	) {
		super((resolve, reject) => {
			const pass = (value: T) =>
				this.isCanceled ? reject(`canceled`) : resolve(value)
			const fail = (reason: any) =>
				this.isCanceled ? reject(`canceled`) : reject(reason)
			if (typeof executor === `function`) {
				executor(pass, fail)
			} else {
				executor.then(pass, fail)
			}
		})
	}

	public cancel(): void {
		this.isCanceled = true
	}
}
