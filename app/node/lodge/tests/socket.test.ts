import io from "socket.io-client"

describe(``, () => {
  const socket = io(`http://selena.local:4000/`)

  // it(``, async () => {
  //   // const spy = jest.fn()

  //   const myPromise = new Promise((resolve, reject) => {
  //     socket.on(`connect`, () => {
  //       console.log(`connected`)
  //       resolve(`foo`)
  //     })
  //   })
  //   expect.assertions(1)
  //   //
  //   socket.disconnect()
  //   await expect(myPromise).resolves.toEqual(`foo`)
  // })

  it(``, done => {
    const spy = jest.fn()
    socket.on(`connect`, () => {
      spy()
      expect(spy).toHaveBeenCalled()
      console.log(`foo`)
      socket.close()
      done()
    })
    // await expect(spy).toHaveBeenCalled()
  })
})
