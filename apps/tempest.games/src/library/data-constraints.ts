import { type } from "arktype"

import { COMMON_PASSWORDS_NOT_ALLOWED } from "./common-passwords-not-allowed"

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 15
export const USERNAME_ALLOWED_CHARS = /^[a-zA-Z0-9_-]+$/
// export const usernameSchema = z
// 	.string()
// 	.min(USERNAME_MIN_LENGTH)
// 	.max(USERNAME_MAX_LENGTH)
// 	.regex(USERNAME_ALLOWED_CHARS)

export const usernameType = type(USERNAME_ALLOWED_CHARS)
	.pipe(
		type(`string > ${USERNAME_MIN_LENGTH} & string < ${USERNAME_MAX_LENGTH}`),
	)
	.brand(`username`)

const MINIMUM_PASSWORD_COMPLEXITY = 20
const LEET_SPEAK_DICTIONARY: { [key: string]: string } = {
	"0": `o`,
	"1": `l`,
	"3": `e`,
	"4": `a`,
	"5": `s`,
	"7": `t`,
	"@": `a`,
	$: `s`,
	"!": `i`,
}

function removeLeetSpeak(password: string): string {
	let normalizedPassword = ``
	for (const char of password) {
		if (char in LEET_SPEAK_DICTIONARY) {
			normalizedPassword += LEET_SPEAK_DICTIONARY[char]
		} else {
			normalizedPassword += char
		}
	}
	return normalizedPassword
}
function isCommonPassword(password: string): boolean {
	const lowerCasePassword = password.toLocaleLowerCase()
	const unLeetPassword = removeLeetSpeak(lowerCasePassword)
	for (const commonPassword of COMMON_PASSWORDS_NOT_ALLOWED) {
		if (unLeetPassword.includes(commonPassword)) {
			return true
		}
		if (lowerCasePassword.includes(commonPassword)) {
			return true
		}
	}
	return false
}
function estimateEntropy(password: string) {
	const poolSize = new Set(password).size
	const entropy = password.length * Math.log2(poolSize)
	return entropy
}
export function calculatePasswordComplexity(password: string): number {
	let score = 0
	const commonPasswordPenalty = 100
	if (isCommonPassword(password)) {
		score -= commonPasswordPenalty
	}
	score += estimateEntropy(password) * 0.5 // Adjust multiplier as needed

	return Math.max(score, 0)
}

export const passwordType = type(`string`)
	.narrow((str, ctx) => {
		const complexity = calculatePasswordComplexity(str)
		return complexity >= MINIMUM_PASSWORD_COMPLEXITY
			? true
			: ctx.mustBe(
					`Of complexity ${MINIMUM_PASSWORD_COMPLEXITY} or more. Was ${(complexity).toFixed(2)}.`,
				)
	})
	.brand(`password`)

export const credentialsType = type({
	"+": `delete`,
	username: `string`,
	password: `string`,
})

export const emailType = type(`string`).brand(`email`)

export const signupType = type({
	"+": `delete`,
	username: `string`,
	password: `string`,
	email: `string`,
})
