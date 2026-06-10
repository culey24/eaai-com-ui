export const wordEmbedding = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the key advantage of FastText over Word2Vec?',
      vi: 'Ưu điểm chính của FastText so với Word2Vec là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It only works with English', vi: 'Nó chỉ hoạt động với tiếng Anh' },
      { key: 'B', en: 'It requires labeled data', vi: 'Nó yêu cầu dữ liệu có nhãn' },
      { key: 'C', en: 'It uses subword information (n-grams)', vi: 'Nó sử dụng thông tin từ con (subword - n-grams)' },
      { key: 'D', en: 'It is faster to train', vi: 'Nó huấn luyện nhanh hơn' },
    ],
    answer: 'C',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Why do static embeddings (e.g. Word2Vec) struggle with polysemy?',
      vi: 'Tại sao các nhúng từ tĩnh (ví dụ: Word2Vec) gặp khó khăn với hiện tượng đa nghĩa?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'They require too much memory', vi: 'Chúng đòi hỏi quá nhiều bộ nhớ' },
      { key: 'B', en: 'They are too large', vi: 'Chúng có kích thước quá lớn' },
      { key: 'C', en: 'Each word has only one fixed vector regardless of context', vi: 'Mỗi từ chỉ có một vectơ cố định duy nhất bất kể ngữ cảnh' },
      { key: 'D', en: 'They cannot handle rare words', vi: 'Chúng không thể xử lý các từ hiếm' },
    ],
    answer: 'C',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the main advantage of contextual embeddings (e.g. BERT) over static embeddings?',
      vi: 'Ưu điểm chính của nhúng từ ngữ cảnh (ví dụ: BERT) so với nhúng từ tĩnh là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'They only capture syntax', vi: 'Chúng chỉ nắm bắt cú pháp' },
      { key: 'B', en: 'They do not need training', vi: 'Chúng không cần huấn luyện' },
      { key: 'C', en: 'They are smaller in size', vi: 'Chúng có kích thước nhỏ hơn' },
      { key: 'D', en: 'Word representations change based on sentence context', vi: 'Biểu diễn từ thay đổi linh hoạt dựa trên ngữ cảnh của câu' },
    ],
    answer: 'D',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'In the analogy "king - man + woman ≈ ?", what is the expected result?',
      vi: 'Trong phép so sánh tương tự "king - man + woman ≈ ?", kết quả kỳ vọng thu được là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Prince', vi: 'Prince' },
      { key: 'B', en: 'Girl', vi: 'Girl' },
      { key: 'C', en: 'Mother', vi: 'Mother' },
      { key: 'D', en: 'Queen', vi: 'Queen' },
    ],
    answer: 'D',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'How can you best evaluate the quality of word embeddings?',
      vi: 'Làm thế nào bạn có thể đánh giá tốt nhất chất lượng của nhúng từ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'By checking training loss only', vi: 'Chỉ bằng cách kiểm tra mất mát huấn luyện (training loss)' },
      { key: 'B', en: 'By measuring model size', vi: 'Bằng cách đo kích thước mô hình' },
      { key: 'C', en: 'By counting vocabulary', vi: 'Bằng cách đếm số lượng từ vựng' },
      { key: 'D', en: 'Using word analogy and similarity tasks', vi: 'Sử dụng các tác vụ tương tự từ (word analogy) và tương đồng từ (similarity)' },
    ],
    answer: 'D',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'What type of bias is shown if "doctor" is closer to "man" and "nurse" to "woman"?',
      vi: 'Loại thiên lệch (bias) nào được thể hiện nếu từ "doctor" gần với "man" hơn và "nurse" gần với "woman" hơn?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Technical bias from algorithm', vi: 'Thiên lệch kỹ thuật từ thuật toán' },
      { key: 'B', en: 'Evaluation bias', vi: 'Thiên lệch đánh giá' },
      { key: 'C', en: 'Random noise', vi: 'Nhiễu ngẫu nhiên' },
      { key: 'D', en: 'Societal/gender stereotype bias from training data', vi: 'Thiên lệch định kiến xã hội/giới tính từ dữ liệu huấn luyện' },
    ],
    answer: 'D',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is a major limitation of GloVe compared to BERT?',
      vi: 'Hạn chế lớn của GloVe so với BERT là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'GloVe produces static embeddings', vi: 'GloVe tạo ra các nhúng từ tĩnh (static embeddings)' },
      { key: 'B', en: 'GloVe cannot handle English', vi: 'GloVe không thể xử lý tiếng Anh' },
      { key: 'C', en: 'GloVe needs labeled data', vi: 'GloVe cần dữ liệu có nhãn' },
      { key: 'D', en: 'GloVe is slower to train', vi: 'GloVe huấn luyện chậm hơn' },
    ],
    answer: 'A',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Why is bias in word embeddings dangerous in real applications?',
      vi: 'Tại sao thiên lệch trong nhúng từ lại nguy hiểm trong các ứng dụng thực tế?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It increases vocabulary size', vi: 'Nó làm tăng kích thước từ vựng' },
      { key: 'B', en: 'It makes training slower', vi: 'Nó làm cho huấn luyện chậm hơn' },
      { key: 'C', en: 'It can lead to unfair or discriminatory decisions in downstream tasks', vi: 'Nó có thể dẫn đến các quyết định không công bằng hoặc phân biệt đối xử trong các tác vụ hạ nguồn' },
      { key: 'D', en: 'It reduces model accuracy', vi: 'Nó làm giảm độ chính xác của mô hình' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Which method is most effective for reducing bias in word embeddings?',
      vi: 'Phương pháp nào hiệu quả nhất để giảm thiểu thiên lệch trong nhúng từ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Remove stopwords', vi: 'Loại bỏ các từ dừng (stopwords)' },
      { key: 'B', en: 'Increase vector dimension', vi: 'Tăng chiều vectơ' },
      { key: 'C', en: 'Use larger batch size', vi: 'Sử dụng kích thước lô lớn hơn' },
      { key: 'D', en: 'Use debiasing techniques or balanced training data', vi: 'Sử dụng các kỹ thuật khử lệch (debiasing) hoặc dữ liệu huấn luyện cân bằng' },
    ],
    answer: 'D',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Which approach is best for creating good word embeddings for Vietnamese?',
      vi: 'Cách tiếp cận nào là tốt nhất để tạo nhúng từ tốt cho tiếng Việt?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Use only one-hot encoding', vi: 'Chỉ sử dụng mã hóa one-hot' },
      { key: 'B', en: 'Use standard English Word2Vec directly', vi: 'Sử dụng trực tiếp Word2Vec tiếng Anh tiêu chuẩn' },
      { key: 'C', en: 'Reduce vocabulary size', vi: 'Giảm kích thước từ vựng' },
      { key: 'D', en: 'Train on large Vietnamese corpus with subword handling and diacritic support', vi: 'Huấn luyện trên kho văn bản tiếng Việt lớn có xử lý từ con (subword) và hỗ trợ dấu tiếng Việt' },
    ],
    answer: 'D',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The team trains Word Embeddings on the customer feedback corpus. The vector for "delay" is very close to the vectors of "late", "traffic", and "rainy". What does this closeness indicate?',
      vi: 'Nhóm huấn luyện nhúng từ trên kho ngữ liệu phản hồi của khách hàng. Vectơ của từ "delay" rất gần với vectơ của các từ "late", "traffic" và "rainy". Sự gần gũi này chỉ ra điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'These words appear in the same sentences frequently and share similar semantic context.', vi: 'Những từ này xuất hiện thường xuyên trong cùng một câu và chia sẻ ngữ cảnh ngữ nghĩa tương tự.' },
      { key: 'B', en: 'These words have the same sentiment score.', vi: 'Những từ này có cùng điểm số cảm xúc.' },
      { key: 'C', en: 'The model is biased toward negative words.', vi: 'Mô hình bị thiên lệch đối với các từ tiêu cực.' },
      { key: 'D', en: 'These words have high TF-IDF scores.', vi: 'Những từ này có điểm TF-IDF cao.' },
    ],
    answer: 'A',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'When using pre-trained Word Embeddings (e.g., Word2Vec or GloVe) trained on general English data versus embeddings trained specifically on the logistics customer review corpus, which one is generally better for understanding domain-specific terms like "satellite depot", "last-mile", "AEV", and "gig-shipper"?',
      vi: 'Khi sử dụng các nhúng từ huấn luyện trước (ví dụ: Word2Vec hoặc GloVe) được huấn luyện trên dữ liệu tiếng Anh chung so với các nhúng từ được huấn luyện riêng trên kho đánh giá khách hàng logistics, cái nào thường tốt hơn để hiểu các thuật ngữ chuyên ngành như "satellite depot", "last-mile", "AEV" và "gig-shipper"?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'General pre-trained embeddings are always better.', vi: 'Nhúng từ huấn luyện trước trên dữ liệu chung luôn tốt hơn.' },
      { key: 'B', en: 'Domain-specific embeddings trained on the company\'s own corpus.', vi: 'Nhúng từ đặc thù chuyên ngành được huấn luyện trên chính kho ngữ liệu của công ty.' },
      { key: 'C', en: 'They will produce the same result.', vi: 'Chúng sẽ tạo ra cùng một kết quả.' },
      { key: 'D', en: 'Character-level embeddings are better than word embeddings.', vi: 'Nhúng cấp độ ký tự tốt hơn nhúng cấp độ từ.' },
    ],
    answer: 'B',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The team observes that in the trained embedding space: vector("courier") - vector("human") + vector("AEV") is close to vector("autonomous"). What capability of Word Embedding does this example demonstrate?',
      vi: 'Nhóm quan sát thấy rằng trong không gian nhúng đã huấn luyện: vector("courier") - vector("human") + vector("AEV") gần với vector("autonomous"). Ví dụ này chứng minh khả năng nào của Nhúng từ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Word Analogy / Semantic Reasoning', vi: 'So sánh tương tự từ / Suy luận ngữ nghĩa (Word Analogy / Semantic Reasoning)' },
      { key: 'B', en: 'Sentiment Analysis', vi: 'Phân tích cảm xúc' },
      { key: 'C', en: 'Topic Modeling', vi: 'Mô hình hóa chủ đề' },
      { key: 'D', en: 'Dimensionality Reduction only', vi: 'Chỉ giảm chiều dữ liệu' },
    ],
    answer: 'A',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'The team wants to use Word Embeddings to automatically detect negative courier behavior from call transcripts. They average all word vectors in a review to get a document vector, then train a classifier. What is a major limitation of this approach?',
      vi: 'Nhóm muốn sử dụng Nhúng từ để tự động phát hiện hành vi shipper tiêu cực từ bản ghi cuộc gọi. Họ trung bình hóa tất cả các vectơ từ trong một đánh giá để có được vectơ tài liệu, sau đó huấn luyện bộ phân loại. Hạn chế lớn của phương pháp này là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It completely ignores word order and context.', vi: 'Nó bỏ qua hoàn toàn thứ tự từ và ngữ cảnh.' },
      { key: 'B', en: 'It always produces high accuracy.', vi: 'Nó luôn tạo ra độ chính xác cao.' },
      { key: 'C', en: 'It cannot handle out-of-vocabulary words.', vi: 'Nó không thể xử lý các từ nằm ngoài từ vựng.' },
      { key: 'D', en: 'It requires a very large embedding size (minimum 1000 dimensions).', vi: 'Nó đòi hỏi kích thước nhúng cực lớn (tối thiểu 1000 chiều).' },
    ],
    answer: 'A',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'To better capture contextual meaning in customer complaints (e.g., the word "slow" can mean slow delivery or slow response depending on context), which advanced embedding technique should the team adopt instead of static Word2Vec/GloVe?',
      vi: 'Để nắm bắt tốt hơn ý nghĩa ngữ cảnh trong khiếu nại của khách hàng (ví dụ: từ "chậm" có thể mang nghĩa giao hàng chậm hoặc phản hồi chậm tùy ngữ cảnh), kỹ thuật nhúng tiên tiến nào nhóm nên áp dụng thay vì Word2Vec/GloVe tĩnh?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'TF-IDF weighted Word2Vec', vi: 'Word2Vec có trọng số TF-IDF' },
      { key: 'B', en: 'Contextual embeddings such as BERT or RoBERTa (contextualized word representations)', vi: 'Nhúng từ theo ngữ cảnh như BERT hoặc RoBERTa (biểu diễn từ ngữ cảnh hóa)' },
      { key: 'C', en: 'Increase the dimension of Word2Vec to 500', vi: 'Tăng chiều của Word2Vec lên 500' },
      { key: 'D', en: 'Use only FastText because it handles subwords', vi: 'Chỉ sử dụng FastText vì nó xử lý các từ con (subwords)' },
    ],
    answer: 'B',
  },
]
