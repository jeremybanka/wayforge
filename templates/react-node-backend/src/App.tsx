import {
	atom,
	atomFamily,
	getState,
	type Loadable,
	resetState,
	selector,
	setState,
} from "atom.io"
import { useI, useLoadable, useO } from "atom.io/react"
import { useCallback } from "react"

const SERVER_URL = `http://localhost:3000`
const AUTHENTICATOR_URL = `http://localhost:4000`

type Todo = {
	id: number
	text: string
	done: 0 | 1 // keeps things simple with sqlite
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

async function addTodo() {
	const text = getState(newTodoTextAtom)
	setState(newTodoTextAtom, ``)
	const url = new URL(`todos`, SERVER_URL)
	const tempId = Math.random()
	setState(todoAtoms, tempId, { id: tempId, text, done: 0 })
	setState(todoKeysAtom, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return [...prev, tempId]
	})
	const res = await fetch(url, {
		method: `POST`,
		credentials: `include`,
		body: text,
	})
	if (!res.ok) throw new Error(res.status.toString())
	const { todo } = await res.json()
	const realId = todo.id
	setState(todoAtoms, realId, todo)
	setState(todoKeysAtom, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return prev.map((id) => (id === tempId ? realId : id))
	})
}

export function App(): React.JSX.Element {
	const todoKeys = useLoadable(todoKeysAtom, [])
	const stats = useLoadable(todosStatsSelector, { total: 0, done: 0 })

	return (
		<>
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
			<main>
				<header>
					<h1>todo list</h1>
					<span>
						{stats.value.done}/{stats.value.total} items done
					</span>
				</header>
				<main>
					{todoKeys.value.map((todoKey) => (
						<Todo key={todoKey} todoKey={todoKey} />
					))}
					<NewTodo />
				</main>
			</main>
		</>
	)
}

const TODO_FALLBACK: Todo = { id: 0, text: ``, done: 0 }
function Todo({ todoKey }: { todoKey: number }): React.JSX.Element {
	const { loading, value: todo } = useLoadable(todoAtoms, todoKey, TODO_FALLBACK)
	const toggle = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const url = new URL(`todos`, SERVER_URL)
			url.searchParams.set(`id`, todo.id.toString())
			const nowChecked = e.target.checked ? 1 : 0
			setState(todoAtoms, todo.id, async (loadable) => {
				const prev = await loadable
				if (Error.isError(prev)) return prev
				return { ...prev, done: nowChecked } satisfies Todo
			})
			await fetch(url, {
				method: `PUT`,
				credentials: `include`,
				body: nowChecked.toString(),
			})
			resetState(todoAtoms, todoKey)
		},
		[todo],
	)
	return (
		<div
			className={cn(
				`todo`,
				(loading || !Number.isInteger(todoKey)) && `loading`,
			)}
		>
			<input type="checkbox" checked={Boolean(todo.done)} onChange={toggle} />
			<span>{todo.text}</span>
		</div>
	)
}

const newTodoTextAtom = atom<string>({
	key: `newTodo`,
	default: ``,
})

function NewTodo(): React.JSX.Element {
	const text = useO(newTodoTextAtom)
	const setText = useI(newTodoTextAtom)
	const change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setText(e.target.value)
	}, [])
	const submit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		void addTodo()
	}, [])
	return (
		<form className="todo" onSubmit={submit}>
			<input type="checkbox" checked={false} disabled />
			<input
				type="text"
				contentEditable
				suppressContentEditableWarning
				value={text}
				onChange={change}
			/>
			<button type="submit">Add Todo</button>
		</form>
	)
}

const cn = (...c: (boolean | string)[]) => c.filter(Boolean).join(` `)
