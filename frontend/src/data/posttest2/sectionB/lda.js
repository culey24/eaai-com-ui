export const latentDirichletAllocation = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In LDA, what do the hyperparameters alpha and beta represent?',
      vi: 'Trong LDA, các siêu tham số alpha và beta đại diện cho điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Number of topics and vocabulary size', vi: 'Số lượng chủ đề và kích thước từ vựng' },
      { key: 'B', en: 'Smoothing parameters for topic-document and word-topic distributions', vi: 'Tham số làm mượt cho phân phối chủ đề-tài liệu và từ ngữ-chủ đề' },
      { key: 'C', en: 'Learning rate and momentum', vi: 'Tốc độ học (learning rate) và đà (momentum)' },
      { key: 'D', en: 'Number of iterations', vi: 'Số vòng lặp' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which sampling method is most commonly used for inference in LDA?',
      vi: 'Phương pháp lấy mẫu nào được sử dụng phổ biến nhất để suy diễn trong LDA?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'MCMC with Gibbs Sampling', vi: 'MCMC với Lấy mẫu Gibbs (Gibbs Sampling)' },
      { key: 'B', en: 'Gradient Descent', vi: 'Hạ Gradient (Gradient Descent)' },
      { key: 'C', en: 'Backpropagation', vi: 'Lan truyền ngược (Backpropagation)' },
      { key: 'D', en: 'Expectation Maximization only', vi: 'Chỉ thuật toán cực đại hóa kỳ vọng (EM)' },
    ],
    answer: 'A',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why is LDA considered a generative probabilistic model?',
      vi: 'Tại sao LDA được coi là một mô hình xác suất sinh (generative probabilistic model)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It predicts document labels directly', vi: 'Nó dự đoán nhãn tài liệu trực tiếp' },
      { key: 'B', en: 'It models how documents can be generated from topics and words', vi: 'Nó mô hình hóa cách các tài liệu có thể được sinh ra từ các chủ đề và từ ngữ' },
      { key: 'C', en: 'It classifies documents into fixed categories', vi: 'Nó phân loại tài liệu vào các danh mục cố định' },
      { key: 'D', en: 'It minimizes reconstruction error', vi: 'Nó cực tiểu hóa sai số tái cấu trúc' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the main difference between LDA and pLSA?',
      vi: 'Sự khác biệt chính giữa LDA và pLSA là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'LDA uses Dirichlet priors while pLSA does not', vi: 'LDA sử dụng phân phối tiên nghiệm Dirichlet trong khi pLSA thì không' },
      { key: 'B', en: 'pLSA is Bayesian while LDA is not', vi: 'pLSA mang tính Bayes trong khi LDA thì không' },
      { key: 'C', en: 'LDA only works with long documents', vi: 'LDA chỉ hoạt động với các tài liệu dài' },
      { key: 'D', en: 'pLSA supports multiple topics per document', vi: 'pLSA hỗ trợ nhiều chủ đề cho mỗi tài liệu' },
    ],
    answer: 'A',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If a document has topic distribution theta = [0.6, 0.3, 0.1], what does this mean?',
      vi: 'Nếu một tài liệu có phân phối chủ đề theta = [0.6, 0.3, 0.1], điều này có nghĩa là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The document belongs to only one topic', vi: 'Tài liệu chỉ thuộc về một chủ đề' },
      { key: 'B', en: '60% of the words are likely generated from the first topic', vi: '60% các từ có khả năng được sinh ra từ chủ đề đầu tiên' },
      { key: 'C', en: 'The document has exactly 3 topics', vi: 'Tài liệu có chính xác 3 chủ đề' },
      { key: 'D', en: 'The document is labeled with the dominant topic', vi: 'Tài liệu được gắn nhãn với chủ đề vượt trội' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'What happens when the number of topics (K) is set too high in LDA?',
      vi: 'Điều gì xảy ra khi số lượng chủ đề (K) được đặt quá cao trong LDA?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Topics become more coherent', vi: 'Các chủ đề trở nên nhất quán hơn' },
      { key: 'B', en: 'Topics become fragmented and less interpretable', vi: 'Các chủ đề trở nên phân mảnh và khó diễn giải hơn' },
      { key: 'C', en: 'Model training becomes faster', vi: 'Quá trình huấn luyện mô hình trở nên nhanh hơn' },
      { key: 'D', en: 'Perplexity always decreases', vi: 'Độ bối rối (perplexity) luôn giảm' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Which of the following is a major limitation of LDA?',
      vi: 'Điều nào sau đây là một hạn chế lớn của LDA?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It cannot handle polysemy well', vi: 'Nó không thể xử lý tốt hiện tượng đa nghĩa của từ' },
      { key: 'B', en: 'It requires labeled data', vi: 'Nó yêu cầu dữ liệu có nhãn' },
      { key: 'C', en: 'It captures word order effectively', vi: 'Nó nắm bắt thứ tự từ hiệu quả' },
      { key: 'D', en: 'It works only with image data', vi: 'Nó chỉ hoạt động với dữ liệu hình ảnh' },
    ],
    answer: 'A',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is a key ethical concern when using LDA on private user messages?',
      vi: 'Mối quan ngại đạo đức chính khi sử dụng LDA trên các tin nhắn riêng tư của người dùng là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'High computational cost', vi: 'Chi phí tính toán cao' },
      { key: 'B', en: 'Privacy violation and lack of consent', vi: 'Vi phạm quyền riêng tư và thiếu sự đồng thuận' },
      { key: 'C', en: 'Low model accuracy', vi: 'Độ chính xác của mô hình thấp' },
      { key: 'D', en: 'Difficulty in choosing K', vi: 'Khó khăn trong việc chọn K' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'When is LDA most suitable for a task?',
      vi: 'Khi nào LDA phù hợp nhất cho một tác vụ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Real-time sentiment analysis', vi: 'Phân tích cảm xúc thời gian thực' },
      { key: 'B', en: 'Topic discovery in large unlabeled text collections', vi: 'Phát hiện chủ đề trong tập hợp văn bản lớn chưa được gán nhãn' },
      { key: 'C', en: 'Image classification', vi: 'Phân loại hình ảnh' },
      { key: 'D', en: 'Time-series prediction', vi: 'Dự báo chuỗi thời gian' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Which technique is most effective to improve privacy in an LDA-based user profiling system?',
      vi: 'Kỹ thuật nào hiệu quả nhất để cải thiện tính riêng tư trong hệ thống xây dựng hồ sơ người dùng dựa trên LDA?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Increase number of topics', vi: 'Tăng số lượng chủ đề' },
      { key: 'B', en: 'Apply Differential Privacy or document anonymization', vi: 'Áp dụng Quyền riêng tư vi sai (Differential Privacy) hoặc ẩn danh hóa tài liệu' },
      { key: 'C', en: 'Use larger vocabulary', vi: 'Sử dụng từ vựng lớn hơn' },
      { key: 'D', en: 'Reduce the number of iterations', vi: 'Giảm số vòng lặp' },
    ],
    answer: 'B',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The data team applies LDA on the "Customer Feedback & Call Center Logs" (unstructured text data) to discover hidden topics in customer complaints. After training a 5-topic LDA model, one topic shows high probability words: delay, rain, traffic, late, flooded. Which of the following is the most accurate interpretation?',
      vi: 'Nhóm dữ liệu áp dụng LDA trên "Customer Feedback & Call Center Logs" (dữ liệu văn bản phi cấu trúc) để phát hiện các chủ đề ẩn trong khiếu nại của khách hàng. Sau khi huấn luyện mô hình LDA 5 chủ đề, một chủ đề hiển thị các từ có xác suất cao: delay, rain, traffic, late, flooded. Cách giải thích nào sau đây là chính xác nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Customers frequently mention these 5 words together in the same sentence.', vi: 'Khách hàng thường xuyên đề cập đến 5 từ này cùng nhau trong cùng một câu.' },
      { key: 'B', en: 'This topic represents a latent theme about "Weather-related Delivery Delays".', vi: 'Chủ đề này đại diện cho một chủ đề ẩn về "Sự trễ hẹn giao hàng do thời tiết".' },
      { key: 'C', en: 'The model has high accuracy because it found 5 important keywords.', vi: 'Mô hình có độ chính xác cao vì nó đã tìm thấy 5 từ khóa quan trọng.' },
      { key: 'D', en: 'This topic should be removed because it contains negative words.', vi: 'Chủ đề này nên được loại bỏ vì nó chứa các từ tiêu cực.' },
    ],
    answer: 'B',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'When running LDA on tens of thousands of customer reviews, the team notices that increasing the number of topics (K) from 5 to 20 causes the average coherence score to rise initially then drop sharply after K=12. What does this phenomenon indicate?',
      vi: 'Khi chạy LDA trên hàng chục nghìn đánh giá của khách hàng, nhóm nhận thấy rằng việc tăng số lượng chủ đề (K) từ 5 lên 20 làm cho điểm mạch lạc (coherence score) trung bình tăng ban đầu rồi giảm mạnh sau khi K=12. Hiện tượng này cho thấy điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The model is suffering from overfitting when K is too large.', vi: 'Mô hình đang bị quá khớp (overfitting) khi K quá lớn.' },
      { key: 'B', en: 'The data only has exactly 12 real topics.', vi: 'Dữ liệu chỉ có chính xác 12 chủ đề thực tế.' },
      { key: 'C', en: 'LDA cannot handle large K values.', vi: 'LDA không thể xử lý các giá trị K lớn.' },
      { key: 'D', en: 'The preprocessing step (stopword removal) was done incorrectly.', vi: 'Bước tiền xử lý (loại bỏ từ dừng) đã được thực hiện không chính xác.' },
    ],
    answer: 'A',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The team compares two topics generated by LDA from courier call logs: Topic A: battery, low, recharge, warning, stop (high probability); Topic B: friendly, fast, polite, helpful, smile (high probability). How should the team evaluate these two topics for operational improvement?',
      vi: 'Nhóm so sánh hai chủ đề được tạo ra bởi LDA từ nhật ký cuộc gọi của shippers: Chủ đề A: battery, low, recharge, warning, stop (xác suất cao); Chủ đề B: friendly, fast, polite, helpful, smile (xác suất cao). Nhóm nên đánh giá hai chủ đề này thế nào để cải thiện vận hành?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Topic B is more important because it has more positive words.', vi: 'Chủ đề B quan trọng hơn vì nó chứa nhiều từ tích cực hơn.' },
      { key: 'B', en: 'Topic A should be prioritized because it relates to AEV technical failures that affect service reliability.', vi: 'Chủ đề A nên được ưu tiên vì nó liên quan đến các lỗi kỹ thuật của AEV ảnh hưởng đến độ tin cậy của dịch vụ.' },
      { key: 'C', en: 'Both topics are equally important since LDA treats all topics the same.', vi: 'Cả hai chủ đề đều quan trọng như nhau vì LDA đối xử với mọi chủ đề giống nhau.' },
      { key: 'D', en: 'Topic B is better because it has higher topic coherence.', vi: 'Chủ đề B tốt hơn vì nó có độ mạch lạc chủ đề cao hơn.' },
    ],
    answer: 'B',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'The engineering team wants to use LDA topic distributions as features for predicting customer satisfaction (1-5 stars). They notice that documents with high proportion in the "Damaged Package" topic consistently receive low satisfaction scores. Which statement is correct?',
      vi: 'Nhóm kỹ sư muốn sử dụng phân phối chủ đề của LDA làm các đặc trưng để dự đoán sự hài lòng của khách hàng (1-5 sao). Họ nhận thấy rằng các tài liệu có tỷ lệ cao trong chủ đề "Damaged Package" liên tục nhận được điểm hài lòng thấp. Phát biểu nào sau đây là đúng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'This proves that LDA has better predictive power than Word Embedding.', vi: 'Điều này chứng tỏ LDA có khả năng dự đoán tốt hơn Word Embedding.' },
      { key: 'B', en: 'The "Damaged Package" topic distribution is a strong negative predictor for customer satisfaction.', vi: 'Phân phối chủ đề "Damaged Package" là một yếu tố dự báo tiêu cực mạnh mẽ đối với sự hài lòng của khách hàng.' },
      { key: 'C', en: 'They should only use the top 3 words of each topic instead of the full topic distribution.', vi: 'Họ chỉ nên sử dụng 3 từ hàng đầu của mỗi chủ đề thay vì toàn bộ phân phối chủ đề.' },
      { key: 'D', en: 'LDA cannot be used as features for downstream supervised learning.', vi: 'LDA không thể được sử dụng làm đặc trưng cho học giám sát ở hạ nguồn.' },
    ],
    answer: 'B',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'The current LDA model treats each customer review as a single document. However, delivery feedback contains multiple aspects (courier behavior, package condition, timing, etc.). Propose an improved modeling approach using LDA principles to better capture these multiple aspects.',
      vi: 'Mô hình LDA hiện tại coi mỗi đánh giá của khách hàng là một tài liệu duy nhất. Tuy nhiên, phản hồi giao hàng chứa nhiều khía cạnh (hành vi shipper, tình trạng gói hàng, thời gian, v.v.). Đề xuất một cách tiếp cận mô hình hóa cải tiến sử dụng các nguyên lý LDA để nắm bắt tốt hơn các khía cạnh đa dạng này.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Use standard LDA with higher number of topics (K=50).', vi: 'Sử dụng LDA tiêu chuẩn với số lượng chủ đề cao hơn (K=50).' },
      { key: 'B', en: 'Apply Bi-term LDA or Sentence-level LDA / Aspect-based LDA.', vi: 'Áp dụng Bi-term LDA hoặc LDA cấp câu / LDA dựa trên khía cạnh (Aspect-based LDA).' },
      { key: 'C', en: 'Switch to K-means clustering on TF-IDF vectors.', vi: 'Chuyển sang phân cụm K-means trên các vectơ TF-IDF.' },
      { key: 'D', en: 'Use only bigrams and trigrams in the vocabulary.', vi: 'Chỉ sử dụng bigram và trigram trong từ vựng.' },
    ],
    answer: 'B',
  },
]
