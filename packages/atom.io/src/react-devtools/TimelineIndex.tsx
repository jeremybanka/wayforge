import type {
	AtomToken,
	ReadonlySelectorToken,
	TimelineToken,
	TimelineUpdate,
} from "atom.io"
import { useIO, useO } from "atom.io/react"
import type { FC } from "react"

import { findTimelineLogState, findViewIsOpenState, timelineIndex } from "."
import { button } from "./Button"
import { article } from "./Updates"

export const TimelineLog: FC<{
	token: TimelineToken
	isOpenState: AtomToken<boolean>
	logState: ReadonlySelectorToken<TimelineUpdate[]>
}> = ({ token, isOpenState, logState }) => {
	const log = useO(logState)
	const [isOpen, setIsOpen] = useIO(isOpenState)

	return (
		<section className="node timeline_log">
			<header>
				<button.OpenClose isOpen={isOpen} setIsOpen={setIsOpen} />
				<label>
					<h3>{token.key}</h3>
					<span className="detail length">({log.length})</span>
				</label>
			</header>
			{isOpen ? (
				<main>
					{log.map((update, index) => (
						<article.TimelineUpdate
							key={update.key + index}
							timelineUpdate={update}
						/>
					))}
				</main>
			) : null}
		</section>
	)
}

export const TimelineIndex: FC = () => {
	const tokenIds = useO(timelineIndex)
	return (
		<article className="index timeline_index">
			<h2>transactions</h2>
			<main>
				{tokenIds
					.filter((token) => !token.key.startsWith(`👁‍🗨`))
					.map((token) => {
						return (
							<TimelineLog
								key={token.key}
								token={token}
								isOpenState={findViewIsOpenState(token.key)}
								logState={findTimelineLogState(token.key)}
							/>
						)
					})}
			</main>
		</article>
	)
}
