import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import { Spotlight } from "./Spotlight"
import { Toggle } from "./Toggle"
import type { VNode } from "preact"

const SUBMODULES = [``, `react`]
const INCLUDE_LIST = [`H2`, `H3`, `H4`, `H5`, `H6`]

const menuToggleState = atom<boolean>({
	key: `menuToggleState`,
	default: false,
})

export const pathnameAtom = atom<string>({
	key: `pathName`,
	default: globalThis.location?.pathname ?? ``,
	effects: [
		({ setSelf }) => {
			globalThis.document?.addEventListener(`click`, (e) => {
				const anchor = (e.target as HTMLElement).closest(`a`)
				if (anchor && anchor instanceof HTMLAnchorElement) {
					const url = anchor.getAttribute(`href`)
					if (url?.startsWith(`/`)) {
						e.preventDefault()
						history.pushState(null, ``, url)
						setSelf(url)
					}
				}
			})
			globalThis.addEventListener?.(`popstate`, () => {
				setSelf(window.location.pathname)
			})
		},
	],
})

export type ContentsProps = {
	observe: React.RefObject<HTMLElement | null>
}
export function OnThisPage(): VNode {
	const userHasToggled = useO(menuToggleState)
	const setUserHasToggled = useI(menuToggleState)

	const [headings, setHeadings] = React.useState<
		{ id: string; content: string | null; level: number }[]
	>([])
	const [currentId, setCurrentId] = React.useState<string | null>(null)
	const pathname = useO(pathnameAtom)

	React.useEffect(() => {
		setCurrentId(null)
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries.find((e) => e.isIntersecting)
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
	): VNode[] => {
		const output: VNode[] = []
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
				onChange={() => {
					setUserHasToggled((v) => !v)
				}}
			>
				☰
			</Toggle.Button>
		</>
	)
}

export function SiteDirectory(): VNode {
	const userHasToggled = useO(menuToggleState)

	const pathname = useO(pathnameAtom)
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
					<header>Guide</header>
					<main>
						<section>
							<a id="-docs-getting-started-link" href="/docs/getting-started">
								getting started
							</a>
						</section>
					</main>
				</section>
				<section>
					<header>Interface</header>
					<main>
						<section>
							<a id="-docs-link" href={`/docs`}>
								atom.io
							</a>
						</section>
						<section>
							<a id="-docs-react-link" href={`/docs/react`}>
								<span className="soft">atom.io</span>/react
							</a>
						</section>
					</main>
				</section>
			</nav>
		</>
	)
}
