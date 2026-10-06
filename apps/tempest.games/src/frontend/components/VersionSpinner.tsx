import React, { useEffect, useRef, useState } from "react"

import css from "./VersionSpinner.module.css"

type BrailleLoaderProps = {
	input: Promise<string> | string
}

const spinnerFrames = [`⠋`, `⠙`, `⠸`, `⠴`, `⠦`, `⠇`]

export function VersionSpinner({ input }: BrailleLoaderProps): React.ReactNode {
	const spanRef = useRef<HTMLSpanElement>(null)
	const [resolved, setResolved] = useState<string | null>(
		typeof input === `string` ? input : null,
	)

	useEffect(() => {
		let isMounted = true
		let interval: NodeJS.Timeout

		if (typeof input === `string`) {
			setResolved(input)
		} else {
			let frame = 0
			interval = setInterval(() => {
				if (spanRef.current) {
					spanRef.current.textContent = spinnerFrames[frame]
					frame = (frame + 1) % spinnerFrames.length
				}
			}, 100)

			void input.then((result) => {
				if (isMounted) {
					clearInterval(interval)
					setResolved(result)
				}
			})
		}

		return () => {
			isMounted = false
			if (interval) clearInterval(interval)
		}
	}, [input])

	return (
		<version-spinner className={css.class}>
			<span ref={spanRef}>{resolved ?? spinnerFrames[0]}</span>
		</version-spinner>
	)
}
