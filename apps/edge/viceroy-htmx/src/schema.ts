import { z } from "zod"

export const userSchema = z.object({
	name: z.string(),
	username: z.string(),
	role: z.enum([`admin`, `user`]),
	hash: z.string(),
	salt: z.number(),
})
export type User = z.infer<typeof userSchema>
