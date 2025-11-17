import type { Loadable } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	getState,
	resetState,
	selector,
	setState,
} from "atom.io"
import { useI, useLoadable, useO } from "atom.io/react"
import { useCallback } from "react"
import z from "zod"

const SERVER_URL = `http://localhost:3000`
const AUTHENTICATOR_URL = `http://localhost:4000`

const todoSchema = z.object({
	id: z.number(), // real keys are integers; virtual keys are made with Math.random()
	text: z.string(),
	done: z.union([z.literal(0), z.literal(1)]), // keeps things simple with sqlite
})
type Todo = z.infer<typeof todoSchema>
const todoKeysAtom = atom<Loadable<number[]>, Error>({
	key: `todoKeys`,
	default: async () => {
		const url = new URL(`/todos`, SERVER_URL)
		const response = await fetch(url, { credentials: `include` })
		if (!response.ok) throw new Error(response.status.toString())
		const json = await response.json()
		const todos = todoSchema.array().parse(json)
		for (const todo of todos) setState(todoAtoms, todo.id, todo)
		return todos.map((todo) => todo.id)
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
		const json = await response.json()
		const todo = todoSchema.parse(json)
		return todo
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
	const todo = await res.json()
	const realId = todo.id
	setState(todoAtoms, realId, todo)
	setState(todoKeysAtom, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return prev.map((id) => (id === tempId ? realId : id))
	})
}

async function deleteTodo(todoKey: number) {
	const todoKeys = await getState(todoKeysAtom)
	if (Error.isError(todoKeys)) return
	const todoToDelete = todoKeys.find((key) => key === todoKey)
	if (todoToDelete === undefined) return
	setState(todoKeysAtom, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return prev.filter((id) => id !== todoToDelete)
	})
	disposeState(todoAtoms, todoToDelete)
	const url = new URL(`/todos`, SERVER_URL)
	url.searchParams.set(`id`, todoToDelete.toString())
	await fetch(url, {
		method: `DELETE`,
		credentials: `include`,
	})
}

const TODO_FALLBACK: Todo = { id: 0, text: ``, done: 0 }
const SKELETON_KEYS = Array.from({ length: 5 }).map(Math.random)
for (const key of SKELETON_KEYS) setState(todoAtoms, key, TODO_FALLBACK)

export function App(): React.JSX.Element {
	const todoKeys = useLoadable(todoKeysAtom, SKELETON_KEYS)
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
				<LongLoadTimes />
				<span className="spacer" />
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

function Todo({ todoKey }: { todoKey: number }): React.JSX.Element {
	const todo = useLoadable(todoAtoms, todoKey, TODO_FALLBACK)
	const isSuspended = todo.loading || !Number.isInteger(todoKey)
	const toggleDone = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const url = new URL(`todos`, SERVER_URL)
			url.searchParams.set(`id`, todo.value.id.toString())
			const nowChecked = e.target.checked ? 1 : 0
			setState(todoAtoms, todoKey, async (loadable) => {
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
		[],
	)
	const deleteThisTodo = useCallback(async () => {
		await deleteTodo(todoKey)
	}, [])
	return (
		<div className={cn(`todo`, isSuspended && `loading`)}>
			<input
				type="checkbox"
				checked={Boolean(todo.value.done)}
				onChange={toggleDone}
				disabled={isSuspended}
			/>
			<span>{todo.value.text}</span>
			<button
				type="button"
				className="delete"
				onClick={deleteThisTodo}
				disabled={isSuspended}
			/>
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

const longLoadTimesAtom = atom<Loadable<boolean>>({
	key: `longLoadTimes`,
	default: () =>
		fetch(new URL(`/long-load-times`, SERVER_URL), {
			credentials: `include`,
		}).then(async (res) => res.json()),
})

function LongLoadTimes(): React.JSX.Element {
	const longLoadTimes = useLoadable(longLoadTimesAtom, false)
	const toggle = useCallback(async () => {
		const url = new URL(`/long-load-times`, SERVER_URL)
		const res = await fetch(url, {
			method: `POST`,
			credentials: `include`,
		})
		const newState = await res.json()
		setState(longLoadTimesAtom, newState)
	}, [longLoadTimes])
	return (
		<div className="long-load-times">
			<label>
				<input type="checkbox" checked={longLoadTimes.value} onChange={toggle} />
				Enable long load times
			</label>
		</div>
	)
}

const cn = (...c: (boolean | string)[]) => c.filter(Boolean).join(` `)
