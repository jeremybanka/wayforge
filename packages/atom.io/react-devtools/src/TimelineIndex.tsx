import type {
	ReadonlySelectorToken,
	RegularAtomToken,
	TimelineToken,
} from "atom.io"
import { redo, undo } from "atom.io"
import type { Timeline } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import { type FC, Fragment } from "react"

import { findTimelineState, findViewIsOpenState, timelineIndex } from "."
import { button } from "./Button"
import { article } from "./Updates"

export const YouAreHere: FC = () => {
	return <span className="you_are_here">you are here</span>
}

export const TimelineLog: FC<{
	token: TimelineToken<any>
	isOpenState: RegularAtomToken<boolean>
	timelineState: ReadonlySelectorToken<Timeline<any>>
}> = ({ token, isOpenState, timelineState }) => {
	const timeline = useO(timelineState)
	const isOpen = useO(isOpenState)
	const setIsOpen = useI(isOpenState)

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
