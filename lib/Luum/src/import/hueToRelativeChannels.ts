import type { Degree, Fraction } from "~"

import { wrapAround } from "../utils"

/*eslint-disable max-len */
/**
 * Gives us the relative values of the channels,
 * irrespective of the white light beneath them.
 * @param {number} hue - in degrees. Gets safely wrapped around first thing.
 *
 * Digital Red      0 ->   0
 *
 * Sunlight         50 ->  50
 *
 * Digital Yellow   60 ->  60
 *
 * Citron           70 ->  70
 *
 * Turquoise        510 -> 150
 *
 * @const {number} hueReduced - hue 0-359.9 is now a floating point 0-5.999.
 *
 * Digital Red    0 ->   0  ~  0.000
 *
 * Sunlight       50 -> 5/6  ~  0.833
 *
 * Digital Yellow 60 ->   1  ~  1.000
 *
 * Citron         70 -> 7/6  ~  1.167
 *
 * Turquoise      150 -> 5/2  ~  2.500
 *
 * @const {number} hueInteger - from 1-6. Tells us what color region we are in.
 *
 * Digital Red    0.000 -> 0
 *                : red-into-yellow region
 *
 * Sunlight       0.833 -> 0
 *                : red-into-yellow region
 *
 * Digital Yellow 1.000 -> 1
 *                : yellow-into-green region
 *
 * Citron         1.167 -> 1
 *                : yellow-into-green region
 *
 * Turquoise      2.500 -> 2
 *                : green-into-cyan region
 *
 * hueInteger is the 'whole number' piece of hueReduced.
 * FYI, the six color regions are bounded by red, yellow, green, cyan, blue, magenta.
 *
 * @const {number} hueDecimal - tells where we are in this region.
 *
 * Digital Red    0.000 -> 0.000
 *                : at the very beginning
 *
 * Sunlight       0.833 -> 0.833
 *                : near the end
 *
 * Digital Yellow 1.000 -> 0.000
 *                : at the very beginning
 *
 * Citron         1.167 -> 0.167
 *                : near the beginning
 *
 * Turquoise      2.500 -> 0.500
 *                : at the halfway point
 *
 * hueDecimal is the 'fraction' piece of hueReduced.
 * we are going to use this number to determine the value of the in-between channel.
 *
 * @const {number} x - used in primary-secondary transitions like Red into Yellow
 * @const {number} y - used in secondary-primary transitions like Yellow into Green
 * To understand the function of x and y, take the difference between
 *
 * Sunlight       (hue 50),
 * Citron         (hue 70),
 * Digital Yellow (hue 60),
 *
 * as an instructive case. These colors are all basically yellow.
 *
 * Sunlight is hue 50, which puts it near the end of the red-into-yellow region.
 *
 * This means its Red channel is full, and its Green channel is almost full.
 * The fullness of its Green channel is directly proportional to its
 * hueDecimal, the distance from the beginning of this region: 0.833
 *
 * Citron is hue 70, which puts it near the beginning of the yellow-into-green region.
 *
 * This means its Red channel is ALMOST FULL, and its Green channel is FULL.
 * So the fullness of its Red channel is INVERSELY proportional to its
 * hueDecimal, the distance from the beginning of this region: 1 - 0.167 = 0.833
 *
 * Digital Yellow is hue 60, which puts it at the very beginning of the yellow-into-green region.
 *
 * This means its Red Channel and its Green channel must both be full.
 * Like Citron, the fullness of Digital Yellow's Red channel is inversely proportional to its
 * hueDecimal, which is 0. Therefore Digital Yellow's Red channel has a fullness of 1.
 *
 * @returns array of values reflecting the spread between channels
 *
 * Digital Red    case 0:  [   R ===== 1       G = x = 0.000   B ===== 0      ]
 *
 * Sunlight       case 0:  [   R ===== 1       G = x = 0.833   B ===== 0      ]
 *
 * DigitalYellow  case 1:  [   R = y = 1.000   G ===== 1       B ===== 0      ]
 *
 * Citron         case 1:  [   R = y = 0.833   G ===== 1       B ===== 0      ]
 *
 * Turquoise      case 2:  [   R ===== 0       G ===== 1       B = x = 0.500  ]
 *
 * here we see detailed breakdowns of the function's final output for our running examples.
 */
/* eslint-enable max-len */
export default (hue: Degree): [r: Fraction, g: Fraction, b: Fraction] => {
  hue = wrapAround(hue, [0, 360])
  const hueReduced = hue / 60
  const hueInteger = Math.floor(hueReduced)
  const hueDecimal = hueReduced - hueInteger
  const x = hueDecimal
  const y = 1 - hueDecimal
  switch (hueInteger) {
    /* eslint-disable prettier/prettier */
    case 0: return [1, x, 0]
    case 1: return [y, 1, 0]
    case 2: return [0, 1, x]
    case 3: return [0, y, 1]
    case 4: return [x, 0, 1]
    case 5: return [1, 0, y]
    default: throw new Error(`invalid hue served: ${hue}`)
    /* eslint-enable prettier/prettier */
  }
}
