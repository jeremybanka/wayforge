import type { Children } from "@atom.io/spa"
import { onCleanup } from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"

import { useLocalState } from "../services/spa-state"
import css from "./VersionSpinner.module.css"

const spinnerFrames = [`⠋`, `⠙`, `⠸`, `⠴`, `⠦`, `⠇`]
export function VersionSpinner(props: {
	input: Promise<string> | string
}): Children {
	const [text, setText] = useLocalState(spinnerFrames[0])
	let cancel = () => {}
	onCleanup(() => {
		cancel()
	})
	bindScene(
		() => props.input,
		(input) => {
			cancel()
			if (typeof input === `string`) {
				setText(input)
				return
			}
			let active = true
			let frame = 0
			const interval = setInterval(() => {
				setText(spinnerFrames[frame++ % spinnerFrames.length])
			}, 100)
			cancel = () => {
				active = false
				clearInterval(interval)
			}
			void input.then(
				(value) => {
					if (active) {
						clearInterval(interval)
						setText(value)
					}
				},
				() => {
					if (active) {
						clearInterval(interval)
						setText(`unavailable`)
					}
				},
			)
		},
	)
	return (
		<version-spinner className={css.class}>
			<span>{text()}</span>
		</version-spinner>
	)
}
