import { verifiedUserProcedure } from "@backend/procedures"
import { TRPCError } from "@trpc/server"
import { type } from "arktype"
import { and, eq } from "drizzle-orm"

import { foodItems } from "../../database/tempest-db-schema"
import { trpc } from "../trpc-server"
import { nutritionFactsGenerator } from "./carbiter-data-gen"

export const carbiterRouter = trpc.router({
	getFoodItems: verifiedUserProcedure
		.input(type({ year: `number`, month: `number`, day: `number` }))
		.query(async ({ input, ctx }) => {
			const { year, month, day } = input
			const foodItemsThisDay = await ctx.db.drizzle.query.foodItems.findMany({
				columns: {
					id: true,
					carbs: true,
					protein: true,
					name: true,
					meal: true,
				},
				where: and(
					eq(foodItems.userId, ctx.userId),
					eq(foodItems.year, year),
					eq(foodItems.month, month),
					eq(foodItems.day, day),
				),
			})
			return foodItemsThisDay
		}),
	getFoodItem: verifiedUserProcedure
		.input(type(`string`))
		.query(async ({ input: id, ctx }) => {
			const foodItem = await ctx.db.drizzle.query.foodItems.findFirst({
				columns: {
					id: true,
					carbs: true,
					protein: true,
					name: true,
					meal: true,
				},
				where: and(eq(foodItems.userId, ctx.userId), eq(foodItems.id, id)),
			})
			if (!foodItem) throw new TRPCError({ code: `NOT_FOUND` })
			return foodItem
		}),
	addFoodItem: verifiedUserProcedure
		.input(
			type({
				year: `number`,
				month: `number`,
				day: `number`,
				meal: `"breakfast" | "brunch" | "lunch" | "tea" | "dinner" | "supper"`,
				name: `string`,
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { year, month, day, meal, name } = input
			const { carbs, protein } = await nutritionFactsGenerator(
				`Please guess an appropriate amount of carbs and protein (rounded to the nearest whole number) for this food item: "${name}"`,
			)
			const newFoodItems = await ctx.db.drizzle
				.insert(foodItems)
				.values([
					{
						userId: ctx.userId,
						year,
						month,
						day,
						meal,
						name,
						carbs,
						protein,
					},
				])
				.returning({
					id: foodItems.id,
					carbs: foodItems.carbs,
					protein: foodItems.protein,
					name: foodItems.name,
					meal: foodItems.meal,
				})
			return newFoodItems[0]
		}),
	deleteFoodItem: verifiedUserProcedure
		.input(type(`string`))
		.mutation(async ({ input: id, ctx }) => {
			const foodItem = await ctx.db.drizzle.query.foodItems.findFirst({
				columns: {
					id: true,
					carbs: true,
					protein: true,
					name: true,
					meal: true,
				},
				where: and(eq(foodItems.userId, ctx.userId), eq(foodItems.id, id)),
			})
			if (!foodItem) throw new TRPCError({ code: `NOT_FOUND` })
			await ctx.db.drizzle.delete(foodItems).where(eq(foodItems.id, id))
		}),
	saveFoodItems: verifiedUserProcedure
		.input(
			type(
				[
					`string`,
					{
						"carbs?": `number`,
						"protein?": `number`,
						"name?": `string`,
					},
				],
				`[]`,
			),
		)
		.mutation(async ({ input, ctx }) => {
			await ctx.db.drizzle.transaction(async (tx) => {
				for (const [id, updates] of input) {
					const foodItem = await tx.query.foodItems.findFirst({
						columns: {
							id: true,
							carbs: true,
							protein: true,
							name: true,
							meal: true,
						},
						where: and(eq(foodItems.userId, ctx.userId), eq(foodItems.id, id)),
					})
					if (!foodItem) throw new TRPCError({ code: `NOT_FOUND` })
					await tx.update(foodItems).set(updates).where(eq(foodItems.id, id))
				}
			})
		}),
})
