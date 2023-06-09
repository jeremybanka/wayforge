import type { FC, ReactElement } from "react"

import { css } from "@emotion/react"

import { make } from "~/packages/anvl/src/number/integer-io-ts"

import { makeMouseHandlers } from "../react-click-handlers"

export type RadialAction = {
  label: string
  do: () => void
}

export type RadialOptions = {
  mouseActivationMethod?: string
  readonly actions: RadialAction[]
  readonly activePosition?: {
    x: number
    y: number
  }
  readonly passivePosition?: {
    x: number
    y: number
  }
  usePosition?: true
  isActive?: boolean
}

export const Radial: FC<RadialOptions> = ({
  actions,
  passivePosition = { x: 0, y: 0 },
  isActive = false,
  // activePosition = { x: 0, y: 0 },
}) => {
  const { PI, sin, cos } = Math
  const actLen = actions.length
  // console.log(activePosition)
  return (
    <div
      css={css`
        pointer-events: none;
        --unit: 60px;
        top: calc(${passivePosition.y}px - var(--unit) / 2);
        left: calc(${passivePosition.x}px - var(--unit) / 2);
        height: var(--unit);
        width: var(--unit);
        position: absolute;
        background: #9992;
        border-radius: 50%;
        z-index: 20;
        transition: all 50ms ease-in-out;
        .radial-option {
          --element: 30px;
          pointer-events: all;
          position: absolute;
          background: ${isActive ? `#fff` : `#0000`};
          border: 1px solid #fff;
          border-radius: 50%;
          z-index: 10;
        }
      `}
    >
      {actions.map((opt, idx): ReactElement => {
        const optAngle = (2 * PI * idx) / actLen + 0.5 * PI
        const yy = sin(optAngle)
        const xx = cos(optAngle)
        // console.log((optAngle / (PI * 2)) * 360, xx, yy)
        return (
          <div
            key={idx}
            className="radial-option"
            {...makeMouseHandlers({
              onMouseUpR: () => {
                console.log(`click`, opt)
                opt.do()
              },
            })}
            css={css`
              height: var(--element);
              width: var(--element);
              bottom: calc(
                ((var(--unit) / 2) - var(--element) / 2) +
                  (${yy} * var(--unit) / 2)
              );
              left: calc(
                ((var(--unit) / 2) - var(--element) / 2) +
                  (${xx} * var(--unit) / 2)
              );
            `}
          />
        )
      })}
    </div>
  )
}
