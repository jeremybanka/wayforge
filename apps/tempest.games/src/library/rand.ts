import { customAlphabet } from "nanoid"

const alphabet = `abcdefghijklmnopqrstuvwxyz`

export const alphaRand = customAlphabet(alphabet, 6)

const digits = `0123456789`

export const digitRand = customAlphabet(digits, 6)
