export class Perspective {
  // players[playerId].virtualize(trueId)
  public [immerable] = true

  public virtualIds: Record<string, VirtualId>

  public trueIds: Record<string, TrueId>

  public virtualActionLog: IVirtualActionRequest[]

  public constructor() {
    this.virtualIds = {}
    this.trueIds = {}
    this.virtualActionLog = []
  }

  public virtualizeId = <Id extends GameEntityId>(
    id: Id
  ): GameEntityIdSystem[Id[`of`]][`id`][`virtual`] => {
    const virtual = (this.virtualIds[id.str] ||
      new anonClassDict[id.of](
        nanoid()
      )) as GameEntityIdSystem[Id[`of`]][`id`][`virtual`]
    // console.log(id)
    return virtual
  }

  public virtualizeIds = (reals: GameEntityId[]): VirtualId[] =>
    reals.map((target: GameEntityId) => this.virtualizeId(target))

  public virtualizeEntry = (
    real: GameEntityId | GameEntityId[]
  ): VirtualId | VirtualId[] =>
    Array.isArray(real) ? this.virtualizeIds(real) : this.virtualizeId(real)

  public virtualizeTargets = (
    targets?: RealTargets
  ): VirtualTargets | undefined =>
    targets &&
    mapObject<TargetType, TrueId | TrueId[], VirtualId | VirtualId[]>(
      targets,
      this.virtualizeEntry
    )

  public devirtualizeId = (id: VirtualId): TrueId => this.trueIds[id.toString()]

  public devirtualizeIds = (virtuals: VirtualId[] = []): TrueId[] =>
    virtuals.map((target) => this.devirtualizeId(target))

  public devirtualizeEntry = (
    virtual: VirtualId | VirtualId[]
  ): TrueId | TrueId[] =>
    Array.isArray(virtual)
      ? this.devirtualizeIds(virtual)
      : this.devirtualizeId(virtual)

  public devirtualizeTargets = (
    targets?: VirtualTargets
  ): RealTargets | undefined =>
    targets &&
    mapObject<TargetType, VirtualId | VirtualId[], TrueId | TrueId[]>(
      targets,
      this.devirtualizeEntry
    )

  public deriveImperative = (action: IActionRequest): IVirtualImperative => ({
    id: nanoid(),
    options: action.payload.options,
    type: action.type,
    actorId: action.payload.actorId && this.virtualizeId(action.payload.actorId),
    targets: this.virtualizeTargets(action.payload.targets),
  })

  public hide = (trueId: GameEntityId): void => {
    const trueIdString = trueId.toString()
    const virtualIdString = this.virtualizeId(trueId).toString()
    this.trueIds = produce(this.trueIds, (draft) => {
      delete draft[virtualIdString]
    })
    this.virtualIds = produce(this.virtualIds, (draft) => {
      delete draft[trueIdString]
    })
  }

  public show = (trueId: TrueId): void => {
    const virtualId = new virtualIdClassDict[trueId.of]()
    const trueIdString = trueId.toString()
    const virtualIdString = virtualId.toString()
    this.trueIds = { ...this.trueIds, [virtualIdString]: trueId }
    this.virtualIds = { ...this.virtualIds, [trueIdString]: virtualId }
    // console.log(`trueIds`, this.trueIds)
    // console.log(`virtualIds`, this.virtualIds)
    // this.trueIds[virtualIdString] = trueId
    // this.virtualIds[trueIdString] = virtualId
  }
}
