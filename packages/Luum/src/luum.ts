import type { LuumSpec } from "~/packages/Luum/src"
import { isLuumSpec, specToHex } from "~/packages/Luum/src"

import { shade, tint } from "./mixers/lum"
import { amp, mute } from "./mixers/sat"

export class Luum implements LuumSpec {
  public hue = 359
  public sat = 255
  public lum = 0.5
  public prefer: `lum` | `sat` = `lum`
  public constructor(json: Partial<LuumSpec> = {}) {
    Object.assign(this, { hue: 0, sat: 0, lum: 0, prefer: `lum`, ...json })
  }

  public toJSON(): LuumSpec {
    return {
      hue: this.hue,
      sat: this.sat,
      lum: this.lum,
      prefer: this.prefer,
    }
  }
  public static fromJSON(json: unknown): Luum {
    const isValid = isLuumSpec(json)
    if (isValid) return new Luum(json)
    throw new Error(`Saved JSON for this Luum is invalid: ${json}`)
  }

  public toHex(): string {
    return specToHex(this)
  }

  public get hex(): string {
    return this.toHex()
  }

  public shade(amount: number): Luum {
    return new Luum(shade(this, amount))
  }
  public tint(amount: number): Luum {
    return new Luum(tint(this, amount))
  }

  public amp(amount: number): Luum {
    return new Luum(amp(this, amount))
  }
  public mute(amount: number): Luum {
    return new Luum(mute(this, amount))
  }
}
