import { atom, selector, snapshot_UNSTABLE } from "recoil"

import { findEnergyState } from "./energy"

describe(`energy`, () => {
  it(`should initialize default`, () => {
    const tree = snapshot_UNSTABLE()
    expect(
      tree.getLoadable(findEnergyState(`0880057843761`)).contents
    ).toStrictEqual({
      colorA: {
        hue: 0,
        lum: 0,
        prefer: `sat`,
        sat: 0,
      },
      colorB: {
        hue: 0,
        lum: 0,
        prefer: `sat`,
        sat: 0,
      },
      icon: ``,
      name: ``,
      id: ``,
    })
  })
})
