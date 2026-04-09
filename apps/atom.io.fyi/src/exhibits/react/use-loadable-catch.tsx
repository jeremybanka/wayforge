import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

class RequestError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
	) {
		super(message)
		this.name = `RequestError`
	}
}

const accountAtom = atom<Loadable<{ name: string }>, RequestError>({
	key: `account`,
	default: async () => {
		await Promise.resolve()
		throw new RequestError(503, `Service unavailable`)
	},
	catch: [RequestError],
})

export function AccountCard(): React.JSX.Element {
	const account = useLoadable(accountAtom, { name: `Guest` })
	return (
		<div>
			<h1>
				{account.value.name}
				{account.loading ? ` ⌛` : ``}
			</h1>
			{account.error ? (
				<p>
					{account.error.status}: {account.error.message}
				</p>
			) : null}
		</div>
	)
}
