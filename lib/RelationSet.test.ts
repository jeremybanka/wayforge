import { vitest } from "vitest"

import type { JsonObj } from "./json"
import { RelationSet } from "./RelationSet"

// pass in an id get all ids related to that id
// set a relation with 2 ids and some data
// remove a relation with 2 ids

describe(`RelationSet`, () => {
  it(`can be constructed`, () => {
    const relationSet = new RelationSet()
    expect(relationSet).toBeDefined()
  })
})

describe(`RelationSet.prototype.getRelations`, () => {
  it(`gets all ids related to a given id`, () => {
    const heart = `01`
    const heartMayBurn = `225`
    const energyCardFeatures = new RelationSet({
      relations: {
        [heart]: [heartMayBurn],
      },
      contents: {},
    })
    const featureIds = energyCardFeatures.getRelations(heart)
    expect(featureIds).toEqual([heartMayBurn])
  })
})

describe(`RelationSet.prototype.getRelation`, () => {
  it(`warns if there are multiple relations`, () => {
    const warn = vitest.spyOn(global.console, `warn`)
    const heart = `01`
    const heartMayBurn = `225`
    const heartMayBleed = `226`
    const energyCardFeatures = new RelationSet({
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

describe(`RelationSet.prototype.set`, () => {
  it(`sets a relation between two ids`, () => {
    const water = `06`
    const waterMayFreeze = `162`
    const energyCardFeatures = new RelationSet()
    energyCardFeatures.set(water, waterMayFreeze)
    const featureIds = energyCardFeatures.getRelations(water)
    expect(featureIds).toEqual([waterMayFreeze])
  })
  it(`sets data between 2 ids`, () => {
    const reactionReagents = new RelationSet<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    reactionReagents.set(fire, fireAndWaterBecomeSteam, 1)
    const amountOfFire = reactionReagents.getContent(
      fire,
      fireAndWaterBecomeSteam
    )
    expect(amountOfFire).toEqual(1)
  })
  it(`changes the data but doesn't duplicate the relation`, () => {
    const reactionReagents = new RelationSet<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    reactionReagents.set(fire, fireAndWaterBecomeSteam, 1)
    reactionReagents.set(fire, fireAndWaterBecomeSteam, 2)
    const amountOfFire = reactionReagents.getContent(
      fire,
      fireAndWaterBecomeSteam
    )
    expect(amountOfFire).toEqual(2)
    const featureIds = reactionReagents.getRelations(fire)
    expect(featureIds).toEqual([fireAndWaterBecomeSteam])
  })
})

describe(`RelationSet.prototype.set1ToMany`, () => {
  it(`sets a relation between a leader and a follower`, () => {
    const yellowGroup = `group_yellow`
    const redGroup = `group_red`
    const joey = `da_man_joey`
    const mary = `mary_paints`
    const memberships = new RelationSet()
    memberships.set1ToMany(yellowGroup, joey)
    memberships.set1ToMany(yellowGroup, mary)
    expect(memberships.getRelations(yellowGroup)).toEqual([joey, mary])
    memberships.set1ToMany(redGroup, joey)
    expect(memberships.getRelations(redGroup)).toEqual([joey])
    expect(memberships.getRelations(yellowGroup)).toEqual([mary])
  })
  it(`sets data between a leader and a follower`, () => {
    const reactionReagents = new RelationSet<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    reactionReagents.set1ToMany(fire, fireAndWaterBecomeSteam, 1)
    const amountOfFire = reactionReagents.getContent(
      fire,
      fireAndWaterBecomeSteam
    )
    expect(amountOfFire).toEqual(1)
  })
  it(`changes the data but doesn't duplicate the relation`, () => {
    const reactionReagents = new RelationSet<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    reactionReagents.set1ToMany(fire, fireAndWaterBecomeSteam, 1)
    reactionReagents.set1ToMany(fire, fireAndWaterBecomeSteam, 2)
    const amountOfFire = reactionReagents.getContent(
      fire,
      fireAndWaterBecomeSteam
    )
    expect(amountOfFire).toEqual(2)
    const featureIds = reactionReagents.getRelations(fire)
    expect(featureIds).toEqual([fireAndWaterBecomeSteam])
  })
})

describe(`RelationSet.prototype.set1To1`, () => {
  it(`sets a relation between a wife and a husband`, () => {
    const mary = `mary_paints`
    const joey = `da_man_joey`
    const huey = `hueys_world`
    const marriedCouples = new RelationSet()
    marriedCouples.set1To1(mary, joey)
    expect(marriedCouples.getRelation(mary)).toEqual(joey)
    marriedCouples.set1To1(mary, huey)
    expect(marriedCouples.getRelation(mary)).toEqual(huey)
    expect(marriedCouples.getRelation(joey)).toBeUndefined()
  })
})

describe(`RelationSet.prototype.remove`, () => {
  it(`removes a relation between two ids`, () => {
    const water = `06`
    const waterMayFreeze = `162`
    const energyCardFeatures = new RelationSet()
    energyCardFeatures.set(water, waterMayFreeze)
    energyCardFeatures.remove(water, waterMayFreeze)
    const featureIds = energyCardFeatures.getRelations(water)
    expect(featureIds).toEqual([])
  })
  it(`removes the content when removing two ids`, () => {
    const celebrityCouples = new RelationSet<string>()
    const snad = `snad_pitt`
    const cassilda = `cassilda_jolie`
    celebrityCouples.set(snad, cassilda, `snassilda`)
    celebrityCouples.remove(snad, cassilda)
    expect(celebrityCouples.getRelation(snad)).toEqual(undefined)
    expect(celebrityCouples.getRelation(cassilda)).toEqual(undefined)
    expect(celebrityCouples.getContent(snad, cassilda)).toEqual(undefined)
  })
  it(`removes all relations and content for a given id`, () => {
    const pokemonPrimaryTypes = new RelationSet()
    pokemonPrimaryTypes.set1ToMany(`grass`, `bulbasaur`)
    pokemonPrimaryTypes.set1ToMany(`grass`, `oddish`)
    pokemonPrimaryTypes.set1ToMany(`grass`, `bellsprout`)
    pokemonPrimaryTypes.remove(`grass`)
    expect(pokemonPrimaryTypes.getRelations(`grass`)).toEqual([])
    expect(pokemonPrimaryTypes.getRelation(`bulbasaur`)).toBeUndefined()
    expect(pokemonPrimaryTypes.getRelation(`oddish`)).toBeUndefined()
    expect(pokemonPrimaryTypes.getRelation(`bellsprout`)).toBeUndefined()
  })
})

describe(`RelationSet.prototype.getRelationContentEntries`, () => {
  it(`gets all content entries for a given id`, () => {
    const friendships = new RelationSet<JsonObj>()
    friendships.set(`omori`, `kel`, { trust: 1 })
    friendships.set(`hero`, `kel`, { brothers: true })
    friendships.set(`hero`, `omori`, { agreeThat: `mari is very nice` })
    const heroFriendships = friendships.getRelationContentEntries(`hero`)
    expect(heroFriendships).toEqual([
      [`kel`, { brothers: true }],
      [`omori`, { agreeThat: `mari is very nice` }],
    ])
  })
})

describe(`RelationSet.prototype.getRelationContentRecord`, () => {
  it(`gets all content for a given id`, () => {
    const friendships = new RelationSet<JsonObj>()
    friendships.set(`omori`, `kel`, { trust: 1 })
    friendships.set(`hero`, `kel`, { brothers: true })
    friendships.set(`hero`, `omori`, { agreeThat: `mari is very nice` })
    const heroFriendships = friendships.getRelationContentRecord(`hero`)
    expect(heroFriendships).toEqual({
      kel: { brothers: true },
      omori: { agreeThat: `mari is very nice` },
    })
  })
})

describe(`RelationSet.prototype.toJSON`, () => {
  it(`converts a RelationSet to JSON`, () => {
    const pokemonPrimaryTypes = new RelationSet()
    pokemonPrimaryTypes.set1ToMany(`grass`, `bulbasaur`)
    pokemonPrimaryTypes.set1ToMany(`grass`, `oddish`)
    pokemonPrimaryTypes.set1ToMany(`grass`, `bellsprout`)
    const json = pokemonPrimaryTypes.toJSON()
    expect(json).toEqual({
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
