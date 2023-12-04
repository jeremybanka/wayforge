/* eslint-disable @typescript-eslint/ban-types */

type StrictEquals<A, B> = A extends B ? (B extends A ? true : false) : false

// How to extend a type without adding anything to it, so the original extends the extension

type Point3d = { x: number; y: number; z: number }

type Point3dWithNothingElse = Point3d & {}

type ProperNonExtension = StrictEquals<Point3d, Point3dWithNothingElse>

// How to add a member to a union of types optionally
type Point3dWithNoOtherOption = Point3d | never

type ProperNonAddition = StrictEquals<Point3d, Point3dWithNoOtherOption>

// Branding makes types incompatible with each other and the original
type Point3dWithRed = Point3d & { __brand?: `red` }

type Point3dWithBlue = Point3d & { __brand?: `blue` }

type AreSame = StrictEquals<Point3dWithRed, Point3dWithBlue>
