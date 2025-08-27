import type { ChildStore } from "./is-root-store"

export const abortTransaction = (target: ChildStore): void => {
	target.logger.info(
		`🪂`,
		`transaction`,
		target.transactionMeta.update.token.key,
		`Aborting transaction`,
	)
	target.parent.child = null
}
