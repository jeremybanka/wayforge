import type { Children } from "@atom.io/spa"
import {
	onCleanup,
	onCommit,
	useDisposal,
	useGetter,
	useId,
	useSetter,
} from "@atom.io/spa"

import { spinnerFrames, spinnerTextAtoms } from "../services/ui-state"
import css from "./VersionSpinner.module.css"

export function VersionSpinner(props: {
	input: Promise<string> | string
}): Children {
	const instanceKey = useId()
	const disposeState = useDisposal()
	const text = useGetter(spinnerTextAtoms, instanceKey)
	const setText = useSetter(spinnerTextAtoms, instanceKey)
	onCleanup(() => {
		disposeState(spinnerTextAtoms, instanceKey)
	})
	onCommit(
		() => props.input,
		(input) => {
			if (typeof input === `string`) {
				setText(input)
				return
			}
			let active = true
			let frame = 0
			const interval = setInterval(() => {
				setText(spinnerFrames[frame++ % spinnerFrames.length])
			}, 100)
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
			return () => {
				active = false
				clearInterval(interval)
			}
		},
	)
	return (
		<version-spinner className={css.class}>
			<span>{text()}</span>
		</version-spinner>
	)
}
