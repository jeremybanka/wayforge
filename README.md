```
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓
▓▓▓▓▓               ▓▓▓▓▓
▓▓▓▓▓               ▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          W   A   Y   F   O   R   G   E
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```
# hello!
this is my personal monorepo where i work on typescript projects, including apps and packages

there's especially really cool stuff here. have a read...

- [atom.io](https://github.com/jeremybanka/wayforge/tree/main/packages/atom.io) `npm install atom.io` 
  - state management library that uses the atom model, similar to recoil.js. Very well tested and 
  - includes a convenient react API `import {atom, selector}
- [anvl/join](https://github.com/jeremybanka/wayforge/tree/main/packages/anvl/src/join) `npm install anvl` 
    - `import { Join } from "anvl/join"` imagine in-memory join table—an incredibly useful primitive when managing almost any real data
       ```ts
       const playersInRooms new Join<{ joinedAt: number }>({ relationType: "1:n" })
       // create a new join table for one to many relationships
       ```
        
    - relationships can hold their own data
        ```ts
        playersInRooms.add("player1", "room1", { joinedAt: Date.now() })
        // add a player to a room, with some data
        ```

    - supports serialization with easy conversion to JSON
        ```ts
        const json = playersInRooms.toJSON()
        ```
        
    - check out the [test suite](https://github.com/jeremybanka/wayforge/blob/main/packages/anvl/src/join/index.test.ts) to see how it's used
    - mostly done, but may need an API change since order matters. 
      ```ts
      cardsInDecks.add(cardId, deckId)
      // not the same as
      cardsInDecks.add(deckId, cardId)

      // this SUCKS. need a more explicit API to express which id is which
      ```

      maybe

      ```ts
      const cardsInDecks = new Join({ 
        relationType: "1:n" 
      }).from(`deckId`).to(`cardId`)

      cardsInDecks.add({ deck, card })
      ```
      This should provides check- and run-time type safety that avoids the problems above, at a slight tax to performance.

- [hamr/react-json-editor](https://github.com/jeremybanka/wayforge/tree/main/packages/hamr/src/react-json-editor)
  - a work in progress
  - this component lets you edit JSON in structured form
  - supports JSON schema