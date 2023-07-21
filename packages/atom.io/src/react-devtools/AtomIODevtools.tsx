import { atom, __INTERNAL__ } from "atom.io"
import type { StoreHooks } from "atom.io/react"
import { useI, useO, useIO } from "atom.io/react"
import { LayoutGroup, motion, spring } from "framer-motion"
import { useRef } from "react"
import type { FC } from "react"

import { TokenList } from "./TokenList"
import { attachIntrospectionStates } from "../introspection"
import { lazyLocalStorageEffect } from "../web-effects"

import "./devtools.scss"

const { atomIndex, selectorIndex } = attachIntrospectionStates()

const devtoolsAreOpenState = atom<boolean>({
	key: `👁‍🗨 Devtools Are Open`,
	default: true,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools Are Open`)],
})

type DevtoolsView = `atoms` | `selectors` | `transactions`

const devtoolsViewState = atom<DevtoolsView>({
	key: `👁‍🗨 Devtools View`,
	default: `atoms`,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View`)],
})

export const composeDevtools = (storeHooks: StoreHooks): FC => {
	const Devtools: FC = () => {
		const constraintsRef = useRef(null)

		const [devtoolsAreOpen, setDevtoolsAreOpen] =
			storeHooks.useIO(devtoolsAreOpenState)
		const [devtoolsView, setDevtoolsView] = storeHooks.useIO(devtoolsViewState)

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
							</motion.header>
							<motion.main>
								<LayoutGroup>
									{devtoolsView === `atoms` ? (
										<TokenList
											groupTitle="atoms"
											storeHooks={storeHooks}
											tokenIndex={atomIndex}
										/>
									) : devtoolsView === `selectors` ? (
										<TokenList
											groupTitle="selectors"
											storeHooks={storeHooks}
											tokenIndex={selectorIndex}
										/>
									) : devtoolsView === `transactions` ? null : null}
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

export const AtomIODevtools = composeDevtools({ useI, useO, useIO })
