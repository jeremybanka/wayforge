import {
	atom,
	atomFamily,
	type Loadable,
	resetState,
	selector,
	setState,
} from "atom.io"
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
const todoKeysAtom = atom<Loadable<number[]>, Error>({
	key: `todoKeys`,
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
			for (const todo of todos) setState(todoAtoms, todo.id, todo)
			return todos.map((todo) => todo.id)
		}
		console.error(`Unexpected response from server`, todos)
		return []
	},
	catch: [Error],
})

const todoAtoms = atomFamily<Loadable<Todo>, number, Error>({
	key: `todos`,
	default: async (id) => {
		const url = new URL(`/todos`, SERVER_URL)
		url.searchParams.set(`id`, id.toString())
		const response = await fetch(url, { credentials: `include` })
		if (!response.ok) throw new Error(response.status.toString())
		const { todo } = (await response.json()) as { todo: unknown }
		if (
			typeof todo === `object` &&
			todo !== null &&
			`id` in todo &&
			typeof todo.id === `number` &&
			`text` in todo &&
			typeof todo.text === `string` &&
			`done` in todo &&
			(todo.done === 0 || todo.done === 1)
		) {
			return todo as Todo
		}
		console.error(`Unexpected response from server`, todo)
		return { id, text: ``, done: 0 }
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
		const todoKeys = await get(todoKeysAtom)
		if (Error.isError(todoKeys)) return { total: 0, done: 0 }
		const total = todoKeys.length
		const todos = await Promise.all(todoKeys.map((id) => get(todoAtoms, id)))
		const done = todos.filter((todo) => !Error.isError(todo) && todo.done).length
		return { total, done }
	},
})

function App(): React.JSX.Element {
	const todoKeys = useLoadable(todoKeysAtom, [])
	const stats = useLoadable(todosStatsSelector, { total: 0, done: 0 })

	return (
		<main>
			{todoKeys.error ? (
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
				{todoKeys.error ? (
					<div className="pfp signed-out" />
				) : todoKeys.loading ? (
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
			{todoKeys.value.map((todoKey) => (
				<Todo key={todoKey} todoKey={todoKey} />
			))}

			<button
				type="button"
				onClick={async () => {
					const url = new URL(`todos`, SERVER_URL)
					const res = await fetch(url, {
						method: `POST`,
						credentials: `include`,
						body: JSON.stringify({ text: `hello` }),
					})
					if (!res.ok) throw new Error(res.status.toString())
					const { todo } = await res.json()
					setState(todoAtoms, todo.id, todo)
					setState(todoKeysAtom, async (loadable) => {
						const prev = await loadable
						if (Error.isError(prev)) {
							return prev
						}
						if (prev.includes(todo.id)) {
							return prev
						}
						return [...prev, todo.id]
					})
				}}
			>
				Add Todo
			</button>
		</main>
	)
}

function Todo({ todoKey }: { todoKey: number }): React.JSX.Element {
	const todo = useLoadable(todoAtoms, todoKey, { id: 0, text: ``, done: 0 })
	return (
		<div className={cn(`todo`, todo.loading && `loading`)}>
			<input
				type="checkbox"
				checked={Boolean(todo.value.done)}
				onChange={async (e) => {
					const url = new URL(`todos`, SERVER_URL)
					await fetch(url, {
						method: `PUT`,
						credentials: `include`,
						body: JSON.stringify({ done: e.target.checked }),
					})
					resetState(todoAtoms, todo.value.id)
				}}
			/>
			<span>{todo.value.text}</span>
		</div>
	)
}

const cn = (...classes: (boolean | string)[]) =>
	classes.filter(Boolean).join(` `)

export default App
