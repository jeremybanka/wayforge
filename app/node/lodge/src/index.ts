import socketAuth from 'socketio-auth'
import {
  IVirtualActionRequest,
  IVirtualImperative,
} from './core/actions/types'
import { io } from "./server"
import createGame from "./store/game"
import useHeartsActions, { installHeartsActions } from './plugin/hearts'

const game = createGame()
installHeartsActions(game)
console.log(useHeartsActions(game))
const g = () => game.getState()

io.on(`connection`, socket => {
  console.log(`connect: ${socket.id}`)

  game.subscribe(
    (state:IVirtualImperative[]) =>
      socket.emit(`message`, state),
    state =>
      state.playersById[state.playerIdsBySocketId[socket.id]]?.imperativeLog,
    (prev, next) => {
      console.log(`prev`, prev?.length)
      console.log(`next`, next?.length)
      const isEqual = prev?.length === next?.length
      // console.log(`isEqual?`, isEqual)
      return isEqual
    }

  )

  socket.on(`hello!`, data => {
    console.log(data)
  })

  socket.on(`actionRequest`, (virtualActionRequest:IVirtualActionRequest) => {
    const player = g().getSocketOwner(socket.id)
    const actionRequest = player.devirtualizeRequest(virtualActionRequest)
    console.log(`request`, actionRequest)
    g().dispatch(actionRequest)
  })

  socket.on(`disconnect`, () => {
    console.log(`core disconnect: ${socket.id}`)
  })
})

async function verifyUser(token) {
  return new Promise((resolve, reject) => {
    // setTimeout to mock a cache or database call
    setTimeout(() => {
      try {
        // this information should come from your cache or database
        const users = [
          {
            id: 1,
            name: `jeremy`,
            token: `banka`,
          },
        ]
        const user = users.find(user => user.token === token)
        if (!user) throw new Error(`User not Found.`)
        return resolve(user)
      } catch (error) { return reject(error) }
    }, 200)
  })
}

/* eslint-disable max-len */
// https:// medium.com/hackernoon/enforcing-a-single-web-socket-connection-per-user-with-node-js-socket-io-and-redis-65f9eb57f66a
/* eslint-enable max-len */
socketAuth(io, {
  authenticate: async (socket, data, callback) => {
    console.log(data)
    const { token } = data

    try {
      const user = await verifyUser(token)

      socket.user = user

      return callback(null, true)
    } catch (e) {
      console.log(e)
      console.log(`Socket ${socket.id} unauthorized.`)
      return callback({ message: `UNAUTHORIZED` })
    }
  },
  postAuthenticate: socket => {
    console.log(`Socket ${socket.id} authenticated as ${socket.user.name}.`)
    g().dispatch({
      type: `CREATE_PLAYER`,
      payload: { options: { userId: socket.user.id, socketId: socket.id } },
    })
    socket.playerId = g().playerIdsBySocketId[socket.id]

    console.log(`idConfirmed`)

    // game.playersBySocketId.forEach(logIdMap)
  },
  disconnect: socket => {
    console.log(`auth disconnect: ${socket.id}.`)
  },
})
