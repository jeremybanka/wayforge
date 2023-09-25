import { useI, useO } from "atom.io/react"
import { LayoutGroup, motion, spring } from "framer-motion"
import { useRef } from "react"

import {
	atomIndex,
	devtoolsAreOpenState,
	devtoolsViewOptionsState,
	devtoolsViewSelectionState,
	selectorIndex,
} from "."
import { StateIndex } from "./StateIndex"
import { TimelineIndex } from "./TimelineIndex"
import { TransactionIndex } from "./TransactionIndex"

import "./devtools.scss"

export const AtomIODevtools = (): JSX.Element => {
	const constraintsRef = useRef(null)

	const setDevtoolsAreOpen = useI(devtoolsAreOpenState)
	const devtoolsAreOpen = useO(devtoolsAreOpenState)
	const setDevtoolsView = useI(devtoolsViewSelectionState)
	const devtoolsView = useO(devtoolsViewSelectionState)
	const devtoolsViewOptions = useO(devtoolsViewOptionsState)

	const mouseHasMoved = useRef(false)

	return (
		<>
			<motion.span
				ref={constraintsRef}
				className="atom_io_devtools_zone"
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
				className="atom_io_devtools"
				transition={spring}
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
										className={viewOption === devtoolsView ? `active` : ``}
										onClick={() => setDevtoolsView(viewOption)}
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
								) : devtoolsView === `timelines` ? (
									<TimelineIndex />
								) : null}
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
						👁‍🗨
					</button>
				</footer>
			</motion.main>
		</>
	)
}
