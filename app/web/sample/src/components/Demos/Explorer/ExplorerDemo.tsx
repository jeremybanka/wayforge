import type { FC } from "react"

import { Route, Routes, Outlet } from "react-router-dom"

import { Explorer, useSetTitle } from "../../../services"

const Home: FC = () => {
  useSetTitle(`home`)
  return <div>home</div>
}

export const ExplorerDemo: FC = () => {
  return (
    <Explorer>
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </Explorer>
  )
}
