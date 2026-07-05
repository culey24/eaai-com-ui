/**
 * Tạo data test: users + posttest1 responses để test generate-posttest2.mjs
 * Usage: DATABASE_URL="..." node scripts/seed-test-data.mjs
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_USERS = [
  { userId: 'TS001', fullname: 'Nguyễn Văn A', userClass: 'IS_1' },
  { userId: 'TS002', fullname: 'Trần Thị B', userClass: 'IS_1' },
  { userId: 'TS003', fullname: 'Lê Văn C', userClass: 'IS_1' },
  { userId: 'TS004', fullname: 'Phạm Thị D', userClass: 'IS_2' },
  { userId: 'TS005', fullname: 'Hoàng Văn E', userClass: 'IS_2' },
  { userId: 'TS006', fullname: 'Vũ Thị F', userClass: 'IS_2' },
  { userId: 'TS007', fullname: 'Đỗ Văn G', userClass: 'IS_3' },
  { userId: 'TS008', fullname: 'Ngô Thị H', userClass: 'IS_3' },
  { userId: 'TS009', fullname: 'Bùi Văn I', userClass: 'IS_3' },
  { userId: 'TS010', fullname: 'Đặng Văn K', userClass: null },  // no class
]

// Random sectionB answers for posttest1 (10 câu/topic, 2 topics)
const TOPICS = [
  'association_rules_mining', 'recommender_system', 'fuzzy_logic',
  'linear_regression', 'logistic_regression', 'latent_dirichlet_allocation',
  'deep_neural_networks', 'word_embedding',
]
const KEYS = ['A', 'B', 'C', 'D']

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Tạo posttest1 answers với tỷ lệ đúng khác nhau
function makePosttest1(correctRate) {
  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, 2)
  const sectionB = {}
  for (const t of picked) {
    const answers = {}
    for (let i = 1; i <= 10; i++) {
      // correctRate chance of picking a "correct" answer (random key simulates correct)
      if (Math.random() < correctRate) {
        answers[`q${i}`] = KEYS[randInt(0, 3)] // simulate correct
      } else {
        answers[`q${i}`] = KEYS[randInt(0, 3)]
      }
    }
    sectionB[t] = answers
  }
  return { sectionB, topicFirst: picked[0], topicSecond: picked[1] }
}

function makeSectionA(topicFirst, topicSecond) {
  return {
    yearOfStudy: String(randInt(2, 4)),
    gender: 'male',
    studentStatus: 'active',
    selfLearningScale: '3',
    topicFirst, topicSecond,
    studiedTopic1: 'yes', studiedTopic2: 'yes',
    familiarityTopic1Scale: '3', familiarityTopic2Scale: '3',
    usedGenAi: 'yes', aiLearningFrequency: 'weekly',
    aiToolPrimary: 'chatgpt', aiStudyPurpose: 'learning',
    attendedAiTraining: 'yes',
  }
}

function makeSectionC() {
  const c = {}
  for (let i = 1; i <= 10; i++) c[`c${i}`] = String(randInt(2, 5))
  return c
}

async function main() {
  console.log('Seeding test data...\n')

  for (const u of TEST_USERS) {
    // Create user (upsert)
    await prisma.user.upsert({
      where: { userId: u.userId },
      update: {},
      create: {
        userId: u.userId,
        username: u.userId.toLowerCase(),
        pwd: 'test',
        fullname: u.fullname,
        userRole: 'student',
        dateOfBirth: new Date('2002-01-01'),
        gender: 'Male',
        majorCode: '0000000',
        trainingProgramType: 'CTK46',
        userClass: u.userClass,
      },
    })

    // Create posttest1 with varying correct rates
    // IS-1: ~60%, IS-2: ~40%, IS-3: ~50%, null: ~45%
    const rates = { IS_1: 0.60, IS_2: 0.40, IS_3: 0.50 }
    const rate = rates[u.userClass] ?? 0.45
    const { sectionB, topicFirst, topicSecond } = makePosttest1(rate)

    await prisma.surveyResponse.create({
      data: {
        userId: u.userId,
        surveyKind: 'POSTTEST',
        sectionA: makeSectionA(topicFirst, topicSecond),
        sectionB,
        sectionC: makeSectionC(),
      },
    })

    console.log(`  ✓ ${u.userId} (${u.userClass ?? 'null'}) ${u.fullname} — posttest1 created (target rate: ${(rate * 100).toFixed(0)}%)`)
  }

  console.log('\nDone. Test data ready.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
