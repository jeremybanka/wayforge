import type { FC } from "react"

import { css } from "@emotion/react"
import { Link, Route, Routes, Outlet } from "react-router-dom"

import type { FractalArray } from "~/packages/anvl/src/array/fractal-array"

import { Explorer, useSetTitle } from "../../../services/store"
import { Colors } from "../Colors"
import { Division } from "../Division"

const Home: FC = () => {
  useSetTitle(`Home`)
  return (
    <article className="home">
      <div>Welcome home! 🤗</div>
      <ul>
        <li>
          <Link to="letters">Letters</Link>
        </li>
        <li>
          <Link to="numbers">Numbers</Link>
        </li>
        <li>
          <Link to="fractal">Fractal</Link>
        </li>
        <li>
          <Link to="division">Division</Link>
        </li>
        <li>
          <Link to="colors">Colors</Link>
        </li>
      </ul>
    </article>
  )
}

const Letters: FC = () => {
  useSetTitle(`Letters`)
  return (
    <article className="letters">
      <h1>a b c</h1>
    </article>
  )
}

const Numbers: FC = () => {
  useSetTitle(`Numbers`)
  return (
    <article className="numbers">
      <h1>1 2 3</h1>
    </article>
  )
}

const FRACTAL_ITEMS = [[1], 2, 3, [4, 5, 6, [7, 8, 9, [10]]]]
const Fractal: FC<{ items: FractalArray<number>; indices?: number[] }> = ({
  items,
  indices = [],
}) => {
  const flexDirection = indices.length % 2 === 0 ? `row` : `column`
  const backgroundColor = indices.length % 2 === 0 ? `red` : `cyan`
  return (
    <div
      style={{
        display: `flex`,
        flexDirection,
        backgroundColor,
      }}
    >
      {items.map((item, idx) => {
        if (typeof item === `number`) {
          return (
            <div key={idx} style={{ border: `1px solid black`, flexGrow: item }}>
              {item}
            </div>
          )
        }
        return <Fractal key={idx} items={item} indices={[...indices, idx]} />
      })}
    </div>
  )
}

export const DemoExplorer: FC = () => {
  return (
    <div
      css={css`
        display: flex;
        .spaces {
          border: 1px solid black;
          .space {
            border: 1px solid black;
          }
        }
        .view {
          border: 1px solid black;
        }
      `}
    >
      <Explorer>
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<Home />} />
            <Route path="letters" element={<Letters />} />
            <Route path="numbers" element={<Numbers />} />
            <Route path="fractal" element={<Fractal items={FRACTAL_ITEMS} />} />
            <Route path="division" element={<Division />} />
            <Route path="colors" element={<Colors />} />
          </Route>
        </Routes>
      </Explorer>
    </div>
  )
}
