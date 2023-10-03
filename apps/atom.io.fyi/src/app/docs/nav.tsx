"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

const SUBMODULES = [``, `react`]
const INCLUDE_LIST = [`H2`, `H3`, `H4`, `H5`, `H6`]

export type ContentsProps = {
	observe: React.MutableRefObject<HTMLElement | null>
}
export function OnThisPage(): JSX.Element {
	const [headings, setHeadings] = React.useState<
		{ id: string; content: string | null; level: number }[]
	>([])
	const [currentId, setCurrentId] = React.useState<string | null>(null)
	// const articleRef = React.useRef<HTMLElement | null>(null);

	React.useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries.find((entry) => entry.isIntersecting)
				if (entry) {
					setCurrentId(entry.target.id)
				}
			},
			{
				root: null,
				threshold: 0.5,
			},
		)

		const gatherHeadings = () => {
			const allElements = document.querySelectorAll(`[id]`)
			const headingElements = Array.from(allElements).filter((element) =>
				INCLUDE_LIST.includes(element.tagName),
			)
			headingElements.forEach((element) => observer.observe(element))
			const headingDescriptors = headingElements.map((element) => ({
				id: element.id,
				content: element.textContent,
				level: parseInt(element.tagName.slice(1), 10),
			}))
			setHeadings(headingDescriptors)
		}

		gatherHeadings()
	}, [])

	const renderHeadings = (
		list: { id: string; content: string | null; level: number }[],
		level: number,
	): JSX.Element[] => {
		const output: JSX.Element[] = []
		let currentIndex = 0

		while (currentIndex < list.length) {
			const heading = list[currentIndex]
			if (heading.level === level) {
				const subHeadings: {
					id: string
					content: string | null
					level: number
				}[] = []
				currentIndex++
				while (currentIndex < list.length && list[currentIndex].level > level) {
					subHeadings.push(list[currentIndex])
					currentIndex++
				}
				output.push(
					<section key={heading.id}>
						<a
							href={`#${heading.id}`}
							id={`${heading.id}-link`}
							style={
								heading.id === currentId
									? {} // { background: "var(--bg-hard-2)" }
									: {}
							}
						>
							{heading.content}
						</a>
						{subHeadings.length > 0 && renderHeadings(subHeadings, level + 1)}
					</section>,
				)
			} else {
				currentIndex++
			}
		}

		return output
	}

	return (
		<>
			<Spotlight elementId={currentId || ""} />
			<nav>
				<header>On this page</header>
				{renderHeadings(headings, 2)}
			</nav>
		</>
	)
}

export type SpotlightProps = {
	elementId: string
}
export function Spotlight({ elementId }: SpotlightProps): JSX.Element {
	const [elementPosition, setElementPosition] = React.useState<
		Pick<DOMRect, "top" | "left" | "width" | "height">
	>({
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	})
	React.useEffect(() => {
		const element = document.getElementById(elementId + "-link")
		if (element) {
			setElementPosition(element.getBoundingClientRect())
		}

		console.log(elementId, element, elementPosition)
	}, [elementId])
	return (
		<div
			style={{
				position: "fixed",
				top: elementPosition.top,
				left: elementPosition.left,
				width: elementPosition.width,
				height: elementPosition.height,
				background: "var(--bg-hard-2)",
				borderRadius: 5,
				border: "1px solid var(--hyperlink-color)",
				zIndex: -1,
				transitionProperty: "top, left, width, height",
				transitionDuration: "200ms",
				transitionTimingFunction: "ease-out",
			}}
		/>
	)
}

export function SiteDirectory() {
	const currentHref = usePathname()
	return (
		<nav>
			<section>
				<header>Interface</header>
				<Link
					className={currentHref === `docs` ? `active` : undefined}
					href={"/docs"}
				>
					atom.io
				</Link>
				<Link
					className={currentHref === `docs/react` ? `active` : `disabled`}
					href={"/docs/react"}
				>
					<span className="soft">atom.io</span>/react
				</Link>
			</section>
		</nav>
	)
}
