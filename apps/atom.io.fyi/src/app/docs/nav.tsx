"use client"

import * as React from "react"

const SUBMODULES = [``, `react`]
const INCLUDE_LIST = [`H1`, `H2`, `H3`, `H4`, `H5`, `H6`]

export type ContentsProps = {
	observe: React.MutableRefObject<HTMLElement | null>
}
export function Contents(): JSX.Element {
	const [headings, setHeadings] = React.useState<
		{ id: string; content: string | null; level: number }[]
	>([])

	React.useEffect(() => {
		const gatherHeadings = () => {
			const allElements = document.querySelectorAll(`[id]`)
			const headingList = Array.from(allElements)
				.filter((element) => INCLUDE_LIST.includes(element.tagName))
				.map((element) => ({
					id: element.id,
					content: element.textContent,
					level: parseInt(element.tagName.slice(1), 10),
				}))
			setHeadings(headingList)
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
						<a href={`#${heading.id}`}>{heading.content}</a>
						{subHeadings.length > 0 && renderHeadings(subHeadings, level + 1)}
					</section>,
				)
			} else {
				currentIndex++
			}
		}

		return output
	}

	return <nav>{renderHeadings(headings, 1)}</nav>
}
