import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

import { users } from "../../database/tempest-db-schema"
import { signUpType } from "../../library/data-constraints"
import { trpc } from "../router"

export const signUp = trpc.procedure
	.input(signUpType)
	.mutation(async ({ input, ctx }) => {
		const { username, password, email } = input
		ctx.logger.info(`🔑 attempting to sign up:`, username)
		const maybeUser = await ctx.db.drizzle.query.users.findFirst({
			columns: { id: true },
			where: eq(users.emailVerified, email),
		})
		if (maybeUser) {
			throw new TRPCError({
				code: `BAD_REQUEST`,
				message: `This email was already verified on another account.`,
			})
		}
		const passwordHash = await Bun.password.hash(password, {
			algorithm: `bcrypt`,
			cost: 10,
		})
		await ctx.db.drizzle.insert(users).values({
			username,
			emailOffered: email,
			password: passwordHash,
			createdIp: ctx.ip,
		})
		ctx.logger.info(`🔑 user created:`, username)
		return { status: 201 }
	})
