import { associationRulesMining } from './arm.js'
import { recommenderSystem } from './recommender.js'
import { fuzzyLogic } from './fuzzy.js'
import { linearRegression } from './linearRegression.js'
import { logisticRegression } from './logisticRegression.js'
import { latentDirichletAllocation } from './lda.js'
import { deepNeuralNetworks } from './dnn.js'
import { wordEmbedding } from './wordEmbedding.js'

/** Khớp backend/src/lib/pretestValidate.js PRETEST_TOPIC_IDS */
export const SECTION_B_QUESTIONS = {
  association_rules_mining: associationRulesMining,
  recommender_system: recommenderSystem,
  fuzzy_logic: fuzzyLogic,
  linear_regression: linearRegression,
  logistic_regression: logisticRegression,
  latent_dirichlet_allocation: latentDirichletAllocation,
  deep_neural_networks: deepNeuralNetworks,
  word_embedding: wordEmbedding,
}

export function getSectionBQuestions(topicId) {
  const list = SECTION_B_QUESTIONS[topicId]
  return Array.isArray(list) ? list : []
}
