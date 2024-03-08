"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import { Spotlight } from "./Spotlight"
import { Toggle } from "./Toggle"
import scss from "./nav.module.scss"

const SUBMODULES = [``, `react`]
const INCLUDE_LIST = [`H2`, `H3`, `H4`, `H5`, `H6`]

const menuToggleState = atom<boolean>({
	key: `menuToggleState`,
	default: false,
})

export type ContentsProps = {
	observe: React.MutableRefObject<HTMLElement | null>
}
export function OnThisPage(): JSX.Element {
	const userHasToggled = useO(menuToggleState)
	const setUserHasToggled = useI(menuToggleState)

	const [headings, setHeadings] = React.useState<
		{ id: string; content: string | null; level: number }[]
	>([])
	const [currentId, setCurrentId] = React.useState<string | null>(null)
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
				level: Number.parseInt(element.tagName.slice(1), 10),
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
				updateSignals={[userHasToggled, pathname, headings]}
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
			<Toggle.Button
				checked={userHasToggled}
				onChange={() => setUserHasToggled((v) => !v)}
			>
				☰
			</Toggle.Button>
		</>
	)
}

export function SiteDirectory(): JSX.Element {
	const userHasToggled = useO(menuToggleState)

	const pathname = usePathname()
	const pathnameId = pathname.replaceAll(`/`, `-`) + `-link`

	return (
		<>
			<Spotlight
				elementId="site-directory"
				padding={20}
				updateSignals={[userHasToggled, pathname]}
			/>
			<Spotlight
				elementId={pathnameId}
				updateSignals={[userHasToggled, pathname]}
			/>
			<nav id="site-directory" data-user-has-toggled={userHasToggled}>
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
