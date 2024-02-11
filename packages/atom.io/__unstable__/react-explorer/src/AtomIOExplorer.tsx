import { runTransaction, setState } from "atom.io"
import type { FC, ReactNode } from "react"
import { useEffect } from "react"
import { Link, MemoryRouter, useLocation } from "react-router-dom"

import { RecoverableErrorBoundary } from "~/packages/hamr/react-error-boundary"
import type { WC } from "~/packages/hamr/react-json-editor"

import { useI, useO } from "../../../react/src"
import { attachExplorerState } from "./explorer-states"

export type ExplorerOptions = {
	key: string
	Components?: {
		SpaceWrapper: WC
		CloseSpaceButton: FC<{ onClick: () => void }>
	}
}

const DEFAULT_COMPONENTS: ExplorerOptions[`Components`] = {
	SpaceWrapper: ({ children }) => <div>{children}</div>,
	CloseSpaceButton: ({ onClick }) => (
		<button type="button" onClick={onClick}>
			X
		</button>
	),
}

export const composeExplorer = ({
	key,
	Components,
}: ExplorerOptions): ReturnType<typeof attachExplorerState> & {
	Explorer: FC<{ children: ReactNode }>
	useSetTitle: (viewId: string) => void
} => {
	const { SpaceWrapper, CloseSpaceButton } = {
		...DEFAULT_COMPONENTS,
		...Components,
	}

	const state = attachExplorerState(key)

	const {
		addSpace,
		addView,
		allViewsState,
		findSpaceFocusedViewState,
		findSpaceLayoutNode,
		findSpaceViewsState,
		findViewFocusedState,
		findViewState,
		removeSpace,
		removeView,
		spaceLayoutState,
		viewIndexState,
	} = state

	const View: FC<{
		children: ReactNode
		viewId: string
	}> = ({ children, viewId }) => {
		const location = useLocation()
		const viewState = findViewState(viewId)
		const view = useO(viewState)
		const setView = useI(viewState)
		useEffect(() => {
			setView((view) => ({ ...view, location }))
		}, [location.key])
		return (
			<div className="view">
				<header>
					<h1>{view.title}</h1>
					<CloseSpaceButton onClick={() => runTransaction(removeView)(viewId)} />
				</header>
				<main>{children}</main>
				<footer>
					<nav>
						{location.pathname.split(`/`).map((pathPiece, idx, array) =>
							pathPiece === `` && idx === 1 ? null : (
								<Link
									to={array.slice(0, idx + 1).join(`/`)}
									key={`${pathPiece}_${viewId}`}
								>
									{idx === 0 ? `home` : pathPiece}/
								</Link>
							),
						)}
					</nav>
				</footer>
			</div>
		)
	}

	const Tab: FC<{ viewId: string; spaceId: string }> = ({ viewId, spaceId }) => {
		const view = useO(findViewState(viewId))
		const spaceFocusedView = useO(findSpaceFocusedViewState(spaceId))
		const setSpaceFocusedView = useI(findSpaceFocusedViewState(spaceId))
		const handleClick = () => setSpaceFocusedView(viewId)
		return (
			<div
				className={`tab ${spaceFocusedView === viewId ? `focused` : ``}`}
				onClick={handleClick}
				onKeyUp={handleClick}
			>
				{view.title}
			</div>
		)
	}

	const TabBar: FC<{
		spaceId: string
		viewIds: string[]
	}> = ({ spaceId, viewIds }) => {
		return (
			<nav className="tab-bar">
				{viewIds.map((viewId) => (
					<Tab key={viewId} viewId={viewId} spaceId={spaceId} />
				))}
			</nav>
		)
	}

	const Space: FC<{
		children: ReactNode
		focusedViewId: string
		spaceId: string
		viewIds: string[]
	}> = ({ children, focusedViewId, spaceId, viewIds }) => {
		const view = useO(findViewState(focusedViewId))
		return (
			<div className="space">
				<RecoverableErrorBoundary>
					<MemoryRouter
						initialEntries={view.location ? [view.location.pathname] : []}
					>
						<TabBar spaceId={spaceId} viewIds={viewIds} />
						<View viewId={focusedViewId}>{children}</View>
					</MemoryRouter>
				</RecoverableErrorBoundary>
			</div>
		)
	}

	const Spaces: FC<{ children: ReactNode; spaceId?: string }> = ({
		children,
		spaceId = `root`,
	}) => {
		const spaceLayout = useO(findSpaceLayoutNode(spaceId))
		const viewIds = useO(findSpaceViewsState(spaceId))
		const focusedViewId = useO(findSpaceFocusedViewState(spaceId))
		return (
			<div className="spaces">
				{spaceLayout.childSpaceIds.length === 0 ? (
					focusedViewId ? (
						<Space
							focusedViewId={focusedViewId}
							spaceId={spaceId}
							viewIds={viewIds}
						>
							{children}
						</Space>
					) : (
						`no view`
					)
				) : (
					spaceLayout.childSpaceIds.map((childSpaceId) => (
						<Spaces key={childSpaceId} spaceId={childSpaceId}>
							{children}
						</Spaces>
					))
				)}
				<button
					type="button"
					onClick={() => runTransaction(addView)({ spaceId })}
				>
					+ View
				</button>
				<button
					type="button"
					onClick={() => runTransaction(addSpace)({ parentId: spaceId })}
				>
					+ Space
				</button>
			</div>
		)
	}

	const Explorer: FC<{ children: ReactNode }> = ({ children }) => {
		return <Spaces>{children}</Spaces>
	}

	const useSetTitle = (title: string): void => {
		let location: ReturnType<typeof useLocation>
		try {
			location = useLocation()
		} catch (thrown) {
			console.warn(
				`Failed to set title to "${title}"; useSetTitle must be called within the children of Explorer`,
			)
			return
		}
		const views = useO(allViewsState)
		const locationView = views.find(
			([, view]) => view.location.key === location.key,
		)
		const viewId = locationView?.[0] ?? null
		useEffect(() => {
			if (viewId) {
				setState(findViewState(viewId), (v) => ({ ...v, title }))
			}
		}, [viewId])
	}

	return { Explorer, useSetTitle, ...state }
}
