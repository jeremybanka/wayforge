import type { FC } from "react"

import { css } from "@emotion/react"
import { Link, Route, Routes, Outlet } from "react-router-dom"

import { Explorer, useSetTitle } from "../../../services/store"

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

export const ExplorerDemo: FC = () => {
  return (
    <div
      css={css`
        display: flex;
      `}
    >
      <Explorer>
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<Home />} />
            <Route path="letters" element={<Letters />} />
            <Route path="numbers" element={<Numbers />} />
          </Route>
        </Routes>
      </Explorer>
    </div>
  )
}
