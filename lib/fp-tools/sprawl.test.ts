import { sprawl } from "./sprawl"

describe(`sprawl`, () => {
  it(`should walk a tree`, () => {
    const tree = {
      a: [1, 2, 3],
      b: {
        c: 4,
        d: 5,
      },
    }
    const paths: string[] = []
    sprawl(tree, (path) => {
      paths.push(path)
    })
    expect(paths).toEqual([
      ``,
      `/a`,
      `/a/0`,
      `/a/1`,
      `/a/2`,
      `/b`,
      `/b/c`,
      `/b/d`,
    ])
  })
})
