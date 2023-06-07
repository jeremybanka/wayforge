import type { FC, ReactElement } from "react"

import { css } from "@emotion/react"

type RadialOptions = {
  mouseActivationMethod?: string
  readonly actions: string[]
  readonly activePosition?: {
    x: number
    y: number
  }
  readonly passivePosition?: {
    x: number
    y: number
  }
  usePosition?: true
}

// function mouseMove(e) {
//   const position = { x: e.clientX, y: e.clientY };

//   if (!this.getState().active) {
//     return this.activate(position);
//   }

//   this.setPosition(position, this.mouseDown);
// }

export const Radial: FC<RadialOptions> = ({
  actions,
  passivePosition = { x: 0, y: 0 },
  // activePosition = { x: 0, y: 0 },
}) => {
  const { PI, sin, cos } = Math
  const actLen = actions.length
  // console.log(activePosition)
  return (
    <div
      css={css`
        pointer-events: none;
        --unit: 120px;
        top: calc(${passivePosition.y}px - var(--unit) / 2);
        left: calc(${passivePosition.x}px - var(--unit) / 2);
        height: var(--unit);
        width: var(--unit);
        position: absolute;
        background: #9992;
        border-radius: 50%;
        z-index: 20;
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
            css={css`
              --element: 30px;
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
              position: absolute;
              background: #9992;
              border-radius: 50%;
              z-index: 10;
            `}
          />
        )
      })}
    </div>
  )
}
