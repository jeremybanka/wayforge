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

export type FoodItem = Pick<
	InferSelectModel<typeof foodItems>,
	`carbs` | `id` | `meal` | `name` | `protein`
>
type ClientError = TRPCClientError<typeof appRouter>

export const MEAL_NAMES = [
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
export type MealName = (typeof MEAL_NAMES)[number]

export const EMPTY_MEALS: Record<MealName, string[]> = {
	breakfast: [],
	brunch: [],
	lunch: [],
	tea: [],
	dinner: [],
	supper: [],
}

export const newFoodItemNameAtom = atom<string>({
	key: `newFoodItemName`,
	default: ``,
})
export async function addFoodItem(meal: MealName): Promise<void> {
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
export async function deleteFoodItem(foodItemId: string): Promise<void> {
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

export const EMPTY_FOOD_ITEM: FoodItem = {
	carbs: 0,
	id: ``,
	meal: `breakfast`,
	name: ``,
	protein: 0,
}

type DateTuple = readonly [year: number, month: number, day: number]

export const focusedDateAtom = atom<Temporal.PlainDate>({
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

export const focusedMealNameAtom = atom<MealName | null>({
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

export const mealsTodaySelector = selector<Loadable<Record<MealName, string[]>>>(
	{
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
	},
)

export const totalMealCarbsSelectors = selectorFamily<
	Loadable<number>,
	MealName
>({
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

export const totalMealProteinSelectors = selectorFamily<
	Loadable<number>,
	MealName
>({
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

export const foodItemsEditsAtoms = atomFamily<Partial<FoodItem>, string>({
	key: `foodItemsEdits`,
	default: {},
})

export const foodItemsEditsKeysAtom = mutableAtom<UList<string>>({
	key: `foodItemsEditsKeys`,
	class: UList,
})

export const foodItemsOverlaySelectors = selectorFamily<
	Loadable<FoodItem>,
	string
>({
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

export const totalDailyCarbsSelector = selector<Loadable<number>>({
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

export const totalDailyProteinSelector = selector<Loadable<number>>({
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
