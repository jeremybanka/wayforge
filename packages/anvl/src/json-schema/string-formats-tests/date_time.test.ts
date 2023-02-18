import { isDateTime } from "../string-formats"

describe(`date_time string format`, () => {
  // it(`matches examples`, () => {
  //   const variedDateTimes = [
  //     `2021-01-01T00:00:00Z`,
  //     `2021-01-01T00:00:00.000Z`,
  //     `2021-01-01T00:00:00.000+00:00`,
  //     `2021-01-01T00:00:00.000-00:00`,
  //     `2021-01-01T00:00:00.000+00:00`,
  //   ]
  //   const result = isDateTime(`2021-01-01T00:00:00.000+00:00`)
  //   expect(result).toBe(true)
  // })
  it(`won't match impossible dates`, () => {
    const result = isDateTime(`2021-02-29T00:00:00Z`)
    expect(result).toBe(false)
  })
  it(`won't match incomplete dates`, () => {
    const result = isDateTime(`2021-02`)
    expect(result).toBe(false)
  })
})
