/**
 * Public directory + booking only include approved psychologists who are not actively blocked.
 * Temporary blocks set blockedUntil in the future; when it passes, role + visibility are restored via expireTemporaryPsychologistBlocks.
 */

function publicPsychologistWhere(now = new Date()) {
  return {
    status: 'approved',
    blockedPermanently: false,
    OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }],
  };
}

async function expireTemporaryPsychologistBlocks(prisma) {
  const now = new Date();
  const expired = await prisma.psychologists.findMany({
    where: {
      blockedPermanently: false,
      blockedUntil: { not: null, lte: now },
    },
    select: { id: true, userId: true },
  });

  for (const p of expired) {
    if (!p.userId) continue;
    await prisma.$transaction([
      prisma.psychologists.update({ where: { id: p.id }, data: { blockedUntil: null } }),
      prisma.users.update({ where: { id: p.userId }, data: { role: 'psychologist' } }),
    ]);
  }
}

module.exports = { publicPsychologistWhere, expireTemporaryPsychologistBlocks };
