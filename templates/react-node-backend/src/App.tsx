import { atom, type Loadable, resetState, selector } from "atom.io"
import { useLoadable } from "atom.io/react"

const SERVER_URL = `http://localhost:3000`
const AUTHENTICATOR_URL = `http://localhost:4000`

const randomAtom = atom<Loadable<number>, Error>({
	key: `random`,
	default: async () => {
		const url = new URL(`/random`, SERVER_URL)
		const response = await fetch(url, { credentials: `include` })
		if (!response.ok) throw new Error(response.status.toString())
		const data = (await response.json()) as unknown
		if (typeof data === `number`) return data
		console.error(`Unexpected response from server`, data)
		return 0
	},
	catch: [Error],
})

type Todo = {
	id: number
	text: string
	done: 0 | 1
}
const todosAtom = atom<Loadable<Todo[]>, Error>({
	key: `todos`,
	default: async () => {
		const url = new URL(`/todos`, SERVER_URL)
		const response = await fetch(url, { credentials: `include` })
		if (!response.ok) throw new Error(response.status.toString())
		const { todos } = (await response.json()) as { todos: unknown }
		if (
			Array.isArray(todos) &&
			todos.every(
				(todo): todo is Todo =>
					typeof todo === `object` &&
					todo !== null &&
					`id` in todo &&
					typeof todo.id === `number` &&
					`text` in todo &&
					typeof todo.text === `string` &&
					`done` in todo &&
					(todo.done === 0 || todo.done === 1),
			)
		) {
			return todos
		}
		console.error(`Unexpected response from server`, todos)
		return []
	},
	catch: [Error],
})

const todosStatsSelector = selector<
	Loadable<{
		total: number
		done: number
	}>
>({
	key: `todosStats`,
	get: async ({ get }) => {
		const todos = await get(todosAtom)
		if (Error.isError(todos)) return { total: 0, done: 0 }
		const total = todos.length
		const done = todos.filter((todo) => todo.done).length
		return { total, done }
	},
})

function App(): React.JSX.Element {
	const todos = useLoadable(todosAtom, [])
	const stats = useLoadable(todosStatsSelector, { total: 0, done: 0 })

	return (
		<main>
			{todos.error ? (
				<article className="takeover">
					<main className="card">
						<h1>Signed Out</h1>
						<button
							type="button"
							onClick={() => {
								window.location.href = `${AUTHENTICATOR_URL}/login`
							}}
						>
							Log in
						</button>
					</main>
				</article>
			) : null}
			<header>
				{todos.error ? (
					<div className="pfp signed-out" />
				) : todos.loading ? (
					<div className="pfp loading" />
				) : (
					<>
						<button
							type="button"
							onClick={() => {
								window.location.href = `${SERVER_URL}/logout`
							}}
						>
							Log out
						</button>
						<div className="pfp signed-in" />
					</>
				)}
			</header>
			{todos.loading
				? todos.value.map((todo) => (
						<div key={todo.id} className="data loading">
							<input type="checkbox" checked={Boolean(todo.done)} />
							<span>{todo.text}</span>
						</div>
					))
				: todos.value.map((todo) => (
						<div key={todo.id} className="data">
							<input
								type="checkbox"
								checked={Boolean(todo.done)}
								onChange={async (e) => {
									const url = new URL(`todos`, SERVER_URL)
									await fetch(url, {
										method: `PUT`,
										credentials: `include`,
										body: JSON.stringify({ done: e.target.checked }),
									})
									resetState(todosAtom)
								}}
							/>
							<span>{todo.text}</span>
						</div>
					))}

			<button
				type="button"
				onClick={async () => {
					const url = new URL(`todos`, SERVER_URL)
					await fetch(url, {
						method: `POST`,
						credentials: `include`,
						body: JSON.stringify({ text: `hello` }),
					})
					resetState(todosAtom)
				}}
			>
				Add Todo
			</button>
		</main>
	)
}

export default App
