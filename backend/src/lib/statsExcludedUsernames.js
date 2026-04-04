/**
 * Username loại khỏi thống kê admin (journal, PRETEST/POSTTEST).
 * Nguồn duy nhất: bảng stats_analytics_exclusions (trang Admin → Blacklist).
 * So khớp không phân biệt hoa thường (lưu chữ thường trong DB).
 */
/** @param {import('@prisma/client').PrismaClient} prisma */
export async function getStatsExcludedUsernamesNormalized(prisma) {
  try {
    const rows = await prisma.statsAnalyticsExclusion.findMany({
      select: { usernameNormalized: true },
    })
    return [
      ...new Set(
        rows
          .map((r) => String(r.usernameNormalized || '').trim().toLowerCase())
          .filter(Boolean)
      ),
    ]
  } catch (err) {
    console.warn(
      '[stats exclusions] DB:',
      err instanceof Error ? err.message : String(err)
    )
    return []
  }
}
