import * as React from "react"

import { Link, Route } from "react-router-dom"

import { RadialDemo } from "./RadialDemo"
export const Lab: React.FC = () => {
  return (
    <div>
      <h2>Lab</h2>
      <nav>
        <Link to="/lab/radial-demo">Radial Demo</Link>
      </nav>
      <Route path="/radial-demo">
        <RadialDemo />
      </Route>
    </div>
  )
}
