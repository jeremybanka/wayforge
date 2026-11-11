import type { Children } from "@atom.io/spa"
import { useGetter, useLoadable, useSetter } from "@atom.io/spa"
import { getState, setState } from "atom.io"

import { trpcClient } from "../../services/trpc-client-service"
import type { FoodItem as FoodItemData, MealName } from "./carbiter-state"
import {
	addFoodItem,
	deleteFoodItem,
	EMPTY_FOOD_ITEM,
	EMPTY_MEALS,
	focusedDateAtom,
	focusedMealNameAtom,
	foodItemsEditsAtoms,
	foodItemsEditsKeysAtom,
	foodItemsOverlaySelectors,
	MEAL_NAMES,
	mealsTodaySelector,
	newFoodItemNameAtom,
	totalDailyCarbsSelector,
	totalDailyProteinSelector,
	totalMealCarbsSelectors,
	totalMealProteinSelectors,
} from "./carbiter-state"
import css from "./CarbiterView.module.css"

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
						<Meal key={mealName} />
					) : (
						<InactiveMeal key={mealName} />
					),
				)}
			</meal-content>
			<meal-actions>
				<form onSubmit={submit}>
					{editedItemKeys().size > 0 ? (
						<button
							type="button"
							onClick={async () => {
								const edits: [string, Partial<FoodItemData>][] = []
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

function Meal(props: { key: MealName }): Children {
	const mealsToday = useLoadable(mealsTodaySelector, EMPTY_MEALS)
	return (
		<section>
			<MealHeader key={props.key} />
			<meal-content>
				{mealsToday().value[props.key].map((id) => (
					<FoodItem key={id} />
				))}
			</meal-content>
		</section>
	)
}

function InactiveMeal(props: { key: MealName }): Children {
	return (
		<section data-css="inactive-meal">
			<MealHeader key={props.key} />
		</section>
	)
}
function MealHeader(props: { key: MealName }): Children {
	const totalCarbs = useLoadable(totalMealCarbsSelectors, props.key, 0)
	const totalProtein = useLoadable(totalMealProteinSelectors, props.key, 0)
	return (
		<meal-heading>
			<button
				type="button"
				onClick={() => {
					setState(focusedMealNameAtom, (current) =>
						current === props.key ? null : props.key,
					)
				}}
			>
				{props.key}
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

function FoodItem(props: { key: string }): Children {
	const foodItem = useLoadable(
		foodItemsOverlaySelectors,
		props.key,
		EMPTY_FOOD_ITEM,
	)
	return (
		<article>
			<meal-heading>
				<button
					type="button"
					onClick={() => {
						void deleteFoodItem(props.key)
					}}
				>
					x
				</button>
				<input
					type="text"
					value={foodItem().value.name}
					onInput={(e) => {
						setState(foodItemsEditsAtoms, props.key, (prev) => ({
							...prev,
							name: e.currentTarget.value,
						}))
						setState(foodItemsEditsKeysAtom, (current) => current.add(props.key))
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
							setState(foodItemsEditsAtoms, props.key, (prev) => ({
								...prev,
								carbs: Number.parseInt(e.currentTarget.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) =>
								current.add(props.key),
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
							setState(foodItemsEditsAtoms, props.key, (prev) => ({
								...prev,
								protein: Number.parseInt(e.currentTarget.value, 10),
							}))
							setState(foodItemsEditsKeysAtom, (current) =>
								current.add(props.key),
							)
						}}
					/>
					<span data-css="stats-unit">protein</span>
				</label>
			</meal-content>
		</article>
	)
}
