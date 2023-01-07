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
    const nodes: unknown[] = []
    sprawl(tree, (path, node) => {
      paths.push(path.join(`/`))
      nodes.push(node)
    })
    expect(paths).toEqual([``, `a`, `a/0`, `a/1`, `a/2`, `b`, `b/c`, `b/d`])
    expect(nodes).toEqual([tree, tree.a, 1, 2, 3, tree.b, 4, 5])
  })
})
