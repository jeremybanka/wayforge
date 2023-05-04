import type { FC, ReactNode } from "react"
import { useEffect } from "react"

import { Link, MemoryRouter, useLocation } from "react-router-dom"

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
  }
  storeHooks: ReturnType<typeof composeStoreHooks>
}

const DEFAULT_COMPONENTS: ExplorerOptions[`Components`] = {
  SpaceWrapper: ({ children }) => <div>{children}</div>,
}

export const composeExplorer = (
  options: ExplorerOptions
): ExplorerState & {
  Explorer: FC<{ children: ReactNode }>
  useSetTitle: (viewId: string) => void
} => {
  const Components = { ...DEFAULT_COMPONENTS, ...options.Components }

  const state = attachExplorerState(options.key)

  const { findViewState, viewIndexState, allViewsState, removeView, addView } =
    state

  const InnerView: FC<{
    children: ReactNode
    viewId: string
    close: () => void
  }> = ({ children, viewId, close }) => {
    const location = useLocation()
    const viewState = findViewState(viewId)
    // console.warn({ viewId, viewState })
    const [view, setView] = options.storeHooks.useIO(viewState)
    useEffect(() => {
      setView((view) => ({ ...view, location }))
    }, [location.key])
    return (
      <div className="view">
        <div>
          {view.title}
          {`: `}
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
          <button onClick={close}>close</button>
        </div>
        {children}
      </div>
    )
  }

  const View: FC<{
    children: ReactNode
    viewId: string
    close: () => void
  }> = ({ children, viewId, close }) => {
    const view = options.storeHooks.useO(findViewState(viewId))
    return (
      <ErrorBoundary>
        <MemoryRouter initialEntries={[view.location.pathname]}>
          <InnerView viewId={viewId} close={close}>
            {children}
          </InnerView>
        </MemoryRouter>
      </ErrorBoundary>
    )
  }

  const Explorer: FC<{ children: ReactNode }> = ({ children }) => {
    const viewIds = options.storeHooks.useO(viewIndexState)

    return (
      <>
        {[...viewIds].map((viewId) => (
          <View
            key={viewId}
            viewId={viewId}
            close={() => runTransaction(removeView)(viewId)}
          >
            {children}
          </View>
        ))}
        <br />
        <button onClick={() => runTransaction(addView)()}>Add Space</button>
      </>
    )
  }

  const useSetTitle = (title: string): void => {
    const location = useLocation()
    const views = options.storeHooks.useO(allViewsState)
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
