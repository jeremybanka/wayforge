export class Index1ToMany<
  PARENT_ID extends number | string,
  CHILD_ID extends number | string
> {
  public core: Map<PARENT_ID, Set<CHILD_ID>>
  public _alt: Map<CHILD_ID, PARENT_ID>

  public getChildren(id: PARENT_ID): Set<CHILD_ID> | undefined {
    return this.core.get(id)
  }
  public getParent(id: CHILD_ID): PARENT_ID | undefined {
    return this._alt.get(id)
  }

  public _set(parentId: PARENT_ID, childId: CHILD_ID): void {
    const childIds = this.core.get(parentId)
    const previousParentId = this._alt.get(childId)
    if (childIds) {
      const newChildIds = childIds.add(childId)
      this.core.set(parentId, newChildIds)
      this._alt.set(childId, parentId)
    } else {
      this.core.set(parentId, new Set([childId]))
      this._alt.set(childId, parentId)
    }
    if (previousParentId && previousParentId !== parentId) {
      const previousChildIdSet = this.core.get(previousParentId)
      if (previousChildIdSet) {
        previousChildIdSet.delete(childId)
        const previousParentIsEmpty = !previousChildIdSet.size
        if (previousParentIsEmpty) {
          this.core.delete(previousParentId)
        }
      }
    }
  }

  public delete(
    parentId?: PARENT_ID,
    childId?: CHILD_ID
  ): Index1ToMany<PARENT_ID, CHILD_ID> {
    if (!parentId && childId) {
      parentId = this._alt.get(childId)
    }
    if (childId && parentId) {
      const childIds = this.core.get(parentId)
      if (childIds) {
        childIds.delete(childId)
        if (!childIds.size) this.core.delete(parentId)
        this._alt.delete(childId)
      } else {
        console.warn(
          `failed to delete relation between parent "${parentId}" and child "${childId}": parent has no child ids`
        )
      }
    } else if (parentId) {
      this.core.get(parentId)?.forEach((childId) => {
        this._alt.delete(childId)
      })
      this.core.delete(parentId)
    }
    return this
  }

  public set(
    parentId: PARENT_ID,
    childId: CHILD_ID,
    { force = true }: { force?: boolean } = {}
  ): Index1ToMany<PARENT_ID, CHILD_ID> {
    const parentChildIds = this.core.get(parentId)
    const childParentId = this._alt.get(childId)
    const parentEntry: [PARENT_ID, Set<CHILD_ID>] | undefined =
      parentChildIds && [parentId, parentChildIds]
    const childEntry: [PARENT_ID, Set<CHILD_ID>] | undefined = childParentId && [
      childParentId,
      this.core.get(childParentId) as Set<CHILD_ID>,
    ]
    if (!parentEntry && !childEntry) {
      this._set(parentId, childId)
    } else if (force) {
      if (childEntry) this.delete(childEntry[0], childId)
      this._set(parentId, childId)
    }
    return this
  }

  public constructor(entries: [PARENT_ID, CHILD_ID[]][] = []) {
    this.core = new Map<PARENT_ID, Set<CHILD_ID>>(
      entries.map(([parent, children]) => [parent, new Set(children)])
    )
    this._alt = new Map<CHILD_ID, PARENT_ID>()
    entries.forEach(([p, c]) => {
      c.forEach((c) => this._alt.set(c, p))
    })
  }

  public toJson(): [PARENT_ID, CHILD_ID[]][] {
    return Object.entries(Object.fromEntries(this.core.entries())).map(
      ([parentId, childIdSet]) => [parentId, [...childIdSet]]
    ) as [PARENT_ID, CHILD_ID[]][]
  }
}
