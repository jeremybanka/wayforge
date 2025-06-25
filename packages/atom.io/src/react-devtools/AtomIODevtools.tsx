import "./devtools.css"

import { StoreContext, useI, useO } from "atom.io/react"
import { LayoutGroup, motion } from "motion/react"
import { useContext, useRef } from "react"

import { StateIndex } from "./StateIndex"
import { attachDevtoolsStates, DevtoolsContext } from "./store"
import { TimelineIndex } from "./TimelineIndex"
import { TransactionIndex } from "./TransactionIndex"

export const AtomIODevtools: React.FC = () => {
	const store = useContext(StoreContext)
	return (
		<DevtoolsContext.Provider value={attachDevtoolsStates(store)}>
			<AtomIODevtoolsInternal />
		</DevtoolsContext.Provider>
	)
}

const AtomIODevtoolsInternal = (): React.ReactNode => {
	const constraintsRef = useRef(null)

	const {
		atomIndex,
		selectorIndex,
		devtoolsAreOpenState,
		devtoolsViewSelectionState,
		devtoolsViewOptionsState,
	} = useContext(DevtoolsContext)

	const setDevtoolsAreOpen = useI(devtoolsAreOpenState)
	const devtoolsAreOpen = useO(devtoolsAreOpenState)
	const setDevtoolsView = useI(devtoolsViewSelectionState)
	const devtoolsView = useO(devtoolsViewSelectionState)
	const devtoolsViewOptions = useO(devtoolsViewOptionsState)

	const mouseHasMoved = useRef(false)

	return (
		<span
			style={{
				position: `fixed`,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				pointerEvents: `none`,
			}}
		>
			<motion.span
				ref={constraintsRef}
				data-css="atom_io_devtools_zone"
				style={{
					position: `fixed`,
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					pointerEvents: `none`,
				}}
			/>
			<motion.main
				drag
				dragConstraints={constraintsRef}
				data-css="atom_io_devtools"
				transition={{ type: `spring`, bounce: 0.25 }}
				style={
					devtoolsAreOpen
						? {}
						: {
								backgroundColor: `#0000`,
								borderColor: `#0000`,
								maxHeight: 28,
								maxWidth: 33,
							}
				}
			>
				{devtoolsAreOpen ? (
					<>
						<motion.header>
							<h1>atom.io</h1>
							<nav>
								{devtoolsViewOptions.map((viewOption) => (
									<button
										key={viewOption}
										type="button"
										data-testid={`view-${viewOption}`}
										className={viewOption === devtoolsView ? `active` : ``}
										onClick={() => {
											setDevtoolsView(viewOption)
										}}
										disabled={viewOption === devtoolsView}
									>
										{viewOption}
									</button>
								))}
							</nav>
						</motion.header>
						<motion.main>
							<LayoutGroup>
								{devtoolsView === `atoms` ? (
									<StateIndex tokenIndex={atomIndex} />
								) : devtoolsView === `selectors` ? (
									<StateIndex tokenIndex={selectorIndex} />
								) : devtoolsView === `transactions` ? (
									<TransactionIndex />
								) : (
									<TimelineIndex />
								)}
							</LayoutGroup>
						</motion.main>
					</>
				) : null}
				<footer>
					<button
						type="button"
						onMouseDown={() => (mouseHasMoved.current = false)}
						onMouseMove={() => (mouseHasMoved.current = true)}
						onMouseUp={() => {
							if (!mouseHasMoved.current) {
								setDevtoolsAreOpen((open) => !open)
							}
						}}
					>
						🔍
					</button>
				</footer>
			</motion.main>
		</span>
	)
}
