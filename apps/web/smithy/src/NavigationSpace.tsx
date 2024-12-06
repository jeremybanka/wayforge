import type { FC } from "react"
import { useEffect } from "react"
import {
	Link,
	MemoryRouter,
	Outlet,
	Route,
	Routes,
	useLocation,
} from "react-router-dom"
import { useO, useI } from "atom.io/react"
import { runTransaction, setState } from "atom.io"
import { ErrorBoundary } from "atom.io/react-devtools"

import type { WC } from "~/packages/hamr/react-json-editor/src"

import { EnergyEditor } from "./components/energy/EnergyEditor"
import { EnergyHome } from "./components/energy/EnergyHome"
import { Home } from "./components/Home"
import { ReactionEditorFromRoute } from "./components/reaction/ReactionEditor"
import { ReactionHome } from "./components/reaction/ReactionHome"
import { addViewTX, viewAtoms, viewIndexState } from "./services/view"
import { RecoverableErrorBoundary } from "./components/RecoverableErrorBoundary"

export const InnerView: FC<{ viewId: string; close: () => void }> = ({
	viewId,
	close,
}) => {
	const location = useLocation()
	const setView = useI(viewAtoms, viewId)
	const view = useO(viewAtoms, viewId)
	useEffect(() => {
		// console.log(location)
		setView((v) => ({ ...v, location }))
	}, [location, setView])
	return (
		<>
			<div>
				{view.title}
				{`: `}
				{location.pathname.split(`/`).map((pathPiece, idx, array) => {
					if (pathPiece === `` && idx === 1) {
						return null
					}
					return (
						<Link
							to={array.slice(0, idx + 1).join(`/`)}
							key={`${pathPiece}_${viewId}`}
						>
							{idx === 0 ? `home` : pathPiece}/
						</Link>
					)
				})}
				<button type="button" onClick={close}>
					close
				</button>
			</div>
			<Routes>
				<Route path="/" element={<Outlet />}>
					<Route index element={<Home />} />
					<Route path="energy" element={<Outlet />}>
						<Route index element={<EnergyHome />} />
						<Route path=":id" element={<EnergyEditor />} />
					</Route>
					<Route path="reaction" element={<Outlet />}>
						<Route index element={<ReactionHome />} />
						<Route path=":id" element={<ReactionEditorFromRoute />} />
					</Route>
				</Route>
			</Routes>
		</>
	)
}

export const View: FC<{ viewId: string; close: () => void }> = ({
	viewId,
	close,
}) => {
	const view = useO(viewAtoms, viewId)
	return (
		<RecoverableErrorBoundary>
			<MemoryRouter initialEntries={[view.location.pathname]}>
				<InnerView viewId={viewId} close={close} />
			</MemoryRouter>
		</RecoverableErrorBoundary>
	)
}

export type SpacesComponents = {
	SpaceWrapper: WC
	SpacesWrapper: WC
}

const DEFAULT_COMPONENTS: SpacesComponents = {
	SpaceWrapper: ({ children }) => <div>{children}</div>,
	SpacesWrapper: ({ children }) => <div>{children}</div>,
}

export type SpacesProps = {
	Components?: Partial<SpacesComponents>
}

export const Spaces: FC<SpacesProps> = ({ Components: CustomComponents }) => {
	const viewIds = useO(viewIndexState)
	const addView = runTransaction(addViewTX)
	// {
	//   const id = `view-${now()}`
	//   setViewIds((viewIds) => {
	//     const newViewIds = new Set(viewIds)
	//     newViewIds.add(id)
	//     return newViewIds
	//   })
	// }

	const Components = { ...DEFAULT_COMPONENTS, ...CustomComponents }
	return (
		<Components.SpacesWrapper>
			{[...viewIds].map((viewId) => (
				<View
					key={viewId}
					viewId={viewId}
					close={() => {
						setState(viewIndexState, (current) => {
							const next = new Set<string>(current)
							next.delete(viewId)
							return next
						})
					}}
				/>
			))}
			<br />
			<button
				type="button"
				onClick={() => {
					addView()
				}}
			>
				Add Space
			</button>
		</Components.SpacesWrapper>
	)
}
