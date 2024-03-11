import type { KeyboardEventHandler, ReactElement } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import type { RecoilState, RecoilValueReadOnly, SetterOrUpdater } from "recoil"

export type ComboPropsCore<T> = {
	onSetSelections?: (change: { added: T } | { removed: T }) => void
	label?: string
	nullified?: boolean
	disabled?: boolean
	maxItems?: number
	minItems?: number
	constrainMinMax?: boolean
	placeholder?: string
}
export type ComboSelectionsRecoil<T> = {
	selectionsState: RecoilState<T[]>
}
export type ComboSelections<T> = {
	selections: T[]
	setSelections: SetterOrUpdater<T[]>
}
export type ComboOptionsRecoil<T> = {
	optionsState: RecoilState<T[]> | RecoilValueReadOnly<T[]>
}
export type ComboOptions<T> = {
	options: T[]
}

/* eslint-disable @typescript-eslint/sort-type-constituents */
export type ComboProps<T> = ComboPropsCore<T> &
	(T extends string
		? /* eslint-disable-next-line @typescript-eslint/ban-types */
		  {}
		: { getName: (value: T) => string }) &
	(ComboOptions<T> | ComboOptionsRecoil<T>) &
	(ComboSelections<T> | ComboSelectionsRecoil<T>)
export type ComboProps_INTERNAL<T> = ComboPropsCore<T> &
	ComboOptions<T> &
	ComboSelections<T> & { getName: (value: T) => string }
/* eslint-enable @typescript-eslint/sort-type-constituents */

const ComboInternal = <State,>({
	onSetSelections,
	options,
	selections,
	setSelections,
	getName,
	label,
	nullified,
	disabled,
	maxItems = Number.POSITIVE_INFINITY,
	minItems = 0,
	placeholder,
}: ComboProps_INTERNAL<State>): ReactElement => {
	const domId = `${maxItems > 1 ? `multiple-` : ``}choice${useId()}`

	const [entry, setEntry] = useState(``)

	const [selectedIdx, setSelectedIdx] = useState(0)

	const filteredOptions = options?.filter(
		(v) =>
			getName(v).toLowerCase().includes(entry.toLowerCase()) &&
			!selections.includes(v),
	)
	const selected = filteredOptions[selectedIdx]

	const inputRef = useRef<HTMLInputElement>(null)

	const enabled = nullified !== true && disabled !== true

	useEffect(() => {
		if (nullified === true) {
			setEntry(``)
			setSelections([])
		}
	}, [nullified])

	const remove = (v: State) => {
		if (selections.length <= minItems) return
		setSelections((current) => {
			const newSelections = current.filter((v2) => v2 !== v)
			return newSelections
		})
		if (onSetSelections) onSetSelections({ removed: v })
	}
	const add = (v: State) => {
		if (selections.length >= maxItems) return
		setSelections((current) => {
			const newSelections = [...new Set([...current, v])]
			return newSelections
		})
		if (onSetSelections) onSetSelections({ added: v })
		setEntry(``)
		setSelectedIdx(0)
		inputRef.current?.focus()
	}

	const onKeydown: KeyboardEventHandler = (e) => {
		if (e.key === `Enter` && entry) {
			e.preventDefault()
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (selected) add(selected)
		}
		if (e.key === `ArrowDown` && entry) {
			e.preventDefault()
			setSelectedIdx((current) =>
				current + 1 === filteredOptions.length ? 0 : current + 1,
			)
		}
		if (e.key === `ArrowUp` && entry) {
			e.preventDefault()
			setSelectedIdx((current) =>
				current === 0 ? filteredOptions.length - 1 : current - 1,
			)
		}
		if (e.key === `Escape`) {
			e.preventDefault()
			setEntry(``)
			setSelectedIdx(0)
		}
	}

	return (
		<div aria-label="Multiple Choice">
			{typeof label === `string` && <label htmlFor={domId}>{label}</label>}
			<div>
				<span>
					<input
						id={domId}
						ref={inputRef}
						value={entry}
						onChange={(e) => {
							setEntry(e.target.value)
						}}
						onKeyDown={onKeydown}
						disabled={!enabled}
						placeholder={placeholder}
						aria-label="Search"
					/>
					{entry && (
						<ul>
							{filteredOptions?.map((v, idx) => (
								<li key={getName(v)}>
									<button
										type="button"
										aria-label="Choose"
										onClick={() => {
											add(v)
										}}
										className={idx === selectedIdx ? `selected` : undefined}
										disabled={!enabled}
									>
										{getName(v)}
									</button>
								</li>
							))}
						</ul>
					)}
				</span>
				<button
					type="button"
					aria-label="Add"
					onClick={() => {
						entry ? add(selected) : undefined
					}}
					tabIndex={-1}
					disabled={!enabled}
				>
					+
				</button>
			</div>
			<ul>
				{selections.map((v) => (
					<li key={getName(v)}>
						<span>{getName(v)}</span>
						<button
							type="button"
							aria-label="Remove"
							onClick={() => {
								remove(v)
							}}
							tabIndex={0}
						>
							x
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}

export const Combo = <State,>(props: ComboProps<State>): ReactElement => {
	let options: State[] = []
	let selections: State[] = []
	let setSelections: (value: State[]) => void = () => {
		console.warn(`no setSelections`)
	}
	let getName: (value: State) => string = (v) => v as unknown as string
	if (`getName` in props) {
		getName = props.getName
	}
	if (`options` in props) {
		options = props.options
	} else if (`optionsState` in props) {
		options = useRecoilValue(props.optionsState)
	}
	if (`selections` in props) {
		selections = props.selections
		setSelections = props.setSelections
	} else if (`selectionsState` in props) {
		selections = useRecoilValue(props.selectionsState)
		setSelections = useSetRecoilState(props.selectionsState)
	}

	return (
		<ComboInternal
			{...props}
			options={options}
			selections={selections}
			setSelections={setSelections}
			getName={getName}
		/>
	)
}
