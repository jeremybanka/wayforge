import type { Children } from "@atom.io/spa"
import { onCleanup, useGetter, useId, useSetter } from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"
import { atomFamily, disposeState } from "atom.io"

import css from "./VersionSpinner.module.css"

const spinnerFrames = [`⠋`, `⠙`, `⠸`, `⠴`, `⠦`, `⠇`]
const spinnerTextAtoms = atomFamily<string, string>({
	key: `spinnerText`,
	default: spinnerFrames[0],
})

export function VersionSpinner(props: {
	input: Promise<string> | string
}): Children {
	const instanceKey = useId()
	const text = useGetter(spinnerTextAtoms, instanceKey)
	const setText = useSetter(spinnerTextAtoms, instanceKey)
	onCleanup(() => {
		disposeState(spinnerTextAtoms, instanceKey)
	})
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
