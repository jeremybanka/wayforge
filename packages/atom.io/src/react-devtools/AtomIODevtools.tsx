import { atom } from "atom.io"
import { useO, useIO } from "atom.io/react"
import { LayoutGroup, motion, spring } from "framer-motion"
import { useRef } from "react"
import type { FC } from "react"

import { atomIndex, selectorIndex } from "."
import { StateIndex } from "./StateIndex"
import { TransactionIndex } from "./TransactionIndex"
import { lazyLocalStorageEffect } from "../web-effects"

import "./devtools.scss"

const devtoolsAreOpenState = atom<boolean>({
	key: `👁‍🗨 Devtools Are Open`,
	default: true,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools Are Open`)],
})

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

const devtoolsViewSelectionState = atom<DevtoolsView>({
	key: `👁‍🗨 Devtools View Selection`,
	default: `atoms`,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View`)],
})

const devtoolsViewOptionsState = atom<DevtoolsView[]>({
	key: `👁‍🗨 Devtools View Options`,
	default: [`atoms`, `selectors`, `transactions`, `timelines`],
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View Options`)],
})

export const composeDevtools = (): FC => {
	const Devtools: FC = () => {
		const constraintsRef = useRef(null)

		const [devtoolsAreOpen, setDevtoolsAreOpen] = useIO(devtoolsAreOpenState)
		const [devtoolsView, setDevtoolsView] = useIO(devtoolsViewSelectionState)
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
										<StateIndex groupTitle="atoms" tokenIndex={atomIndex} />
									) : devtoolsView === `selectors` ? (
										<StateIndex
											groupTitle="selectors"
											tokenIndex={selectorIndex}
										/>
									) : devtoolsView === `transactions` ? (
										<TransactionIndex />
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
	return Devtools
}

export const AtomIODevtools = composeDevtools()
