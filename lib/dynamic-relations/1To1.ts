export class Index1To1<
  PARENT_ID extends number | string,
  CHILD_ID extends number | string
> {
  public core: Map<PARENT_ID, CHILD_ID>
  public _alt: Map<CHILD_ID, PARENT_ID>

  public getChild(id: PARENT_ID): CHILD_ID | undefined {
    return this.core.get(id)
  }

  public getParent(id: CHILD_ID): PARENT_ID | undefined {
    return this._alt.get(id)
  }

  private _set(parentId: PARENT_ID, childId: CHILD_ID): void {
    this.core.set(parentId, childId)
    this._alt.set(childId, parentId)
  }

  private _delete(parentId: PARENT_ID, childId: CHILD_ID): void {
    this.core.delete(parentId)
    this._alt.delete(childId)
  }

  public set(parentId: PARENT_ID, childId: CHILD_ID, force = true): void {
    const parentChildId = this.core.get(parentId)
    const childParentId = this._alt.get(childId)
    const parentEntry: [PARENT_ID, CHILD_ID] | undefined = parentChildId && [
      parentId,
      parentChildId,
    ]
    const childEntry: [PARENT_ID, CHILD_ID] | undefined = childParentId && [
      childParentId,
      childId,
    ]
    if (!parentEntry && !childEntry) {
      this._set(parentId, childId)
    } else if (force) {
      if (parentEntry) this._delete(parentEntry[0], parentEntry[1])
      if (childEntry) this._delete(childEntry[0], childEntry[1])
      this._set(parentId, childId)
    }
  }

  public constructor(entries: [PARENT_ID, CHILD_ID][] = []) {
    this.core = new Map<PARENT_ID, CHILD_ID>(entries)
    this._alt = new Map<CHILD_ID, PARENT_ID>(entries.map(([p, c]) => [c, p]))
  }

  public toJson(): [PARENT_ID, CHILD_ID][] {
    return Object.entries(Object.fromEntries(this.core.entries())) as [
      PARENT_ID,
      CHILD_ID
    ][]
  }
}
