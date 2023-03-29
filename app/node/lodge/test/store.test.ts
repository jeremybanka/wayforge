import { pipe } from "fp-ts/function"

import { initGame, useActions, useDispatch } from "../src/store"

it(`adds a player`, () => {
  const game = pipe(initGame(), useActions, useDispatch)
  game.dispatch(`addPlayer`, { options: { id: `player1` } })
  expect(game.store.getState().players[`player1`]).toBeDefined()
})
