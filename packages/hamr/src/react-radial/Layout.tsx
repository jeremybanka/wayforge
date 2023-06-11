import * as React from "react"

import { css } from "@emotion/react"

import { makeMouseHandlers } from "../react-click-handlers"

//

const cssVars = (vars: Record<`--${string}`, string>) =>
  vars as Partial<React.CSSProperties>

//

export type RadialMode = `held` | `idle` | `open`

export type RadialAction = {
  label: string
  do: () => void
}

export type RadialOptions = {
  mouseActivationMethod?: string
  readonly actions: RadialAction[]
  readonly position?: {
    x: number
    y: number
  }
  mode?: RadialMode
  setMode?: (newMode: RadialMode) => void
  size?: number
}

export const Radial: React.FC<RadialOptions> = ({
  actions,
  position = { x: 0, y: 0 },
  mode = `idle`,
  setMode = () => null,
  size = 30,
}) => {
  const isActive = mode !== `idle`

  const activePosition = React.useRef<{
    x: number
    y: number
  } | null>(null)

  const hasPressed = React.useRef<number | null>(null)

  if (isActive && activePosition.current === null) {
    activePosition.current = position
  } else if (!isActive) {
    activePosition.current = null
  }

  const currentPosition = {
    ...position,
    ...(activePosition.current ?? {}),
  }

  const bigCircleRatio = Math.sqrt(Math.max(actions.length, 4) - 2)

  return (
    <div
      style={cssVars({
        [`--action-count`]: `${actions.length}`,
        [`--x`]: currentPosition.x + `px`,
        [`--y`]: currentPosition.y + `px`,
        [`--unit`]: bigCircleRatio * size + `px`,
        [`--element`]: size + `px`,
        [`--is-active`]: isActive ? `all` : `none`,
      })}
      css={css`
        pointer-events: none;
        top: calc((var(--y)) - var(--unit) / 2);
        left: calc((var(--x)) - var(--unit) / 2);
        height: var(--unit);
        width: var(--unit);
        position: fixed;
        /* background: #9992; */
        border-radius: 50%;
        z-index: 20;
        transition: all 100ms ease-in;
        .radial-option {
          pointer-events: var(--is-active);
          user-select: none;
          position: absolute;
          border: 1px solid #fff;
          border-radius: 50%;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 300;
          font-size: 0.8em;
          &:hover {
            background: #fff;
            color: #000;
          }
          &:active,
          &:hover.pressed {
            background: #000;
            color: #fff;
          }
        }
      `}
    >
      {actions.map((opt, idx): React.ReactElement => {
        return (
          <div
            key={idx}
            className={
              `radial-option` + (hasPressed.current === idx ? ` pressed` : ``)
            }
            {...makeMouseHandlers({
              onMouseUpR: () => (
                opt.do(),
                (hasPressed.current = idx),
                setTimeout(
                  () => (setMode(`idle`), (hasPressed.current = null)),
                  250
                )
              ),
              onMouseUpL: opt.do,
            })}
            style={cssVars({
              [`--idx`]: `${idx}`,
            })}
            css={css`
              --opt-ratio: calc(var(--idx) / var(--action-count));
              --opt-angle: calc(90deg + (360deg * var(--opt-ratio)));
              --yy: sin(var(--opt-angle));
              --xx: cos(var(--opt-angle));
              height: var(--element);
              width: var(--element);
              bottom: calc(
                ((var(--unit) / 2) - var(--element) / 2) +
                  (var(--yy) * var(--unit) / 2)
              );
              left: calc(
                ((var(--unit) / 2) - var(--element) / 2) +
                  (var(--xx) * var(--unit) / 2)
              );
            `}
          >
            {idx + 1}
          </div>
        )
      })}
    </div>
  )
}
