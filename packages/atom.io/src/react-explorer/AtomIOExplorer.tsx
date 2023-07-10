import type { FC, ReactNode } from "react"
import { useEffect } from "react"

import type { StoreHooks } from "atom.io/react"
import { Link, MemoryRouter, useLocation } from "react-router-dom"

import { ErrorBoundary } from "~/packages/hamr/src/react-error-boundary"
import type { WC } from "~/packages/hamr/src/react-json-editor"

import { attachExplorerState } from "./explorer-states"
import { setState } from ".."
import { runTransaction } from "../transaction"

export type ExplorerOptions = {
  key: string
  Components?: {
    SpaceWrapper: WC
    CloseSpaceButton: FC<{ onClick: () => void }>
  }
  storeHooks: StoreHooks
}

const DEFAULT_COMPONENTS: ExplorerOptions[`Components`] = {
  SpaceWrapper: ({ children }) => <div>{children}</div>,
  CloseSpaceButton: ({ onClick }) => <button onClick={onClick}>X</button>,
}

export const composeExplorer = ({
  key,
  Components,
  storeHooks: { useO, useIO },
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
    const [view, setView] = useIO(viewState)
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
              )
            )}
          </nav>
        </footer>
      </div>
    )
  }

  const Tab: FC<{ viewId: string; spaceId: string }> = ({ viewId, spaceId }) => {
    const view = useO(findViewState(viewId))
    const [spaceFocusedView, setSpaceFocusedView] = useIO(
      findSpaceFocusedViewState(spaceId)
    )
    return (
      <div
        className={`tab ${spaceFocusedView === viewId ? `focused` : ``}`}
        onClick={() => setSpaceFocusedView(viewId)}
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
        <ErrorBoundary>
          <MemoryRouter
            initialEntries={view.location ? [view.location.pathname] : []}
          >
            <TabBar spaceId={spaceId} viewIds={viewIds} />
            <View viewId={focusedViewId}>{children}</View>
          </MemoryRouter>
        </ErrorBoundary>
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
    console.log({ spaceLayout, viewIds, focusedViewId })
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
        <button onClick={() => runTransaction(addView)({ spaceId })}>
          + View
        </button>
        <button onClick={() => runTransaction(addSpace)({ parentId: spaceId })}>
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
        `Failed to set title to "${title}"; useSetTitle must be called within the children of Explorer`
      )
      return
    }
    const views = useO(allViewsState)
    const locationView = views.find(
      ([, view]) => view.location.key === location.key
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
