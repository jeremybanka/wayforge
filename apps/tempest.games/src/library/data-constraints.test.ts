import { z } from "zod"

import { passwordSchema } from "./data-constraints"

describe(`password complexity`, () => {
	test(`should roughly sort good passwords from bad`, () => {
		const goodPasswords = [
			`correcthorsebatterystaple`,
			`0c5d2b7c-3205-4c32-bc4f-be280e1fdabf`,
			`haha, the quick brown fox jumps over the lazy dog!`,
			`A1b2C3d4E5F6!`,
		]
		const badPasswords = [
			`password`,
			`P@ssw0rd`,
			`P@55w0rd!`,
			`passwordpasswordpassword`,
			`12345678`,
			`qwerty`,
			`footballLOL`,
			`kitty`,
		]

		for (const pwd of goodPasswords) {
			expect(passwordSchema.safeParse(pwd).success ? pwd : null).toBe(pwd)
		}
		for (const pwd of badPasswords) {
			expect(passwordSchema.safeParse(pwd).success ? pwd : null).toBe(null)
		}
	})
})
