import { isString } from "fp-ts/lib/string"

import { ifDefined } from "~/packages/Anvil/src/nullish"

// generic type that extracts the type of a function's parameters
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never

export const DECLARE = Symbol(`DECLARE`)
export const IS = Symbol(`IS`)
export const EXPORT = Symbol(`EXPORT`)
export const NAME = Symbol(`NAME`)
export const TYPE = Symbol(`TYPE`)
export const VALUE = Symbol(`VALUE`)
export const PARAMS = Symbol(`PARAMS`)
export const RETURN_TYPE = Symbol(`RETURN_TYPE`)

export const DECLARABLE_THINGS = [
  `class`,
  `interface`,
  `type`,
  `enum`,
  `function`,
  `const`,
  `let`,
  `var`,
  `namespace`,
  `module`,
  `import`,
] as const
export type Declarable = typeof DECLARABLE_THINGS[number]
export const VARIABLE_DECLARATOR = [`const`, `let`, `var`] as const
export type VariableDeclarator = typeof VARIABLE_DECLARATOR[number]

export interface Declaration extends Statement {
  [IS]: `declaration`
  [DECLARE]: Declarable
}
export const isDeclaration = (thing: unknown): thing is Declaration =>
  isStatement(thing) &&
  thing[IS] === `declaration` &&
  DECLARABLE_THINGS.includes((thing as Declaration)[DECLARE])

export interface GlobalDeclaration extends Declaration {
  [EXPORT]: boolean
}

export type Parameter = {
  [NAME]: string
  [TYPE]?: string
}

export interface VariableDeclaration extends Declaration {
  [DECLARE]: VariableDeclarator
  [NAME]: string
  [VALUE]: string // Expression
  [TYPE]?: string | undefined
}
export const isVariableDeclaration = (
  thing: unknown
): thing is VariableDeclaration =>
  isDeclaration(thing) &&
  thing[DECLARE] === `const` &&
  isString((thing as VariableDeclaration)[NAME]) &&
  isString((thing as VariableDeclaration)[VALUE]) &&
  ifDefined(isString)((thing as VariableDeclaration)[TYPE])

export interface GlobalVariableDeclaration
  extends GlobalDeclaration,
    VariableDeclaration {
  [DECLARE]: VariableDeclarator
}

export const STATEABLE_THINGS = [
  `continue`,
  `break`,
  `return`,
  `throw`,
  `declaration`,
  `conditional`,
] as const
export type Stateable = typeof STATEABLE_THINGS[number]
export type Statement = { [IS]: Stateable }
export const isStatement = (thing: unknown): thing is Statement =>
  typeof thing === `object` &&
  thing !== null &&
  STATEABLE_THINGS.includes((thing as Statement)[IS])

export interface ReturnStatement extends Statement {
  [IS]: `return`
  [VALUE]: Expression
}
export interface ThrowStatement extends Statement {
  [IS]: `throw`
  [VALUE]: Expression
}

export interface FunctionDeclaration<Params extends Parameter[], Return>
  extends Declaration {
  [DECLARE]: `function`
  [VALUE]: FunctionDefinition<Params, Return>
}

// export type FunctionCall<FunctionDef extends FunctionDeclaration> = {
//   [NAME]: FunctionDef[NAME]
//   [PARAM]: Parameters<FunctionDef[PARAMS]>
// }

export type FunctionDefinition<Params extends Parameter[], Return> = {
  [NAME]: string
  [PARAMS]: Params
  [RETURN_TYPE]?: Return
}
export type Expression = FunctionDefinition<any, any>

export class TypescriptInstructions<
  VariableNames extends string,
  Variables extends Record<VariableNames, unknown>
> {
  public contents: (Declaration | Statement)[]
  public constructor() {
    this.contents = []
  }
  public declare<Type, Name extends string>(
    thing: Declarable
  ): {
    named: (name: Name) => {
      toBe: (
        value: string
      ) => TypescriptInstructions<
        Name | VariableNames,
        Record<Name, Type> & Variables
      >
    }
  } {
    return {
      named: (name) => ({
        toBe: (value) => {
          const declaration: VariableDeclaration = {
            [IS]: `declaration`,
            [DECLARE]: `const`,
            [NAME]: name,
            [VALUE]: value,
            [TYPE]: undefined,
          }
          this.contents.push(declaration)
          return this
        },
      }),
    }
  }
  public writeStatement(statement: Statement): string {
    // console.log(isStatement(statement), statement[IS])
    // console.log(isDeclaration(statement), statement[DECLARE])
    // console.log(isVariableDeclaration(statement), statement[NAME])
    return isVariableDeclaration(statement)
      ? `const ${statement[NAME]} = ${statement[VALUE]}`
      : `// unknown statement type: ${statement[IS]}`
  }

  public write(): string {
    return this.contents.map((c) => this.writeStatement(c)).join(`\n`)
  }
}

const myInstructions = new TypescriptInstructions()
  .declare(`class`)
  .named(`MyClass`)
  .toBe(``)
