import * as React from "react"

import { Link, Outlet } from "react-router-dom"

export const Lab: React.FC = () => {
	return (
		<div>
			<h2>Lab</h2>
			<nav>
				<Link to="/lab/radial-demo">Radial Demo</Link>
			</nav>
			<Outlet />
		</div>
	)
}
