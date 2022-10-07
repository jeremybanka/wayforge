import { atom } from "recoil"
import { syncEffect } from "recoil-sync"
import { custom, number } from "zod"

class ViewState {
  public active: boolean
  public pos: [number, number]
  public constructor(active: boolean, pos: [number, number]) {
    this.active = active
    this.pos = pos
  }

  // ...
}

const viewStateChecker = custom((x) => (x instanceof ViewState ? x : null))

const viewState = atom<ViewState>({
  key: `ViewState`,
  default: new ViewState(true, [0, 0]),
  effects: [syncEffect({ storeKey: `transit-url`, refine: viewStateChecker })],
})
