import { vitest } from "vitest"

import { Join } from "."
import type { JsonObj } from "../json"

// pass in an id get all ids related to that id
// set a relation with 2 ids and some data
// remove a relation with 2 ids

describe(`Join`, () => {
  it(`can be constructed`, () => {
    const j = new Join()
    expect(j).toBeDefined()
  })
})

describe(`Join.prototype.getRelations`, () => {
  it(`gets all ids related to a given id`, () => {
    const heart = `01`
    const heartMayBurn = `225`
    const energyCardFeatures = new Join({
      relationType: `1:n`,
      relations: {
        [heart]: [heartMayBurn],
      },
      contents: {},
    })
    const featureIds = energyCardFeatures.getRelations(heart)
    expect(featureIds).toEqual([heartMayBurn])
  })
})

describe(`Join.prototype.getRelation`, () => {
  it(`warns if there are multiple relations`, () => {
    const warn = vitest.spyOn(global.console, `warn`)
    const heart = `01`
    const heartMayBurn = `225`
    const heartMayBleed = `226`
    const energyCardFeatures = new Join({
      relationType: `1:n`,
      relations: {
        [heart]: [heartMayBurn, heartMayBleed],
      },
      contents: {},
    })
    const featureId = energyCardFeatures.getRelation(heart)
    expect(featureId).toEqual(heartMayBurn)
    expect(warn).toHaveBeenCalledWith(
      `entry with id ${heart} was not expected to have multiple relations`
    )
  })
})

describe(`Join.prototype.set`, () => {
  it(`sets a relation between two ids`, () => {
    const water = `06`
    const waterMayFreeze = `162`
    const energyCardFeatures = new Join()
    const featureIds = energyCardFeatures
      .set(water, waterMayFreeze)
      .getRelations(water)
    expect(featureIds).toEqual([waterMayFreeze])
  })
  it(`sets data between 2 ids`, () => {
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    const reactionReagents = new Join<number>().set(
      fire,
      fireAndWaterBecomeSteam,
      1
    )
    const amountOfFire = reactionReagents.getContent(
      fire,
      fireAndWaterBecomeSteam
    )
    expect(amountOfFire).toEqual(1)
  })
  it(`changes the data but doesn't duplicate the relation`, () => {
    const reactionReagents = new Join<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    const newReagents = reactionReagents
      .set(fire, fireAndWaterBecomeSteam, 1)
      .set(fire, fireAndWaterBecomeSteam, 2)
    const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
    expect(amountOfFire).toEqual(2)
    const featureIds = newReagents.getRelations(fire)
    expect(featureIds).toEqual([fireAndWaterBecomeSteam])
  })
})

describe(`Join.prototype.set1ToMany`, () => {
  it(`sets a relation between a leader and a follower`, () => {
    const yellowGroup = `group_yellow`
    const redGroup = `group_red`
    const joey = `da_man_joey`
    const mary = `mary_paints`
    const memberships = new Join({ relationType: `1:n` })
    const newMemberships = memberships
      .set(yellowGroup, joey)
      .set(yellowGroup, mary)
    expect(newMemberships.getRelations(yellowGroup)).toEqual([joey, mary])
    const newerMemberships = newMemberships.set(redGroup, joey)
    expect(newerMemberships.getRelations(redGroup)).toEqual([joey])
    expect(newerMemberships.getRelations(yellowGroup)).toEqual([mary])
  })
  it(`sets data between a leader and a follower`, () => {
    const reactionReagents = new Join<number>({ relationType: `1:n` })
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    const amountOfFire = reactionReagents
      .set(fire, fireAndWaterBecomeSteam, 1)
      .getContent(fire, fireAndWaterBecomeSteam)
    expect(amountOfFire).toEqual(1)
  })
  it(`changes the data but doesn't duplicate the relation`, () => {
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    const reactionReagents = new Join<number>({ relationType: `1:n` })
    const newReagents = reactionReagents
      .set(fire, fireAndWaterBecomeSteam, 1)
      .set(fire, fireAndWaterBecomeSteam, 2)
    const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
    expect(amountOfFire).toEqual(2)
    const featureIds = newReagents.getRelations(fire)
    expect(featureIds).toEqual([fireAndWaterBecomeSteam])
  })
})

describe(`Join.prototype.set1To1`, () => {
  it(`sets a relation between a wife and a husband`, () => {
    const mary = `mary_paints`
    const joey = `da_man_joey`
    const huey = `hueys_world`
    const marriedCouples = new Join({ relationType: `1:1` }).set(mary, joey)
    expect(marriedCouples.getRelation(mary)).toEqual(joey)
    const newMarriedCouples = marriedCouples.set(mary, huey)
    expect(newMarriedCouples.getRelation(mary)).toEqual(huey)
    expect(newMarriedCouples.getRelation(joey)).toBeUndefined()
  })
})

describe(`Join.prototype.remove`, () => {
  it(`removes a relation between two ids`, () => {
    const water = `06`
    const waterMayFreeze = `162`
    const energyCardFeatures = new Join()
      .set(water, waterMayFreeze)
      .remove(water, waterMayFreeze)
    const featureIds = energyCardFeatures.getRelations(water)
    expect(featureIds).toEqual([])
  })
  it(`removes the content when removing two ids`, () => {
    const snad = `snad_pitt`
    const cassilda = `cassilda_jolie`
    const celebrityCouples = new Join<string>()
      .set(snad, cassilda, `snassilda`)
      .remove(snad, cassilda)
    expect(celebrityCouples.getRelation(snad)).toEqual(undefined)
    expect(celebrityCouples.getRelation(cassilda)).toEqual(undefined)
    expect(celebrityCouples.getContent(snad, cassilda)).toEqual(undefined)
  })
  it(`removes all relations and content for a given id`, () => {
    const pokemonPrimaryTypes = new Join({ relationType: `1:n` })
      .set(`grass`, `bulbasaur`)
      .set(`grass`, `oddish`)
      .set(`grass`, `bellsprout`)
      .remove(`grass`)
    expect(pokemonPrimaryTypes.getRelations(`grass`)).toEqual([])
    expect(pokemonPrimaryTypes.getRelation(`bulbasaur`)).toBeUndefined()
    expect(pokemonPrimaryTypes.getRelation(`oddish`)).toBeUndefined()
    expect(pokemonPrimaryTypes.getRelation(`bellsprout`)).toBeUndefined()
  })
})

describe(`Join.prototype.getRelationContentEntries`, () => {
  it(`gets all content entries for a given id`, () => {
    const friendships = new Join<JsonObj>()
      .set(`omori`, `kel`, { trust: 1 })
      .set(`hero`, `kel`, { brothers: true })
      .set(`hero`, `omori`, { agreeThat: `mari is very nice` })
    const heroFriendships = friendships.getRelationContentEntries(`hero`)
    expect(heroFriendships).toEqual([
      [`kel`, { brothers: true }],
      [`omori`, { agreeThat: `mari is very nice` }],
    ])
  })
})

describe(`Join.prototype.getRelationContentRecord`, () => {
  it(`gets all content for a given id`, () => {
    const friendships = new Join<JsonObj>()
      .set(`omori`, `kel`, { trust: 1 })
      .set(`hero`, `kel`, { brothers: true })
      .set(`hero`, `omori`, { agreeThat: `mari is very nice` })
    const heroFriendships = friendships.getRelationContentRecord(`hero`)
    expect(heroFriendships).toEqual({
      kel: { brothers: true },
      omori: { agreeThat: `mari is very nice` },
    })
  })
})

describe(`Join.prototype.toJSON`, () => {
  it(`converts a Join to JSON`, () => {
    const pokemonPrimaryTypes = new Join({ relationType: `1:n` })
      .set(`grass`, `bulbasaur`)
      .set(`grass`, `oddish`)
      .set(`grass`, `bellsprout`)
    const json = pokemonPrimaryTypes.toJSON()
    expect(json).toEqual({
      relationType: `1:n`,
      contents: {},
      relations: {
        bellsprout: [`grass`],
        bulbasaur: [`grass`],
        grass: [`bulbasaur`, `oddish`, `bellsprout`],
        oddish: [`grass`],
      },
    })
  })
})
