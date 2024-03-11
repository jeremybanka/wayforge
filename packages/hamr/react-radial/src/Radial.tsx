import { AnimatePresence } from "framer-motion"
import { makeMouseHandlers } from "hamr/react-click-handlers"
import { setCssVars } from "hamr/react-css-vars"
import * as React from "react"

import type { RadialAction, RadialMode } from "."
import { header } from "./<header>"

import "./react-radial-styles.scss"

export type RadialProps = {
	mouseActivationMethod?: string
	useActions: () => RadialAction[]
	useMousePosition: () => {
		x: number
		y: number
	}
	useMode: () => [RadialMode, (newMode: RadialMode) => void]
	size?: number
}

export const Radial = ({
	useActions,
	useMousePosition,
	useMode,
	size = 60,
}: RadialProps): JSX.Element => {
	const actions = useActions()
	const position = useMousePosition()
	const [mode, setMode] = useMode()

	const isActive = mode !== `idle`

	const activePosition = React.useRef<{
		x: number
		y: number
	} | null>(null)

	const hasPressed = React.useRef<number | null>(null)
	const label = React.useRef<string | null>(null)

	if (isActive && activePosition.current === null) {
		activePosition.current = position
	} else if (!isActive) {
		activePosition.current = null
	}

	const currentPosition = {
		...position,
		...(activePosition.current ?? {}),
	}

	const ringRatio = Math.sqrt(Math.max(actions.length, 4) - 2)

	return (
		<>
			<div
				className="react_radial_0123456790"
				style={setCssVars({
					"--action-count": `${actions.length}`,
					"--x": currentPosition.x + `px`,
					"--y": currentPosition.y + `px`,
					"--ring-size": ringRatio * size + `px`,
					"--option-size": (isActive ? size : 20) + `px`,
					"--is-active-pointer-events": isActive ? `all` : `none`,
					"--is-active-opacity": isActive ? 1 : 0.1,
					"--is-active-background": isActive ? `#3337` : `#fff`,
					"--is-active-border": isActive ? `1px solid #fff` : `10px solid #000`,
				})}
			>
				{mode === `open` ? (
					<div
						className={`radial-option back`}
						onMouseUp={() => {
							setMode(`idle`)
						}}
						onTouchStartCapture={() => {
							setMode(`idle`)
						}}
						onContextMenu={(e) => {
							e.preventDefault()
						}}
					>
						x
					</div>
				) : null}
				{actions.map((opt, idx): React.ReactElement => {
					return (
						<div
							key={idx}
							className={
								`radial-option` + (hasPressed.current === idx ? ` pressed` : ``)
							}
							style={setCssVars({ "--idx": `${idx}` })}
							{...makeMouseHandlers({
								onMouseUpR: () => (
									opt.do(),
									(hasPressed.current = idx),
									setTimeout(
										() => (setMode(`idle`), (hasPressed.current = null)),
										250,
									)
								),
								onMouseUpL: opt.do,
							})}
							onMouseEnter={() => (label.current = opt.label)}
							onMouseLeave={() => (label.current = null)}
						>
							{idx + 1}
						</div>
					)
				})}
			</div>
			<footer
				className="react_radial_0123456790__info"
				style={setCssVars({
					"--x": currentPosition.x + `px`,
					"--y": currentPosition.y + `px`,
					"--size": ringRatio * size + `px`,
				})}
			>
				<AnimatePresence>
					{label.current === null ? null : (
						<header.roundedInverse
							initial={{ opacity: 0, transform: `scale(0.95)` }}
							animate={{ opacity: 1, transform: `scale(1)` }}
							exit={{ opacity: 0, transform: `scale(0.95)` }}
							transition={{ duration: 0.1 }}
						>
							{label.current}
						</header.roundedInverse>
					)}
				</AnimatePresence>
			</footer>
		</>
	)
}
