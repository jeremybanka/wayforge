import type { appRouter } from "@backend/trpc-app-router"
import type { foodItems } from "@database/tempest-db-schema"
import { Temporal } from "@js-temporal/polyfill"
import { TRPCClientError } from "@trpc/client"
import type { Loadable } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	getState,
	mutableAtom,
	selector,
	selectorFamily,
	setState,
} from "atom.io"
import { useI, useLoadable, useO } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"
import type { InferSelectModel } from "drizzle-orm"
import { nanoid } from "nanoid"
import { useCallback } from "react"

import { trpcClient } from "../../services/trpc-client-service"
import scss from "./Carbiter.module.scss"

type FoodItem = Pick<
	InferSelectModel<typeof foodItems>,
	`carbs` | `id` | `meal` | `name` | `protein`
>
type ClientError = TRPCClientError<typeof appRouter>

const MEAL_NAMES = [
	`breakfast`,
	`brunch`,
	`lunch`,
	`tea`,
	`dinner`,
	`supper`,
] as const
true satisfies (typeof MEAL_NAMES)[number] extends FoodItem[`meal`]
	? true
	: false
type MealName = (typeof MEAL_NAMES)[number]

const EMPTY_MEALS: Record<MealName, string[]> = {
	breakfast: [],
	brunch: [],
	lunch: [],
	tea: [],
	dinner: [],
	supper: [],
}

export function Carbiter(): React.ReactNode {
	const focusedMeal = useO(focusedMealNameAtom)
	const focusedDate = useO(focusedDateAtom)
	const newFoodItemName = useO(newFoodItemNameAtom)
	const setNewFoodItemName = useI(newFoodItemNameAtom)
	const change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setNewFoodItemName(e.target.value)
	}, [])
	const submit = useCallback(
		(e: React.SubmitEvent<HTMLFormElement>) => {
			e.preventDefault()
			if (!focusedMeal) return
			void addFoodItem(focusedMeal)
		},
		[focusedMeal],
	)
	const editedItemKeys = useO(foodItemsEditsKeysAtom)
	const totalDailyCarbs = useLoadable(totalDailyCarbsSelector, 0)
	const totalDailyProtein = useLoadable(totalDailyProteinSelector, 0)
	return (
		<main data-css="Carbiter" className={scss[`class`]}>
			<header>
				<nav>
					<button
						type="button"
						onClick={() => {
							setState(focusedDateAtom, (current) => current.add({ days: -1 }))
						}}
					>{`<-`}</button>
					<span>
						{focusedDate.toLocaleString(`en-US`, { dateStyle: `full` })}
					</span>
					<button
						type="button"
						onClick={() => {
							setState(focusedDateAtom, (current) => current.add({ days: 1 }))
						}}
					>{`->`}</button>
				</nav>
			</header>
			<span />
			<main>
				{MEAL_NAMES.map((mealName) =>
					focusedMeal === mealName ? (
						<Meal key={mealName} mealName={mealName} />
					) : (
						<InactiveMeal key={mealName} mealName={mealName} />
					),
				)}
			</main>
			<footer>
				<form onSubmit={submit}>
					{editedItemKeys.size > 0 ? (
						<button
							type="button"
							onClick={async () => {
								const edits: [string, Partial<FoodItem>][] = []
								for (const id of editedItemKeys) {
									const edit = getState(foodItemsEditsAtoms, id)
									edits.push([id, edit])
								}
								await trpcClient.carbiter.saveFoodItems.mutate(edits)
								setState(foodItemsEditsKeysAtom, (prev) => (prev.clear(), prev))
							}}
						>{`>>->`}</button>
					) : (
						<>
							<input
								type="text"
								value={newFoodItemName}
								onChange={change}
								placeholder="add to current meal..."
							/>
							<button type="submit">{`>>->`}</button>
						</>
					)}
				</form>
			</footer>
			<aside>
				<span />
				<main data-css="stats">
					<data data-css="stat">
						<main data-css="stats-number">{totalDailyCarbs.value}</main>
						<span data-css="stats-unit">carbs</span>
					</data>
					<data data-css="stat">
						<main data-css="stats-number">{totalDailyProtein.value}</main>
						<span data-css="stats-unit">protein</span>
					</data>
				</main>
			</aside>
		</main>
	)
}

function Meal({ mealName }: { mealName: MealName }): React.ReactNode {
	const mealsToday = useLoadable(mealsTodaySelector, EMPTY_MEALS)
	return (
		<section>
			<MealHeader mealName={mealName} />
			<main>
				{mealsToday.value[mealName].map((id) => (
					<FoodItem key={id} id={id} />
				))}
			</main>
		</section>
	)
}

function InactiveMeal({ mealName }: { mealName: MealName }): React.ReactNode {
	return (
		<section data-css="inactive-meal">
			<MealHeader mealName={mealName} />
		</section>
	)
}
function MealHeader({ mealName }: { mealName: MealName }): React.ReactNode {
	const totalCarbs = useLoadable(totalMealCarbsSelectors, mealName, 0)
	const totalProtein = useLoadable(totalMealProteinSelectors, mealName, 0)
	return (
		<header>
			<button
				type="button"
				onClick={() => {
					setState(focusedMealNameAtom, (current) =>
						current === mealName ? null : mealName,
					)
				}}
			>
				{mealName}
			</button>
			<aside data-css="stats">
				<data data-css="stat">
					<main data-css="stats-number">{totalCarbs.value}</main>
					<span data-css="stats-unit">carbs</span>
				</data>
				<data data-css="stat">
					<main data-css="stats-number">{totalProtein.value}</main>
					<span data-css="stats-unit">protein</span>
				</data>
			</aside>
		</header>
	)
}

const newFoodItemNameAtom = atom<string>({
	key: `newFoodItemName`,
	default: ``,
})
async function addFoodItem(meal: MealName) {
	const focusedDate = getState(focusedDateTupleSelector)
	const name = getState(newFoodItemNameAtom)
	setState(newFoodItemNameAtom, ``)
	const tempId = nanoid(6)
	const temp: FoodItem = { id: tempId, name, meal, carbs: 0, protein: 0 }
	setState(foodItemAtoms, tempId, temp)
	setState(foodItemKeysAtoms, focusedDate, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return [...prev, tempId]
	})
	try {
		const [year, month, day] = focusedDate
		const newFoodItem = await trpcClient.carbiter.addFoodItem.mutate({
			year,
			month,
			day,
			meal,
			name,
		})
		const trueId = newFoodItem.id
		setState(foodItemAtoms, trueId, newFoodItem)
		setState(foodItemKeysAtoms, focusedDate, async (loadable) => {
			const prev = await loadable
			if (Error.isError(prev)) return prev
			return prev.map((id) => (id === tempId ? trueId : id))
		})
	} catch (thrown) {
		console.error(thrown)
	}
}
async function deleteFoodItem(foodItemId: string) {
	const focusDate = getState(focusedDateTupleSelector)
	const foodItemKeys = await getState(foodItemKeysAtoms, focusDate)
	if (Error.isError(foodItemKeys)) return
	const itemToDelete = foodItemKeys.find((key) => key === foodItemId)
	if (itemToDelete === undefined) return
	setState(foodItemKeysAtoms, focusDate, async (loadable) => {
		const prev = await loadable
		if (Error.isError(prev)) return prev
		return prev.filter((id) => id !== itemToDelete)
	})
	disposeState(foodItemAtoms, itemToDelete)
	await trpcClient.carbiter.deleteFoodItem.mutate(itemToDelete)
}

const EMPTY_FOOD_ITEM: FoodItem = {
	carbs: 0,
	id: ``,
	meal: `breakfast`,
	name: ``,
	protein: 0,
}

function FoodItem({ id }: { id: string }): React.ReactNode {
	const foodItem = useLoadable(foodItemsOverlaySelectors, id, EMPTY_FOOD_ITEM)
	return (
		<article>
			<header>
				<button
					type="button"
					onClick={() => {
						void deleteFoodItem(id)
					}}
				>
					x
				</button>
				<input
					type="text"
					value={foodItem.value.name}
					onChange={(e) => {
						setState(foodItemsEditsAtoms, id, (prev) => ({
							...prev,
							name: e.target.value,
						}))
						setState(foodItemsEditsKeysAtom, (current) => current.add(id))
					}}
				/>
			</header>
			<main data-css="stats">
				<label data-css="stat">
					<input
						data-css="stats-number"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={foodItem.value.carbs}
						onChange={(e) => {
							setState(foodItemsEditsAtoms, id, (prev) => ({
								...prev,
								carbs: Number.parseInt(e.target.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) => current.add(id))
						}}
					/>
					<span data-css="stats-unit">carbs</span>
				</label>
				<label data-css="stat">
					<input
						data-css="stats-number"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={foodItem.value.protein}
						onChange={(e) => {
							setState(foodItemsEditsAtoms, id, (prev) => ({
								...prev,
								protein: Number.parseInt(e.target.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) => current.add(id))
						}}
					/>
					<span data-css="stats-unit">protein</span>
				</label>
			</main>
		</article>
	)
}

type DateTuple = readonly [year: number, month: number, day: number]

const focusedDateAtom = atom<Temporal.PlainDate>({
	key: `focusedDate`,
	default: Temporal.Now.plainDateISO(),
})
const focusedDateTupleSelector = selector<DateTuple>({
	key: `focusedDateTuple`,
	get: ({ get }) => {
		const date = get(focusedDateAtom)
		return [date.year, date.month, date.day]
	},
})

const focusedMealNameAtom = atom<MealName | null>({
	key: `focusedMealName`,
	default: () => {
		const nowTime = Temporal.Now.plainTimeISO()
		switch (nowTime.hour) {
			case 4:
			case 5:
			case 6:
			case 7:
			case 8:
			case 9:
			case 10:
				return `breakfast`
			case 11:
				return `brunch`
			case 12:
			case 13:
			case 14:
				return `lunch`
			case 15:
			case 16:
			case 17:
				return `tea`
			case 18:
			case 19:
			case 20:
			case 21:
				return `dinner`
			default:
				return `supper`
		}
	},
})

const foodItemKeysAtoms = atomFamily<Loadable<string[]>, DateTuple, ClientError>(
	{
		key: `foodItemKeys`,
		default: async ([year, month, day]) => {
			const foodItems = await trpcClient.carbiter.getFoodItems.query({
				year,
				month,
				day,
			})
			for (const item of foodItems) setState(foodItemAtoms, item.id, item)
			return foodItems.map((item) => item.id)
		},
		catch: [TRPCClientError],
	},
)

const foodItemAtoms = atomFamily<Loadable<FoodItem>, string, ClientError>({
	key: `foodItem`,
	default: trpcClient.carbiter.getFoodItem.query,
	catch: [TRPCClientError],
})

const mealsTodaySelector = selector<Loadable<Record<MealName, string[]>>>({
	key: `mealsToday`,
	get: async ({ get }) => {
		const [year, month, day] = get(focusedDateTupleSelector)
		const meals: Record<MealName, string[]> = {
			breakfast: [],
			brunch: [],
			lunch: [],
			tea: [],
			dinner: [],
			supper: [],
		}
		const foodItemKeys = await get(foodItemKeysAtoms, [year, month, day])
		if (Error.isError(foodItemKeys)) return meals
		for (const id of foodItemKeys) {
			const foodItem = await get(foodItemAtoms, id)
			if (Error.isError(foodItem)) continue
			const meal = meals[foodItem.meal]
			meal.push(id)
		}
		return meals
	},
})

const totalMealCarbsSelectors = selectorFamily<Loadable<number>, MealName>({
	key: `totalMealCarbs`,
	get:
		(mealName) =>
		async ({ get }) => {
			const focusedDate = get(focusedDateTupleSelector)
			const foodItemKeys = await get(foodItemKeysAtoms, focusedDate)
			if (Error.isError(foodItemKeys)) return 0
			let total = 0
			for (const id of foodItemKeys) {
				const foodItem = await get(foodItemsOverlaySelectors, id)
				if (foodItem.meal !== mealName) continue
				total += foodItem.carbs
			}
			return total
		},
})

const totalMealProteinSelectors = selectorFamily<Loadable<number>, MealName>({
	key: `totalMealProtein`,
	get:
		(mealName) =>
		async ({ get }) => {
			const focusedDate = get(focusedDateTupleSelector)
			const foodItemKeys = await get(foodItemKeysAtoms, focusedDate)
			if (Error.isError(foodItemKeys)) return 0
			let total = 0
			for (const id of foodItemKeys) {
				const foodItem = await get(foodItemsOverlaySelectors, id)
				if (foodItem.meal !== mealName) continue
				total += foodItem.protein
			}
			return total
		},
})

const foodItemsEditsAtoms = atomFamily<Partial<FoodItem>, string>({
	key: `foodItemsEdits`,
	default: {},
})

const foodItemsEditsKeysAtom = mutableAtom<UList<string>>({
	key: `foodItemsEditsKeys`,
	class: UList,
})

const foodItemsOverlaySelectors = selectorFamily<Loadable<FoodItem>, string>({
	key: `foodItemsOverlay`,
	get:
		(id) =>
		async ({ get }) => {
			const foodItemBase = await get(foodItemAtoms, id)
			if (Error.isError(foodItemBase)) return EMPTY_FOOD_ITEM
			const foodItemEdits = get(foodItemsEditsAtoms, id)
			return { ...foodItemBase, ...foodItemEdits }
		},
})

const totalDailyCarbsSelector = selector<Loadable<number>>({
	key: `totalDailyCarbs`,
	get: async ({ get }) => {
		const focusedDate = get(focusedDateTupleSelector)
		const foodItemKeys = await get(foodItemKeysAtoms, focusedDate)
		if (Error.isError(foodItemKeys)) return 0
		let total = 0
		for (const id of foodItemKeys) {
			const foodItem = await get(foodItemsOverlaySelectors, id)
			total += foodItem.carbs
		}
		return total
	},
})

const totalDailyProteinSelector = selector<Loadable<number>>({
	key: `totalDailyProtein`,
	get: async ({ get }) => {
		const focusedDate = get(focusedDateTupleSelector)
		const foodItemKeys = await get(foodItemKeysAtoms, focusedDate)
		if (Error.isError(foodItemKeys)) return 0
		let total = 0
		for (const id of foodItemKeys) {
			const foodItem = await get(foodItemsOverlaySelectors, id)
			total += foodItem.protein
		}
		return total
	},
})
