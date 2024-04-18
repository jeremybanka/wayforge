import { atom, selector, selectorFamily } from "atom.io"
import { useI, useO } from "atom.io/react"
import { Luum, setHue, setLum, setSat } from "luum"
import type { FC } from "react"
import { useTransition } from "react"

import { setCssVars } from "~/packages/hamr/react-css-vars/src"
import { ElasticInput } from "~/packages/hamr/react-elastic-input/src"

import { useSetTitle } from "../../../services/app-store"
import scss from "./Colors.module.scss"

const colorAtom = atom<Luum>({
	key: `color`,
	default: new Luum({ sat: 80, hue: 100, lum: 0.5 }),
})

const hueSelector = selector<number>({
	key: `hue`,
	get: ({ get }) => get(colorAtom).hue,
	set: ({ set }, hue) => {
		set(colorAtom, (color) => new Luum(setHue(hue)(color)))
	},
})

const lumSelector = selector<number>({
	key: `lum`,
	get: ({ get }) => get(colorAtom).lum,
	set: ({ set }, lum) => {
		set(colorAtom, (color) => new Luum(setLum(lum)(color)))
	},
})

const satSelector = selector<number>({
	key: `sat`,
	get: ({ get }) => get(colorAtom).sat,
	set: ({ set }, sat) => {
		set(colorAtom, (color) => new Luum(setSat(sat)(color)))
	},
})

const findAltHueSelector = selectorFamily<Luum, number>({
	key: `altHue`,
	get:
		(hue) =>
		({ get }) => {
			const color = get(colorAtom)
			return new Luum(setHue(hue + color.hue)(color))
		},
})

export const Colors: FC = () => {
	useSetTitle(`Colors`)

	const setH = useI(hueSelector)
	const hue = useO(hueSelector)
	const setL = useI(lumSelector)
	const lum = useO(lumSelector)
	const setS = useI(satSelector)
	const sat = useO(satSelector)

	const [isPending, startTransition] = useTransition()

	const tints = Array.from({ length: 360 }).map((_, i) =>
		useO(findAltHueSelector(i)),
	)
	return (
		<>
			<ElasticInput
				value={hue}
				onChange={(e) => {
					startTransition(() => {
						setH(Number(e.target.value))
					})
				}}
				type="number"
			/>
			<ElasticInput
				value={lum}
				onChange={(e) => {
					setL(Number(e.target.value))
				}}
				step={0.01}
				type="number"
			/>
			<ElasticInput
				value={sat}
				onChange={(e) => {
					setS(Number(e.target.value))
				}}
				type="number"
			/>
			<div className={scss.class}>
				{tints.map((tint) => {
					const hex = tint.toHex()
					return (
						<div key={hex} style={setCssVars({ "--background-color": hex })}>
							{hex}
						</div>
					)
				})}
			</div>
		</>
	)
}
