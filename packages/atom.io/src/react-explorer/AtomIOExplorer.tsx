import type { FC, ReactNode } from "react"
import { useEffect } from "react"

import { Link, MemoryRouter, useLocation } from "react-router-dom"

import { fractalMap } from "~/packages/anvl/src/array/fractal-array"
import type { composeStoreHooks } from "~/packages/atom.io/src/react"
import { ErrorBoundary } from "~/packages/hamr/src/react-error-boundary"
import type { WC } from "~/packages/hamr/src/react-json-editor"

import type { ExplorerState } from "./explorer-states"
import { attachExplorerState } from "./explorer-states"
import { setState } from ".."
import { runTransaction } from "../transaction"

export type ExplorerOptions = {
  key: string
  Components?: {
    SpaceWrapper: WC
    NewSpaceButton: FC<{ onClick: () => void }>
    CloseSpaceButton: FC<{ onClick: () => void }>
  }
  storeHooks: ReturnType<typeof composeStoreHooks>
}

const DEFAULT_COMPONENTS: ExplorerOptions[`Components`] = {
  SpaceWrapper: ({ children }) => <div>{children}</div>,
  NewSpaceButton: ({ onClick }) => <button onClick={onClick}>+ Space</button>,
  CloseSpaceButton: ({ onClick }) => <button onClick={onClick}>X</button>,
}

export const composeExplorer = ({
  key,
  Components,
  storeHooks: { useO, useIO },
}: ExplorerOptions): ExplorerState & {
  Explorer: FC<{ children: ReactNode }>
  useSetTitle: (viewId: string) => void
} => {
  const { SpaceWrapper, NewSpaceButton, CloseSpaceButton } = {
    ...DEFAULT_COMPONENTS,
    ...Components,
  }

  const state = attachExplorerState(key)

  const {
    spaceLayoutState,
    findSpaceLayoutNode,
    findViewState,
    viewIndexState,
    allViewsState,
    removeView,
    addView,
    removeSpace,
    addSpace,
    findSpaceViewsState,
  } = state

  const InnerView: FC<{
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

  const View: FC<{
    children: ReactNode
    viewId: string
  }> = ({ children, viewId }) => {
    const view = useO(findViewState(viewId))
    return (
      <ErrorBoundary>
        <MemoryRouter initialEntries={[view.location.pathname]}>
          <InnerView viewId={viewId}>{children}</InnerView>
        </MemoryRouter>
      </ErrorBoundary>
    )
  }

  const Spaces: FC<{ children: ReactNode; nodeKey?: string }> = ({
    children,
    nodeKey = `root`,
  }) => {
    const spaceLayout = useO(findSpaceLayoutNode(nodeKey))
    const viewIds = useO(findSpaceViewsState(nodeKey))
    const focusedViewId = viewIds[0]
    console.log({ spaceLayout, viewIds, focusedViewId })
    return (
      <div className="spaces">
        {spaceLayout.childKeys.length === 0 ? (
          <div className="space">
            {focusedViewId ? (
              <View viewId={focusedViewId}>{children}</View>
            ) : (
              `no view`
            )}
          </div>
        ) : (
          spaceLayout.childKeys.map((childKey) => (
            <Spaces key={childKey} nodeKey={childKey}>
              {children}
            </Spaces>
          ))
        )}
        <NewSpaceButton onClick={() => runTransaction(addSpace)(nodeKey)} />
      </div>
    )
  }

  const Explorer: FC<{ children: ReactNode }> = ({ children }) => {
    const viewIds = useO(viewIndexState)
    const spaceLayout = useO(spaceLayoutState)
    return (
      <>
        {/* {[...viewIds].map((viewId) => (
          <View key={viewId} viewId={viewId}>
            {children}
          </View>
        ))} */}
        <Spaces>{children}</Spaces>
        <NewSpaceButton onClick={runTransaction(addView)} />
      </>
    )
  }

  const useSetTitle = (title: string): void => {
    const location = useLocation()
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
