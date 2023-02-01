import type { Degree } from "~/packages/Luum/src"

import { wrapAround } from "../utils"

type NamingPoint = { hue: Degree; name: string }

const rangeNames: NamingPoint[] = [
  { hue: 20, name: `red` },
  { hue: 45, name: `orange` },
  { hue: 61, name: `yellow` },
  { hue: 80, name: `citron` },
  { hue: 100, name: `lime` },
  { hue: 150, name: `green` },
  { hue: 180, name: `teal` },
  { hue: 200, name: `cyan` },
  { hue: 240, name: `blue` },
  { hue: 270, name: `indigo` },
  { hue: 300, name: `violet` },
  { hue: 330, name: `magenta` },
  { hue: 350, name: `pink` },
]

const identifyHue = (hue: Degree): string => {
  // console.log('||| hue', hue)
  const hueWrapped = wrapAround(hue, [0, 360])
  const { name } =
    rangeNames.find(({ hue }) => hueWrapped >= hue) || rangeNames[0]
  /*
      console.log('||| hue', hue,
        'is between', namingPointA.hue,
        'and', namingPointB.hue,
        'therefore it is named', namingPointA.name)
      */
  return name
}

export { identifyHue }
