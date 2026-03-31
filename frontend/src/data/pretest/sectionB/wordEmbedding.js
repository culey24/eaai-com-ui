import { mcq3, txt } from './common.js'

export const wordEmbedding = [
  mcq3(
    'Remembering',
    'What is a word embedding?',
    'Word embedding là gì?',
    { en: 'Method to store images', vi: 'Cách lưu ảnh' },
    { en: 'Dense vector representation of words', vi: 'Vector dày đặc biểu diễn từ' },
    { en: 'A database type', vi: 'Một loại CSDL' }
  ),
  mcq3(
    'Remembering',
    'Which model is commonly used to learn word embeddings?',
    'Mô hình nào thường dùng để học embedding từ?',
    { en: 'Decision Tree', vi: 'Cây quyết định' },
    { en: 'Word2Vec', vi: 'Word2Vec' },
    { en: 'K-Means', vi: 'K-means' }
  ),
  mcq3(
    'Understanding',
    'If two words have similar embeddings, it means:',
    'Hai từ có embedding gần nhau nghĩa là:',
    { en: 'They are identical', vi: 'Giống hệt' },
    { en: 'They have the same length', vi: 'Cùng độ dài' },
    { en: 'They appear in similar contexts', vi: 'Xuất hiện trong ngữ cảnh tương tự' }
  ),
  mcq3(
    'Understanding',
    'Main difference: one-hot vs word embeddings?',
    'Khác chính one-hot và word embedding?',
    {
      en: 'One-hot dense; embeddings sparse.',
      vi: 'One-hot dày; embedding thưa.',
    },
    {
      en: 'One-hot captures semantics; embeddings do not.',
      vi: 'One-hot có ngữ nghĩa; embedding không.',
    },
    {
      en: 'Embeddings capture semantic relations; one-hot does not.',
      vi: 'Embedding giữ quan hệ ngữ nghĩa; one-hot không.',
    }
  ),
  mcq3(
    'Applying',
    'Find words with similar meanings. What to use?',
    'Tìm từ gần nghĩa. Dùng gì?',
    { en: 'One-hot', vi: 'One-hot' },
    { en: 'Embeddings + cosine similarity', vi: 'Embedding + cosine' },
    { en: 'Random vectors', vi: 'Vector ngẫu nhiên' }
  ),
  mcq3(
    'Applying',
    'In Word2Vec, goal of Skip-gram?',
    'Trong Word2Vec, mục tiêu Skip-gram?',
    {
      en: 'Predict target from context',
      vi: 'Dự đoán từ mục tiêu từ ngữ cảnh',
    },
    {
      en: 'Predict context from target word',
      vi: 'Dự đoán ngữ cảnh từ từ mục tiêu',
    },
    { en: 'Remove rare words', vi: 'Loại từ hiếm' }
  ),
  mcq3(
    'Analyzing',
    'Why do embeddings often beat one-hot in NLP?',
    'Vì sao embedding thường hơn one-hot trong NLP?',
    {
      en: 'They capture semantic and syntactic relationships.',
      vi: 'Giữ quan hệ ngữ nghĩa và cú pháp.',
    },
    { en: 'They reduce vocabulary size', vi: 'Giảm kích thước từ vựng' },
    { en: 'Eliminate need for training', vi: 'Không cần huấn luyện' }
  ),
  mcq3(
    'Analyzing',
    'Same word multiple meanings (e.g. “bank”) causes:',
    'Một từ nhiều nghĩa (vd. bank) gây:',
    { en: 'Overfitting', vi: 'Overfitting' },
    { en: 'Polysemy problem', vi: 'Vấn đề đa nghĩa (polysemy)' },
    { en: 'Vanishing gradient', vi: 'Gradient triệt tiêu' }
  ),
  txt(
    'Evaluating',
    'Embeddings give poor similarity. Possible reasons?',
    'Embedding cho độ tương tự kém. Lý do có thể?',
    'Data, corpus size, hyperparameters, preprocessing…',
    'English.'
  ),
  txt(
    'Creating',
    'Propose one embedding application and how it improves performance.',
    'Đề xuất một ứng dụng embedding và cách cải thiện hiệu năng.',
    'e.g. search, recommendation.',
    'Ưu tiên tiếng Anh.'
  ),
]
