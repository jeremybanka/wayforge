import type { Children } from "@atom.io/spa"
import { useGetter, useLoadable, useSetter } from "@atom.io/spa"
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
import { UList } from "atom.io/transceivers/u-list"
import type { InferSelectModel } from "drizzle-orm"
import { nanoid } from "nanoid"

import { trpcClient } from "../../services/trpc-client-service"
import css from "./CarbiterView.module.css"

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

export function CarbiterView(): Children {
	const focusedMeal = useGetter(focusedMealNameAtom)
	const focusedDate = useGetter(focusedDateAtom)
	const newFoodItemName = useGetter(newFoodItemNameAtom)
	const setNewFoodItemName = useSetter(newFoodItemNameAtom)
	const change = (e: Event & { currentTarget: HTMLInputElement }) => {
		setNewFoodItemName(e.currentTarget.value)
	}
	const submit = (e: SubmitEvent) => {
		e.preventDefault()
		const meal = focusedMeal()
		if (meal) void addFoodItem(meal)
	}

	const editedItemKeys = useGetter(foodItemsEditsKeysAtom)
	const totalDailyCarbs = useLoadable(totalDailyCarbsSelector, 0)
	const totalDailyProtein = useLoadable(totalDailyProteinSelector, 0)
	return (
		<carbiter-view className={css.class}>
			<meal-heading>
				<nav>
					<button
						type="button"
						onClick={() => {
							setState(focusedDateAtom, (current) => current.add({ days: -1 }))
						}}
					>{`<-`}</button>
					<span>
						{focusedDate().toLocaleString(`en-US`, { dateStyle: `full` })}
					</span>
					<button
						type="button"
						onClick={() => {
							setState(focusedDateAtom, (current) => current.add({ days: 1 }))
						}}
					>{`->`}</button>
				</nav>
			</meal-heading>
			<span />
			<meal-content>
				{MEAL_NAMES.map((mealName) =>
					focusedMeal() === mealName ? (
						<Meal key={mealName} mealName={mealName} />
					) : (
						<InactiveMeal key={mealName} mealName={mealName} />
					),
				)}
			</meal-content>
			<meal-actions>
				<form onSubmit={submit}>
					{editedItemKeys().size > 0 ? (
						<button
							type="button"
							onClick={async () => {
								const edits: [string, Partial<FoodItem>][] = []
								for (const id of editedItemKeys()) {
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
								value={newFoodItemName()}
								onInput={change}
								placeholder="add to current meal..."
							/>
							<button type="submit">{`>>->`}</button>
						</>
					)}
				</form>
			</meal-actions>
			<aside>
				<span />
				<meal-content data-css="stats">
					<data data-css="stat">
						<output data-css="stats-number">{totalDailyCarbs().value}</output>
						<span data-css="stats-unit">carbs</span>
					</data>
					<data data-css="stat">
						<output data-css="stats-number">{totalDailyProtein().value}</output>
						<span data-css="stats-unit">protein</span>
					</data>
				</meal-content>
			</aside>
		</carbiter-view>
	)
}

function Meal(props: { mealName: MealName }): Children {
	const mealsToday = useLoadable(mealsTodaySelector, EMPTY_MEALS)
	return (
		<section>
			<MealHeader mealName={props.mealName} />
			<meal-content>
				{mealsToday().value[props.mealName].map((id) => (
					<FoodItem key={id} id={id} />
				))}
			</meal-content>
		</section>
	)
}

function InactiveMeal(props: { mealName: MealName }): Children {
	return (
		<section data-css="inactive-meal">
			<MealHeader mealName={props.mealName} />
		</section>
	)
}
function MealHeader(props: { mealName: MealName }): Children {
	const totalCarbs = useLoadable(totalMealCarbsSelectors, props.mealName, 0)
	const totalProtein = useLoadable(totalMealProteinSelectors, props.mealName, 0)
	return (
		<meal-heading>
			<button
				type="button"
				onClick={() => {
					setState(focusedMealNameAtom, (current) =>
						current === props.mealName ? null : props.mealName,
					)
				}}
			>
				{props.mealName}
			</button>
			<aside data-css="stats">
				<data data-css="stat">
					<output data-css="stats-number">{totalCarbs().value}</output>
					<span data-css="stats-unit">carbs</span>
				</data>
				<data data-css="stat">
					<output data-css="stats-number">{totalProtein().value}</output>
					<span data-css="stats-unit">protein</span>
				</data>
			</aside>
		</meal-heading>
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

function FoodItem(props: { id: string }): Children {
	const foodItem = useLoadable(
		foodItemsOverlaySelectors,
		props.id,
		EMPTY_FOOD_ITEM,
	)
	return (
		<article>
			<meal-heading>
				<button
					type="button"
					onClick={() => {
						void deleteFoodItem(props.id)
					}}
				>
					x
				</button>
				<input
					type="text"
					value={foodItem().value.name}
					onInput={(e) => {
						setState(foodItemsEditsAtoms, props.id, (prev) => ({
							...prev,
							name: e.currentTarget.value,
						}))
						setState(foodItemsEditsKeysAtom, (current) => current.add(props.id))
					}}
				/>
			</meal-heading>
			<meal-content data-css="stats">
				<label data-css="stat">
					<input
						data-css="stats-number"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={foodItem().value.carbs}
						onInput={(e) => {
							setState(foodItemsEditsAtoms, props.id, (prev) => ({
								...prev,
								carbs: Number.parseInt(e.currentTarget.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) =>
								current.add(props.id),
							)
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
						value={foodItem().value.protein}
						onInput={(e) => {
							setState(foodItemsEditsAtoms, props.id, (prev) => ({
								...prev,
								protein: Number.parseInt(e.currentTarget.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) =>
								current.add(props.id),
							)
						}}
					/>
					<span data-css="stats-unit">protein</span>
				</label>
			</meal-content>
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
