import type { Entries } from "fp-tools/object"
import type { Hamt } from "hamt_plus"
import hamt from "hamt_plus"

import type { Json } from "../json"

export type Add1ToManyRelationOptions<CONTENT> = {
  leaderId: string
  followerId: string
  data: CONTENT
  force?: boolean
}

export class Manage1ToMany<CONTENT extends Json | undefined = undefined> {
  public followersMap: Map<string, Set<string> | undefined>
  public leaderMap: Map<string, string | undefined>
  public data: Map<string, CONTENT>

  public getFollowers(id: string): Set<string> | undefined {
    let followerIds: Set<string> | undefined = undefined
    followerIds = this.followersMap.get(id) || undefined
    return followerIds
  }
  public getLeader(id: string): string | undefined {
    return this.leaderMap.get(id)
  }

  public constructor(entries: Entries<string, string[]> = []) {
    this.followersMap = new Map<string, Set<string> | undefined>(
      entries.map(([leader, followers]) => [leader, new Set(followers)])
    )
    this.leaderMap = new Map<string, string>()
    entries.forEach(([p, c]) => {
      c.forEach((c) => this.leaderMap.set(c, p))
    })
  }

  private _addRelation(
    leaderId: string,
    followerId: string,
    data: CONTENT
  ): void {
    const followerIds = this.getFollowers(leaderId)
    const prevLeaderId = this.leaderMap.get(followerId)
    const hadFollowers = Boolean(followerIds)
    if (hadFollowers) {
      const newFollowerIds = followerIds.add(followerId)
      this.followersMap.set(leaderId, newFollowerIds)
      this.leaderMap.set(followerId, leaderId)
    } else {
      this.followersMap.set(leaderId, new Set([followerId]))
      this.leaderMap.set(followerId, leaderId)
    }
    if (prevLeaderId && prevLeaderId !== leaderId) {
      const previousFollowerIdSet = this.followersMap.get(prevLeaderId)
      if (previousFollowerIdSet) {
        previousFollowerIdSet.delete(followerId)
        const previousLeaderIsEmpty = !previousFollowerIdSet.size
        if (previousLeaderIsEmpty) {
          this.followersMap.delete(prevLeaderId)
        }
      }
    }
  }

  public remove(leaderId?: string, followerId?: string): Manage1ToMany<CONTENT> {
    if (!leaderId && followerId) {
      leaderId = this.leaderMap.get(followerId)
    }
    if (followerId && leaderId) {
      const followerIds = this.followersMap.get(leaderId)
      if (followerIds) {
        followerIds.delete(followerId)
        if (!followerIds.size) this.followersMap.delete(leaderId)
        this.leaderMap.delete(followerId)
      } else {
        console.warn(
          `failed to delete relation between leader "${leaderId}" and child "${followerId}": leader has no child ids`
        )
      }
    } else if (leaderId) {
      this.followersMap.get(leaderId)?.forEach((followerId) => {
        this.leaderMap.delete(followerId)
      })
      this.followersMap.delete(leaderId)
    }
    return this
  }

  public add({
    leaderId,
    followerId,
    data,
    force = true,
  }: Add1ToManyRelationOptions<CONTENT>): Manage1ToMany<CONTENT> {
    const leaderFollowerIds = this.followersMap.get(leaderId)
    const childLeaderId = this.leaderMap.get(followerId)
    const leaderEntry: [string, Set<string>] | undefined = leaderFollowerIds && [
      leaderId,
      leaderFollowerIds,
    ]
    const childEntry: [string, Set<string>] | undefined = childLeaderId && [
      childLeaderId,
      this.followersMap.get(childLeaderId) as Set<string>,
    ]
    if (!leaderEntry && !childEntry) {
      this._addRelation(leaderId, followerId, data)
    } else if (force) {
      if (childEntry) this.remove(childEntry[0], followerId)
      this._addRelation(leaderId, followerId, data)
    }
    return this
  }

  public toJson(): [string, string[]][] {
    return Object.entries(Object.fromEntries(this.followersMap.entries())).map(
      ([leaderId, followerIdSet]) => [leaderId, [...followerIdSet]]
    ) as Entries<string, string[]>
  }
}
