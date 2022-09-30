import { vitest } from "vitest"

import { Join } from "."
import type { JsonObj } from "../json"

describe(`Join.prototype.set1ToMany`, () => {
  it(`sets data between a leader and a follower`, () => {
    const reactionReagents = new Join<{ amount: number }>({
      relationType: `1:n`,
    })
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    const fireRelations = reactionReagents
      .setRelations(fire, [{ id: fireAndWaterBecomeSteam, amount: 1 }])
      .getRelations(fire)
    expect(fireRelations).toEqual([{ id: fireAndWaterBecomeSteam, amount: 1 }])
  })
  it(`changes the data but doesn't duplicate the relation`, () => {
    const fire = `03`
    const boil = `486`
    const reactionReagents = new Join<{ amount: number }>({
      relationType: `1:n`,
    })
    const newReagents = reactionReagents
      .setRelations(fire, [{ id: boil, amount: 1 }])
      .setRelations(fire, [{ id: boil, amount: 2 }])
    const amountOfFire = newReagents.getContent(fire, boil)
    expect(amountOfFire).toEqual({ amount: 2 })
    const featureIds = newReagents.getRelatedIds(fire)
    expect(featureIds).toEqual([boil])
  })
  it(`changes the order of relations`, () => {
    const fire = `03`
    const boil = `486`
    const melt = `487`
    const reactionReagents = new Join<{ amount: number }>({
      relationType: `1:n`,
    })
    const newReagents = reactionReagents
      .setRelations(fire, [
        { id: boil, amount: 1 },
        { id: melt, amount: 1 },
      ])
      .setRelations(fire, [
        { id: melt, amount: 1 },
        { id: boil, amount: 1 },
      ])
    const featureIds = newReagents.getRelatedIds(fire)
    expect(featureIds[0]).toEqual(melt)
    expect(featureIds[1]).toEqual(boil)
  })
  it(`cleans up content for removed relations`, () => {
    const fire = `03`
    const boil = `486`
    const melt = `487`
    const reactionReagents = new Join<{ amount: number }>({
      relationType: `1:n`,
    })
    const newReagents = reactionReagents
      .setRelations(fire, [
        { id: boil, amount: 1 },
        { id: melt, amount: 1 },
      ])
      .setRelations(fire, [{ id: boil, amount: 1 }])
    const featureIds = newReagents.getRelatedIds(fire)
    expect(featureIds).toEqual([boil])
    const amountOfFire = newReagents.getContent(fire, melt)
    expect(amountOfFire).toEqual(undefined)
  })
})
