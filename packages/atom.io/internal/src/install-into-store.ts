import type { AtomIOToken } from "atom.io"

import { newest } from "./lineage"
import { type Store, withdraw } from "./store"
import { isChildStore } from "./transaction"

export function installIntoStore(
	source: Store,
	target: Store,
	tokens: AtomIOToken[],
): void {
	const sourceNewest = newest(source)
	if (isChildStore(sourceNewest)) {
		source.logger.error(
			`❌`,
			`transaction`,
			sourceNewest.transactionMeta.update.key,
			`could not install the following tokens into store "${target.config.name} from "${source.config.name}":`,
			tokens,
			`${sourceNewest.config.name} is undergoing a transaction.`,
		)
		return
	}
	const targetNewest = newest(target)
	if (isChildStore(targetNewest)) {
		target.logger.error(
			`❌`,
			`transaction`,
			targetNewest.transactionMeta.update.key,
			`could not install the following tokens into store "${target.config.name} from "${source.config.name}":`,
			tokens,
			`${targetNewest.config.name} is undergoing a transaction.`,
		)
		return
	}
	for (const token of tokens) {
		const resource = withdraw(token, source)
		resource.install(target)
	}
}
