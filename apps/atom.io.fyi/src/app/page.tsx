"use client"

import scss from "./page.module.scss"

const ATOM = `atom`.split(``)
const IO = `io`.split(``)
const FYI = `fyi`.split(``)

export default function Home(): JSX.Element {
	return (
		<main className={scss.class}>
			<h1>
				<span>atom</span>
				<span>.io</span>
			</h1>
			<section>Fine-grained reactivity for any ECMAScript environment.</section>
		</main>
	)
}
