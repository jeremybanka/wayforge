import type {
	ReadonlyPureSelectorToken,
	RegularAtomToken,
	TimelineToken,
} from "atom.io"
import { redo, undo } from "atom.io"
import { findInStore, type Timeline } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import { type FC, Fragment, useContext } from "react"

import { button } from "./Button"
import { DevtoolsContext } from "./store"
import { article } from "./Updates"

export const YouAreHere: FC = () => {
	return <span className="you_are_here">you are here</span>
}

export const TimelineLog: FC<{
	token: TimelineToken<any>
	isOpenState: RegularAtomToken<boolean>
	timelineState: ReadonlyPureSelectorToken<Timeline<any>>
}> = ({ token, isOpenState, timelineState }) => {
	const timeline = useO(timelineState)
	const isOpen = useO(isOpenState)
	const setIsOpen = useI(isOpenState)

	return (
		<section className="node timeline_log" data-testid={`timeline-${token.key}`}>
			<header>
				<button.OpenClose
					isOpen={isOpen}
					testid={`open-close-timeline-${token.key}`}
					setIsOpen={setIsOpen}
				/>
				<main>
					<h2>{token.key}</h2>
					<span className="detail length">
						({timeline.at}/{timeline.history.length})
					</span>
					<span className="gap" />
					<nav>
						<button
							type="button"
							onClick={() => {
								undo(token)
							}}
							disabled={timeline.at === 0}
						>
							undo
						</button>
						<button
							type="button"
							onClick={() => {
								redo(token)
							}}
							disabled={timeline.at === timeline.history.length}
						>
							redo
						</button>
					</nav>
				</main>
			</header>
			{isOpen ? (
				<main>
					{timeline.history.map((update, index) =>
						update.type !== `molecule_creation` &&
						update.type !== `molecule_disposal` &&
						update.type !== `state_creation` &&
						update.type !== `state_disposal` ? (
							<Fragment key={update.key + index + timeline.at}>
								{index === timeline.at ? <YouAreHere /> : null}
								<article.TimelineUpdate
									timelineUpdate={update}
									serialNumber={index}
								/>
								{index === timeline.history.length - 1 &&
								timeline.at === timeline.history.length ? (
									<YouAreHere />
								) : null}
							</Fragment>
						) : null,
					)}
				</main>
			) : null}
		</section>
	)
}

export const TimelineIndex: FC = () => {
	const { timelineIndex, timelineSelectors, viewIsOpenAtoms, store } =
		useContext(DevtoolsContext)

	const tokenIds = useO(timelineIndex)

	return (
		<article className="index timeline_index" data-testid="timeline-index">
			{tokenIds.length === 0 ? (
				<p className="index-empty-state">(no timelines)</p>
			) : (
				tokenIds
					.filter((token) => !token.key.startsWith(`👁‍🗨`))
					.map((token) => {
						return (
							<TimelineLog
								key={token.key}
								token={token}
								isOpenState={findInStore(store, viewIsOpenAtoms, [token.key])}
								timelineState={findInStore(store, timelineSelectors, token.key)}
							/>
						)
					})
			)}
		</article>
	)
}
