export const wordEmbedding = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the purpose of Word Embedding?',
      vi: 'Mục đích của Nhúng từ (Word Embedding) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'One-hot encoding', vi: 'Mã hóa One-hot' },
      { key: 'B', en: 'Dense vector representation of words', vi: 'Biểu diễn vectơ dày đặc của các từ' },
      { key: 'C', en: 'Count word frequency', vi: 'Đếm tần suất từ' },
      { key: 'D', en: 'Grammar parsing', vi: 'Phân tích ngữ pháp' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which model is commonly used to learn embeddings?',
      vi: 'Mô hình nào thường được sử dụng để học các bản nhúng (embeddings)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'K-means', vi: 'K-means' },
      { key: 'B', en: 'Word2Vec', vi: 'Word2Vec' },
      { key: 'C', en: 'Apriori', vi: 'Apriori' },
      { key: 'D', en: 'PCA', vi: 'PCA' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why are embeddings better than one-hot vectors?',
      vi: 'Tại sao các bản nhúng lại tốt hơn các vectơ one-hot?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Faster computation', vi: 'Tính toán nhanh hơn' },
      { key: 'B', en: 'Capture semantic similarity', vi: 'Nắm bắt được sự tương đồng về ngữ nghĩa' },
      { key: 'C', en: 'No training needed', vi: 'Không cần huấn luyện' },
      { key: 'D', en: 'Smaller vocabulary', vi: 'Từ vựng nhỏ hơn' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the difference between CBOW and Skip-gram?',
      vi: 'Sự khác biệt giữa CBOW và Skip-gram là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'CBOW predicts context', vi: 'CBOW dự đoán ngữ cảnh' },
      { key: 'B', en: 'CBOW predicts word from context; Skip-gram predicts context from word', vi: 'CBOW dự đoán từ từ ngữ cảnh; Skip-gram dự đoán ngữ cảnh từ từ' },
      { key: 'C', en: 'Same model', vi: 'Cùng một mô hình' },
      { key: 'D', en: 'Skip-gram uses no NN', vi: 'Skip-gram không sử dụng mạng nơ-ron' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: '"king - man + woman ≈ ?"',
      vi: '"vua - đàn ông + phụ nữ ≈ ?"',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'prince', vi: 'hoàng tử' },
      { key: 'B', en: 'queen', vi: 'nữ hoàng' },
      { key: 'C', en: 'girl', vi: 'cô gái' },
      { key: 'D', en: 'mother', vi: 'mẹ' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If two words share similar contexts, what happens?',
      vi: 'Nếu hai từ chia sẻ các ngữ cảnh tương tự, điều gì xảy ra?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Orthogonal vectors', vi: 'Các vectơ trực giao' },
      { key: 'B', en: 'Similar embeddings', vi: 'Các bản nhúng tương tự' },
      { key: 'C', en: 'Removed words', vi: 'Các từ bị xóa' },
      { key: 'D', en: 'Identical tokens', vi: 'Các token giống hệt nhau' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is a limitation of Word2Vec?',
      vi: 'Một hạn chế của Word2Vec là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Sparse vectors', vi: 'Vectơ thưa thớt' },
      { key: 'B', en: 'Cannot capture multiple meanings (polysemy)', vi: 'Không thể nắm bắt được nhiều ý nghĩa (đa nghĩa)' },
      { key: 'C', en: 'Needs labels', vi: 'Cần nhãn' },
      { key: 'D', en: 'No training', vi: 'Không cần huấn luyện' },
    ],
    answer: 'B',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'A Word2Vec model learns associations like "doctor → male" and "nurse → female". What does this indicate?',
      vi: 'Một mô hình Word2Vec học các mối liên hệ như "bác sĩ → nam" và "y tá → nữ". Điều này cho thấy gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Model accuracy', vi: 'Độ chính xác của mô hình' },
      { key: 'B', en: 'Learned societal bias from training data', vi: 'Học được định kiến xã hội từ dữ liệu huấn luyện' },
      { key: 'C', en: 'Overfitting', vi: 'Quá khớp' },
      { key: 'D', en: 'Data noise', vi: 'Nhiễu dữ liệu' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Why is bias in word embeddings problematic in real-world applications?',
      vi: 'Tại sao định kiến trong nhúng từ lại có vấn đề trong các ứng dụng thực tế?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Slower training', vi: 'Huấn luyện chậm hơn' },
      { key: 'B', en: 'Larger vectors', vi: 'Các vectơ lớn hơn' },
      { key: 'C', en: 'It can propagate unfair or discriminatory decisions in downstream systems', vi: 'Nó có thể lan truyền các quyết định không công bằng hoặc phân biệt đối xử trong các hệ thống hạ nguồn' },
      { key: 'D', en: 'Reduced vocabulary', vi: 'Từ vựng bị thu hẹp' },
    ],
    answer: 'C',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'How would you mitigate bias in word embeddings?',
      vi: 'Làm thế nào bạn có thể giảm thiểu định kiến trong nhúng từ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Increase vector size', vi: 'Tăng kích thước vectơ' },
      { key: 'B', en: 'Apply debiasing techniques or retrain on balanced data', vi: 'Áp dụng các kỹ thuật khử định kiến hoặc huấn luyện lại trên dữ liệu cân bằng' },
      { key: 'C', en: 'Remove rare words', vi: 'Xóa các từ hiếm' },
      { key: 'D', en: 'Use one-hot encoding', vi: 'Sử dụng mã hóa one-hot' },
    ],
    answer: 'B',
  },
]
