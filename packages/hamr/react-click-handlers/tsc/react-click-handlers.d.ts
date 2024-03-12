import type { MouseEventHandler } from "react";
export type MakeMouseHandlers = (a: Partial<Record<`onClickL` | `onClickM` | `onClickR` | `onMouseDownL` | `onMouseDownM` | `onMouseDownR` | `onMouseUpL` | `onMouseUpM` | `onMouseUpR`, MouseEventHandler>>) => {
    onClick: MouseEventHandler;
    onMouseDown: MouseEventHandler;
    onMouseUp: MouseEventHandler;
    onContextMenu: MouseEventHandler;
};
export declare const makeMouseHandlers: MakeMouseHandlers;
