import type { FC } from "react"
import { useEffect } from "react"

import type { SerializedStyles } from "@emotion/react"
import {
  Link,
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"

import { now } from "~/packages/anvl/src/id/now"
import { ErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"
import type { WC } from "~/packages/hamr/react-ui/json-editor"

import { EnergyEditor } from "./components/energy/EnergyEditor"
import { EnergyHome } from "./components/energy/EnergyHome"
import { Home } from "./components/Home"
import {
  findViewState,
  useAddView,
  useRemoveView,
  viewIndexState,
} from "./services/view"

export const InnerView: FC<{ viewId: string; close: () => void }> = ({
  viewId,
  close,
}) => {
  const location = useLocation()
  const [view, setView] = useRecoilState(findViewState(viewId))
  useEffect(() => {
    // console.log(location)
    setView((view) => ({ ...view, location }))
  }, [location, setView])
  return (
    <>
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
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Home />} />
          <Route path="energy" element={<Outlet />}>
            <Route index element={<EnergyHome />} />
            <Route path=":id" element={<EnergyEditor />} />
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
  const view = useRecoilValue(findViewState(viewId))
  // console.log(view)
  return (
    <ErrorBoundary>
      <MemoryRouter initialEntries={[view.location.pathname]}>
        <InnerView viewId={viewId} close={close} />
      </MemoryRouter>
    </ErrorBoundary>
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
  customCss?: SerializedStyles
  Components?: Partial<SpacesComponents>
}

export const Spaces: FC<SpacesProps> = ({ Components: CustomComponents }) => {
  const [viewIds, setViewIds] = useRecoilState(viewIndexState)
  const addView = useAddView()
  // {
  //   const id = `view-${now()}`
  //   setViewIds((viewIds) => {
  //     const newViewIds = new Set(viewIds)
  //     newViewIds.add(id)
  //     return newViewIds
  //   })
  // }
  const removeView = useRemoveView()

  const Components = { ...DEFAULT_COMPONENTS, ...CustomComponents }
  return (
    <Components.SpacesWrapper>
      {[...viewIds].map((viewId) => (
        <View key={viewId} viewId={viewId} close={() => removeView(viewId)} />
      ))}
      <br />
      <button onClick={() => addView()}>Add Space</button>
    </Components.SpacesWrapper>
  )
}
