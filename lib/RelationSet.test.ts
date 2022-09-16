import { RelationSet } from "./RelationSet"

// pass in an id get all ids related to that id
// set a relation with 2 ids and some data
// remove a relation with 2 ids

describe(`RelationSet`, () => {
  it(`can be constructed`, () => {
    const relationSet = new RelationSet()
    expect(relationSet).toBeDefined()
  })
  it(`gets all ids related to a given id`, () => {
    const energyCardFeatures = new RelationSet()
    const heart = `01`
    const heartMayBurn = `225`
    energyCardFeatures.set1ToMany(heart, heartMayBurn)
    const featureIds = energyCardFeatures.relations.get(heart)
    expect([...featureIds]).toEqual([heartMayBurn])
  })
  it(`sets data between 2 ids`, () => {
    const reactionReagents = new RelationSet<number>()
    const fire = `03`
    const fireAndWaterBecomeSteam = `486`
    reactionReagents.set(fire, fireAndWaterBecomeSteam, 1)
    const amountOfFire = reactionReagents.getData(fire, fireAndWaterBecomeSteam)
    expect(amountOfFire).toEqual(1)
  })
  it(`removes a relation between 2 ids`, () => {
    const relationSet = new RelationSet<string>()
    const leaderId = `leaderId`
    const followerId = `followerId`
    relationSet.set(leaderId, followerId, `hi`)
    relationSet.remove(leaderId, followerId)
    const relatedIds = relationSet.relations.get(leaderId)
    expect(relatedIds).toEqual(undefined)
  })
  it(`removes all relations for a given id`, () => {
    const relationSet = new RelationSet<string>()
    const leaderId = `leaderId`
    const followerId = `followerId`
    relationSet.set(leaderId, followerId, `hi`)
    relationSet.remove(leaderId)
    const relatedIds = relationSet.relations.get(leaderId)
    expect(relatedIds).toEqual(undefined)
  })
})
