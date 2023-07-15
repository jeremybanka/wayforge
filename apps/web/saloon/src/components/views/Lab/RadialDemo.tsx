import * as React from "react"

import { css } from "@emotion/react"

import { Luum } from "~/packages/luum.js/src"

import { useRadial } from "../../../services/radial"

export const RadialDemo: React.FC = () => {
	return (
		<>
			<span
				css={css`
          display: flex;
          flex-flow: row wrap;
        `}
			>
				{Array.from({ length: 12 }).map((_, idx) => {
					const handlers = useRadial(
						Array.from({ length: idx + 1 }).map((_, idx) => ({
							label: `Action ${idx + 1}`,
							do: () => console.log(`Action ${idx + 1}`),
						})),
					)

					return (
						<div
							style={{
								width: 100,
								height: 100,
								background: new Luum({
									hue: idx * 30,
									sat: 190,
									lum: 0.2,
									prefer: `sat`,
								}).toHex(),
							}}
							{...handlers}
						/>
					)
				})}
			</span>
		</>
	)
}
