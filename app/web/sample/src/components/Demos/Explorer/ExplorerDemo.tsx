import type { FC } from "react"

import { Link, Route, Routes, Outlet } from "react-router-dom"

import { Explorer, useSetTitle } from "../../../services"

const Home: FC = () => {
  useSetTitle(`Home`)
  return (
    <div>
      <div>Welcome home! 🤗</div>
      <ul>
        <li>
          <Link to="letters">Letters</Link>
        </li>
        <li>
          <Link to="numbers">Numbers</Link>
        </li>
      </ul>
    </div>
  )
}

const Letters: FC = () => {
  useSetTitle(`Letters`)
  return <h1>a b c</h1>
}

const Numbers: FC = () => {
  useSetTitle(`Numbers`)
  return <h1>1 2 3</h1>
}

export const ExplorerDemo: FC = () => {
  return (
    <Explorer>
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Home />} />
          <Route path="letters" element={<Letters />} />
          <Route path="numbers" element={<Numbers />} />
        </Route>
      </Routes>
    </Explorer>
  )
}
