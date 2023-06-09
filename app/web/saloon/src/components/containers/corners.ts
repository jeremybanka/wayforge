import corners, { chamfer } from "corners"

export const SemiChamfered = corners(chamfer, null).size(5)
export const DogEared = corners(null, null, chamfer, null).size(5)
