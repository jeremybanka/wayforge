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
<<<<<<< HEAD
	const [userHasToggled, setUserHasToggled] = React.useState(false)
	const pathname = usePathname()

	React.useEffect(() => {
		setCurrentId(null)
=======
	// const articleRef = React.useRef<HTMLElement | null>(null);

	React.useEffect(() => {
>>>>>>> d1d0105b (✨ track navigation)
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
	}, [pathname])

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
<<<<<<< HEAD
			<Spotlight elementId={currentId + "-link" || ""} />
			<nav data-user-has-toggled={userHasToggled}>
				<section>
					<header>On this page</header>
					<main>{renderHeadings(headings, 2)}</main>
				</section>
			</nav>
			<input
				type="checkbox"
				checked={userHasToggled}
				onChange={() => setUserHasToggled(!userHasToggled)}
			/>
=======
			<Spotlight elementId={currentId || ""} />
			<nav>
				<header>On this page</header>
				{renderHeadings(headings, 2)}
			</nav>
>>>>>>> d1d0105b (✨ track navigation)
		</>
	)
}

<<<<<<< HEAD
export type ElementPosition = Pick<DOMRect, "top" | "left" | "width" | "height">
export type SpotlightProps = {
	elementId: string
	startingPosition?: ElementPosition
}
export function Spotlight({
	elementId,
	startingPosition = {
=======
export type SpotlightProps = {
	elementId: string
}
export function Spotlight({ elementId }: SpotlightProps): JSX.Element {
	const [elementPosition, setElementPosition] = React.useState<
		Pick<DOMRect, "top" | "left" | "width" | "height">
	>({
>>>>>>> d1d0105b (✨ track navigation)
		top: 0,
		left: 0,
		width: 0,
		height: 0,
<<<<<<< HEAD
	},
}: SpotlightProps): JSX.Element {
	const [position, setPosition] = React.useState(startingPosition)
	React.useEffect(() => {
		const element = document.getElementById(elementId)
		if (element) {
			const updatePosition = () => {
				const boundingRect = element.getBoundingClientRect()
				setPosition(boundingRect)
			}
			updatePosition()
			addEventListener(`resize`, updatePosition)
			return () => {
				removeEventListener(`resize`, updatePosition)
			}
		}
=======
	})
	React.useEffect(() => {
		const element = document.getElementById(elementId + "-link")
		if (element) {
			setElementPosition(element.getBoundingClientRect())
		}

		console.log(elementId, element, elementPosition)
>>>>>>> d1d0105b (✨ track navigation)
	}, [elementId])
	return (
		<div
			style={{
				position: "fixed",
<<<<<<< HEAD
				opacity: position.width > 0 ? 1 : 0,
				top: position.top,
				left: position.left,
				width: position.width,
				height: position.height,
=======
				top: elementPosition.top,
				left: elementPosition.left,
				width: elementPosition.width,
				height: elementPosition.height,
>>>>>>> d1d0105b (✨ track navigation)
				background: "var(--bg-hard-2)",
				borderRadius: 5,
				border: "1px solid var(--hyperlink-color)",
				zIndex: -1,
<<<<<<< HEAD
				transition:
					"width .2s ease-in-out, height .2s ease-in-out, top .2s ease-in-out, left .2s ease-in-out, opacity 1.5s linear",
			}}
		/>
	)
}

export function SiteDirectory() {
	const pathname = usePathname()
	const pathname1 = pathname.replaceAll(`/`, `-`) + `-link`
	console.log(pathname1)
	return (
		<>
			<Spotlight elementId={pathname1} />
			<nav>
				<section>
					<header>Interface</header>
					<main>
						<section>
							<Link
								id="-docs-link"
								className={pathname === `/docs` ? `active` : undefined}
								href={"/docs"}
							>
								atom.io
							</Link>
						</section>
						<section>
							<Link
								id="-docs-react-link"
								className={pathname === `/docs/react` ? `active` : `disabled`}
								href={"/docs/react"}
							>
								<span className="soft">atom.io</span>/react
							</Link>
						</section>
					</main>
				</section>
			</nav>
		</>
	)
=======
				transitionProperty: "top, left, width, height",
				transitionDuration: "200ms",
				transitionTimingFunction: "ease-out",
			}}
		/>
	)
>>>>>>> d1d0105b (✨ track navigation)
}
