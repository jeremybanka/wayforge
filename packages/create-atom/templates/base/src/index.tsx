import { render } from "preact"

import "./style.css"
import BezierPlayground from "./BezierPlayground.tsx"

export function App() {
	return (
		<div>
			{/* <a href="https://preactjs.com" target="_blank" rel="noopener">
				<img src={preactLogo} alt="Preact logo" height="160" width="160" />
			</a> */}
			<h1>Atom.io in Preact, served and built with Vite</h1>
			{/* <div className="board"></div> */}
			<BezierPlayground />
			<section>
				<Resource
					title="Learn Preact"
					description="If you're new to Preact, try the interactive tutorial to learn important concepts"
					href="https://preactjs.com/tutorial"
				/>
				<Resource
					title="Differences to React"
					description="If you're coming from React, you may want to check out our docs to see where Preact differs"
					href="https://preactjs.com/guide/v10/differences-to-react"
				/>
				<Resource
					title="Learn Vite"
					description="To learn more about Vite and how you can customize it to fit your needs, take a look at their excellent documentation"
					href="https://vitejs.dev"
				/>
			</section>
		</div>
	)
}

type ResourceProps = {
	title: string
	description: string
	href: string
}
function Resource(props: ResourceProps) {
	return (
		<a href={props.href} target="_blank" class="resource">
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</a>
	)
}

render(<App />, document.getElementById("app")!)
