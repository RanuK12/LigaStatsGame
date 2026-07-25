import { describe, it, expect } from "vitest"
import { challengeForDate, challengeNumber, msUntilNextDay, CHALLENGES } from "@/lib/daily-challenge"

describe("daily-challenge", () => {
  it("is deterministic for a given date", () => {
    expect(challengeForDate("2026-07-25").id).toBe(challengeForDate("2026-07-25").id)
  })

  it("rotates across days (not always the same)", () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, i) => challengeForDate(`2026-08-${String(i + 1).padStart(2, "0")}`).id),
    )
    expect(ids.size).toBeGreaterThan(1)
  })

  it("always returns a challenge from the pool", () => {
    const pool = new Set(CHALLENGES.map((c) => c.id))
    for (let i = 1; i <= 60; i++) {
      const ymd = `2026-09-${String((i % 30) + 1).padStart(2, "0")}`
      expect(pool.has(challengeForDate(ymd).id)).toBe(true)
    }
  })

  it("countdown is within a day", () => {
    const ms = msUntilNextDay(new Date(2026, 6, 25, 23, 0, 0))
    expect(ms).toBeGreaterThan(0)
    expect(ms).toBeLessThanOrEqual(86400000)
  })

  it("challenge number increases day over day", () => {
    expect(challengeNumber(new Date(2026, 0, 2))).toBe(challengeNumber(new Date(2026, 0, 1)) + 1)
  })
})
