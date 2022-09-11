import type { FC } from "react"

import { css } from "@emotion/react"

import type { LuumCssRule } from "~/lib/Luum"
import { luumToCss } from "~/lib/Luum"

import type { Energy } from "../../services/energy"

export const EnergyIcon: FC<{ energy: Energy }> = ({ energy }) => {
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`fill`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`fill`, []],
  }

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)
  const scss = css`
    ${scssA};
    ${scssB};
  `

  // const schemeIsInteractive = isInteractiveScheme(colorScheme)
  // const palette = mixPaletteStatic(colorScheme)
  // const paletteIsInteractive = isInteractivePalette(palette)
  // const dec = paletteToScssDeclaration(palette, 0)
  // console.log({ scssA, scssB })
  return (
    <svg>
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="white"
        css={css`
          ${scssB};
        `}
      />
      <text
        x="24"
        y="63"
        // fill={specToHex(energy.colorA)}
        css={css`
          font-family: "|_'_|";
          font-size: 45px;
          ${scssA};
        `}
      >
        {energy.icon}
      </text>
    </svg>
  )
}
