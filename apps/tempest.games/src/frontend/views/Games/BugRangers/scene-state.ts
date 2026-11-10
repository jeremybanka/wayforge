import { PerspectiveCamera, Raycaster, Vector2 } from "three"

// HEXIOM owns one mounted canvas. Frame tools share its camera and pointer.
export const gameCamera = new PerspectiveCamera(50, 1, 0.1, 1000)
gameCamera.position.set(15, 15, 15)
export const gamePointer = new Vector2()
export const gameRaycaster = new Raycaster()
