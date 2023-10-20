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
	const [userHasToggled, setUserHasToggled] = React.useState(false)
	const pathname = usePathname()

	React.useEffect(() => {
		setCurrentId(null)
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
			for (const element of headingElements) {
				observer.observe(element)
			}
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
			<Spotlight
				elementId="on-this-page"
				padding={20}
				updateSignals={[userHasToggled, pathname]}
			/>
			<Spotlight
				elementId={currentId ? currentId + `-link` : null}
				updateSignals={[userHasToggled, pathname]}
			/>
			<nav id="on-this-page" data-user-has-toggled={userHasToggled}>
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
		</>
	)
}

export type ElementPosition = Pick<DOMRect, `height` | `left` | `top` | `width`>
export type SpotlightProps = {
	elementId: string | null
	startingPosition?: ElementPosition
	padding?: number
	updateSignals?: any[]
}
export function Spotlight({
	elementId,
	startingPosition = {
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	},
	padding = 0,
	updateSignals = [],
}: SpotlightProps): JSX.Element | null {
	const [position, setPosition] = React.useState(startingPosition)
	React.useEffect(() => {
		if (!elementId) {
			setPosition(startingPosition)
			return
		}
		const element = document.getElementById(elementId)
		if (element) {
			const updatePosition = () => {
				const e = document.getElementById(elementId)
				if (!e) {
					return
				}
				const boundingRect = e.getBoundingClientRect()
				setPosition(boundingRect)
			}
			element.addEventListener(``, updatePosition)
			updatePosition()
			addEventListener(`resize`, updatePosition)
			return () => {
				removeEventListener(`resize`, updatePosition)
				element.removeEventListener(`resize`, updatePosition)
			}
		} else {
			setPosition(startingPosition)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [elementId, ...updateSignals])
	return position.width === 0 ? null : (
		<data
			style={{
				position: `fixed`,
				top: position.top - padding,
				left: position.left - padding,
				width: position.width + padding * 2,
				height: position.height + padding * 2,
			}}
		/>
	)
}

export function SiteDirectory(): JSX.Element {
	const pathname = usePathname()
	const pathnameId = pathname.replaceAll(`/`, `-`) + `-link`

	return (
		<>
			<Spotlight elementId={pathnameId} />
			<nav>
				<section>
					<header>Interface</header>
					<main>
						<section>
							<Link id="-docs-link" href={`/docs`}>
								atom.io
							</Link>
						</section>
						<section>
							<Link id="-docs-react-link" href={`/docs/react`}>
								<span className="soft">atom.io</span>/react
							</Link>
						</section>
					</main>
				</section>
			</nav>
		</>
	)
}
