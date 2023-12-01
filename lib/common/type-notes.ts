/* eslint-disable @typescript-eslint/ban-types */
// How to extend a type without adding anything to it, so the original extends the extension

type Point3d = { x: number; y: number; z: number }

type Point3dWithNothingElse = Point3d & {}

type StrictEquals<A, B> = A extends B ? (B extends A ? true : false) : false

type ProperNonExtension = StrictEquals<Point3d, Point3dWithNothingElse>
