import { attachIntrospectionStates } from "../introspection"

export * from "./AtomIODevtools"

export const {
	atomIndex,
	selectorIndex,
	transactionIndex,
	findTransactionLogState,
} = attachIntrospectionStates()
