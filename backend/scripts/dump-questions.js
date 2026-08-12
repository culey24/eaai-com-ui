import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Pretest Section B & C
import { SECTION_B_QUESTIONS as pretestB } from '../../frontend/src/data/pretest/sectionB/index.js'
import { SECTION_C_ITEMS as pretestC } from '../../frontend/src/data/pretest/sectionCItems.js'

// Posttest Section B & C
import { SECTION_B_QUESTIONS as posttestB } from '../src/data/posttest/sectionB/index.js'
import { SECTION_C_ITEMS as posttestC } from '../src/data/posttest/sectionCItems.js'

// Posttest 2 Section B & C
import { SECTION_B_QUESTIONS as posttest2B } from '../src/data/posttest2/sectionB/index.js'
import { SECTION_C_ITEMS as posttest2C } from '../src/data/posttest2/sectionCItems.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function formatBQuestions(bQuestions) {
  const result = {}
  for (const [topicId, questions] of Object.entries(bQuestions)) {
    result[topicId] = questions.map((q, idx) => {
      // Prompt can be string or object with en/vi
      let text = ''
      if (q.prompt) {
        if (typeof q.prompt === 'string') {
          text = q.prompt
        } else {
          text = q.prompt.en || q.prompt.vi || ''
        }
      }
      return {
        id: `q${idx + 1}`,
        text: text,
        correctAnswer: q.correctAnswer || ''
      }
    })
  }
  return result
}

function formatCQuestions(cQuestions) {
  return cQuestions.map(item => ({
    id: item.id,
    text: item.en || item.vi || ''
  }))
}

const data = {
  pretest: {
    sectionB: formatBQuestions(pretestB),
    sectionC: formatCQuestions(pretestC)
  },
  posttest: {
    sectionB: formatBQuestions(posttestB),
    sectionC: formatCQuestions(posttestC)
  },
  posttest2: {
    sectionB: formatBQuestions(posttest2B),
    sectionC: formatCQuestions(posttest2C)
  }
}

const outputPath = path.resolve(__dirname, '../../docs/cham-bai/questions.json')
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')
console.log(`Successfully dumped questions to ${outputPath}`)
