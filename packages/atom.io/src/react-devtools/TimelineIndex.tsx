import {
	undo,
	type AtomToken,
	type ReadonlySelectorToken,
	type TimelineToken,
	redo,
} from "atom.io"
import { useIO, useO } from "atom.io/react"
import { Fragment, type FC } from "react"

import { findTimelineState, findViewIsOpenState, timelineIndex } from "."
import { button } from "./Button"
import { article } from "./Updates"
import type { Timeline } from "../internal"

export const YouAreHere: FC = () => {
	return <span className="you_are_here">you are here</span>
}

export const TimelineLog: FC<{
	token: TimelineToken
	isOpenState: AtomToken<boolean>
	timelineState: ReadonlySelectorToken<Timeline>
}> = ({ token, isOpenState, timelineState }) => {
	const timeline = useO(timelineState)
	const [isOpen, setIsOpen] = useIO(isOpenState)

	return (
		<section className="node timeline_log">
			<header>
				<button.OpenClose isOpen={isOpen} setIsOpen={setIsOpen} />
				<label>
					<h2>{token.key}</h2>
					<span className="detail length">
						({timeline.at}/{timeline.history.length})
					</span>
					<span className="gap" />
					<nav>
						<button
							type="button"
							onClick={() => undo(token)}
							disabled={timeline.at === 0}
						>
							undo
						</button>
						<button
							type="button"
							onClick={() => redo(token)}
							disabled={timeline.at === timeline.history.length}
						>
							redo
						</button>
					</nav>
				</label>
			</header>
			{isOpen ? (
				<main>
					{timeline.history.map((update, index) => (
						<Fragment key={update.key + index + timeline.at}>
							{index === timeline.at ? <YouAreHere /> : null}
							<article.TimelineUpdate timelineUpdate={update} />
							{index === timeline.history.length - 1 &&
							timeline.at === timeline.history.length ? (
								<YouAreHere />
							) : null}
						</Fragment>
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
			{tokenIds
				.filter((token) => !token.key.startsWith(`👁‍🗨`))
				.map((token) => {
					return (
						<TimelineLog
							key={token.key}
							token={token}
							isOpenState={findViewIsOpenState(token.key)}
							timelineState={findTimelineState(token.key)}
						/>
					)
				})}
		</article>
	)
}
