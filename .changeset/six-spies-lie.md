---
"atom.io": minor
---

💥 BREAKING CHANGE: `atom.io/data` `join` has changed its API significantly.
  
  ### Creating a join is still the same.
  ```ts
    import { join } from "atom.io/data"

   const followersOfInfluencers = join({
    key: `followersOfInfluencers`,
    between: [`influencer`, `followers`],
    cardinality: `n:n`,
  })
  ```
  ⚠️ **However**, the type that it returns is now a fully serializable `JoinToken`, not a `Join`.

  ### Getting relations has changed.

  Before:
  ```ts
  import { findState } from "atom.io" 
 
  const influencersIFollowToken = findState(
    followersOfInfluencers.states.influencerKeysOfFollower, 
    myUsername
  )
  ```

  After:
  ```ts
  import { findRelations } from "atom.io/data"

  const influencersIFollowToken = findRelations(
    followersOfInfluencers,
    myUsername,
  ).influencerKeysOfFollower
  ```

  ### Setting relations has changed.

  Before:
  ```ts
  followersOfInfluencers.set(
    { influencer: myUsername, follower: anotherUsername },
  )
  ```

  After:
  ```ts
  import { editRelations } from "atom.io/data"

  editRelations(
    followersOfInfluencers,
    (relations) => {relations.set({ influencer: myUsername, follower: anotherUsername }),}
  )
  ```