import "./style.css"

import type { VNode } from "preact"
import { render } from "preact"

import BezierPlayground from "./BezierPlayground.tsx"

export function App(): VNode {
	return (
		<>
			<h1>Atom.io in Preact on Vite</h1>
			<main>
				<BezierPlayground />
				<article>
					<Resource
						title="Learn Atom.io"
						description="Atom.io is where data lives."
						href="https://atom.io.fyi/docs/getting-started"
					/>
					<Resource
						title="Learn Preact"
						description="If you're new to Preact, try the interactive tutorial to learn important concepts"
						href="https://preactjs.com/tutorial"
					/>
					<Resource
						title="Learn Vite"
						description="To learn more about Vite and how you can customize it to fit your needs, take a look at their excellent documentation"
						href="https://vitejs.dev"
					/>
				</article>
			</main>
		</>
	)
}

type ResourceProps = {
	title: string
	description: string
	href: string
}
function Resource(props: ResourceProps) {
	return (
		<a href={props.href} target="_blank" class="resource" rel="noreferrer">
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</a>
	)
}

render(<App />, document.getElementById(`app`)!)
