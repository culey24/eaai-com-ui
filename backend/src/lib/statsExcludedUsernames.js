/**
 * Username loại khỏi thống kê admin (journal, PRETEST/POSTTEST).
 * Nguồn: bảng stats_analytics_exclusions (trang Admin → Blacklist).
 */
/** @param {import('@prisma/client').PrismaClient} prisma */
export async function getStatsExcludedUsernamesNormalized(prisma) {
  try {
    const rows = await prisma.statsAnalyticsExclusion.findMany({
      select: { usernameNormalized: true },
    })
    return normalizeList(rows.map((r) => r.usernameNormalized))
  } catch (err) {
    console.warn(
      '[stats exclusions] ORM:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    const rows = await prisma.$queryRaw`
      SELECT username_normalized AS n FROM stats_analytics_exclusions
    `
    return normalizeList((Array.isArray(rows) ? rows : []).map((r) => r.n))
  } catch (err2) {
    console.warn(
      '[stats exclusions] raw:',
      err2 instanceof Error ? err2.message : String(err2)
    )
    return []
  }
}

function normalizeList(raw) {
  return [
    ...new Set(
      raw
        .map((x) => String(x ?? '').trim().toLowerCase())
        .filter(Boolean)
    ),
  ]
}
