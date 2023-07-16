import { css } from "@emotion/react"
import type { FC } from "react"
import { useTransition } from "react"


import { atom, selector, selectorFamily } from "~/packages/atom.io/src"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { Luum, setHue, setLum, setSat } from "~/packages/luum/src"

import { useIO, useO, useSetTitle } from "../../../services/store"

const colorAtom = atom<Luum>({
	key: `color`,
	default: new Luum({ sat: 80, hue: 100, lum: 0.5 }),
})

const hueSelector = selector<number>({
	key: `hue`,
	get: ({ get }) => get(colorAtom).hue,
	set: ({ set }, hue) => set(colorAtom, (color) => new Luum(setHue(hue)(color))),
})

const lumSelector = selector<number>({
	key: `lum`,
	get: ({ get }) => get(colorAtom).lum,
	set: ({ set }, lum) => set(colorAtom, (color) => new Luum(setLum(lum)(color))),
})

const satSelector = selector<number>({
	key: `sat`,
	get: ({ get }) => get(colorAtom).sat,
	set: ({ set }, sat) => set(colorAtom, (color) => new Luum(setSat(sat)(color))),
})

const findAltHueSelector = selectorFamily<Luum, number>({
	key: `altHue`,
	get: (hue) => ({ get }) => {
		const color = get(colorAtom)
		return new Luum(setHue(hue + color.hue)(color))
	},
})

export const Colors: FC = () => {
	useSetTitle(`Colors`)

	const [hue, setHue] = useIO(hueSelector)
	const [lum, setLum] = useIO(lumSelector)
	const [sat, setSat] = useIO(satSelector)

	const [isPending, startTransition] = useTransition()

	const tints = Array.from({ length: 360 }).map((_, i) =>
		useO(findAltHueSelector(i)),
	)
	return (
		<>
			<ElasticInput
				value={hue}
				onChange={(e) => startTransition(() => setHue(Number(e.target.value)))}
				type="number"
			/>
			<ElasticInput
				value={lum}
				onChange={(e) => setLum(Number(e.target.value))}
				step={0.01}
				type="number"
			/>
			<ElasticInput
				value={sat}
				onChange={(e) => setSat(Number(e.target.value))}
				type="number"
			/>
			<div
				css={css`
          display: flex;
          flex-flow: row wrap;
          > div {
            width: 100px;
            height: 25px;
          }
        `}
			>
				{tints.map((tint) => {
					const hex = tint.toHex()
					return (
						<div
							key={hex}
							css={css`
              background-color: ${hex};
            `}
						>
							{hex}
						</div>
					)
				})}
			</div>
		</>
	)
}
