export const latentDirichletAllocation = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In Latent Dirichlet Allocation (LDA), what does each topic represent?',
      vi: 'Trong Phân bổ Dirichlet tiềm ẩn (LDA), mỗi chủ đề đại diện cho điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A single document', vi: 'Một văn bản duy nhất' },
      { key: 'B', en: 'A probability distribution over words', vi: 'Một phân phối xác suất trên các từ' },
      { key: 'C', en: 'A cluster of documents', vi: 'Một cụm các văn bản' },
      { key: 'D', en: 'A label assigned manually', vi: 'Một nhãn được gán thủ công' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the role of the Dirichlet distribution in LDA?',
      vi: 'Vai trò của phân phối Dirichlet trong LDA là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It defines distances between documents', vi: 'Nó xác định khoảng cách giữa các văn bản' },
      { key: 'B', en: 'It generates Gaussian noise', vi: 'Nó tạo ra nhiễu Gaussian' },
      { key: 'C', en: 'It acts as a prior over topic distributions', vi: 'Nó hoạt động như một phân phối tiên nghiệm trên các phân phối chủ đề' },
      { key: 'D', en: 'It normalizes word counts', vi: 'Nó chuẩn hóa số lượng từ' },
    ],
    answer: 'C',
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
      { key: 'A', en: 'It classifies documents', vi: 'Nó phân loại văn bản' },
      { key: 'B', en: 'It describes how documents could be generated from latent topics', vi: 'Nó mô tả cách các văn bản có thể được tạo ra từ các chủ đề tiềm ẩn' },
      { key: 'C', en: 'It directly predicts labels', vi: 'Nó trực tiếp dự đoán nhãn' },
      { key: 'D', en: 'It minimizes prediction error', vi: 'Nó tối thiểu hóa lỗi dự đoán' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the key assumption LDA makes about documents?',
      vi: 'Giả định chính mà LDA đưa ra về các văn bản là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Each document belongs to exactly one topic', vi: 'Mỗi văn bản thuộc về đúng một chủ đề' },
      { key: 'B', en: 'Words are independent of topics', vi: 'Các từ độc lập với các chủ đề' },
      { key: 'C', en: 'Each document is a mixture of topics', vi: 'Mỗi văn bản là một sự pha trộn của các chủ đề' },
      { key: 'D', en: 'Topics are fixed and predefined', vi: 'Các chủ đề là cố định và được xác định trước' },
    ],
    answer: 'C',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If a document has topic distribution θ = [0.7 Sports, 0.3 Politics], what does this imply?',
      vi: 'Nếu một văn bản có phân phối chủ đề θ = [0.7 Thể thao, 0.3 Chính trị], điều này ngụ ý gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Document belongs only to Sports', vi: 'Văn bản chỉ thuộc về Thể thao' },
      { key: 'B', en: '70% of words are generated from Sports topic', vi: '70% số từ được tạo ra từ chủ đề Thể thao' },
      { key: 'C', en: 'Document is labeled Sports', vi: 'Văn bản được dán nhãn Thể thao' },
      { key: 'D', en: 'Topics are deterministic', vi: 'Các chủ đề là xác định' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'During Gibbs Sampling in LDA, what is iteratively updated?',
      vi: 'Trong quá trình lấy mẫu Gibbs trong LDA, cái gì được cập nhật lặp đi lặp lại?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Document labels', vi: 'Nhãn văn bản' },
      { key: 'B', en: 'Topic assignments for each word', vi: 'Việc gán chủ đề cho mỗi từ' },
      { key: 'C', en: 'Vocabulary size', vi: 'Kích thước từ vựng' },
      { key: 'D', en: 'Neural weights', vi: 'Trọng số nơ-ron' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What happens if the number of topics K is too large?',
      vi: 'Điều gì xảy ra nếu số lượng chủ đề K quá lớn?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Topics become more general', vi: 'Các chủ đề trở nên tổng quát hơn' },
      { key: 'B', en: 'Topics may become fragmented or incoherent', vi: 'Các chủ đề có thể trở nên rời rạc hoặc không mạch lạc' },
      { key: 'C', en: 'Model stops training', vi: 'Mô hình dừng huấn luyện' },
      { key: 'D', en: 'Documents cannot be represented', vi: 'Các văn bản không thể được đại diện' },
    ],
    answer: 'B',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is a primary ethical concern when using LDA on private messages without consent?',
      vi: 'Mối quan tâm đạo đức chính khi sử dụng LDA trên các tin nhắn riêng tư mà không có sự đồng ý là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Overfitting', vi: 'Quá khớp (Overfitting)' },
      { key: 'B', en: 'Privacy violation and lack of informed consent', vi: 'Vi phạm quyền riêng tư và thiếu sự đồng ý có hiểu biết' },
      { key: 'C', en: 'Low topic coherence', vi: 'Độ mạch lạc chủ đề thấp' },
      { key: 'D', en: 'High computational cost', vi: 'Chi phí tính toán cao' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Which factor is most critical from an ethical standpoint when deploying LDA for user profiling?',
      vi: 'Yếu tố nào là quan trọng nhất từ góc độ đạo đức khi triển khai LDA để lập hồ sơ người dùng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Maximizing number of topics', vi: 'Tối đa hóa số lượng chủ đề' },
      { key: 'B', en: 'Minimizing perplexity', vi: 'Tối thiểu hóa perplexity' },
      { key: 'C', en: 'Ensuring transparency and user consent', vi: 'Đảm bảo tính minh bạch và sự đồng ý của người dùng' },
      { key: 'D', en: 'Increasing vocabulary size', vi: 'Tăng kích thước từ vựng' },
    ],
    answer: 'C',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'How would you modify an LDA-based system to address privacy concerns?',
      vi: 'Bạn sẽ sửa đổi một hệ thống dựa trên LDA thế nào để giải quyết các mối quan tâm về quyền riêng tư?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Increase number of topics', vi: 'Tăng số lượng chủ đề' },
      { key: 'B', en: 'Use anonymization or differential privacy techniques', vi: 'Sử dụng kỹ thuật ẩn danh hoặc quyền riêng tư vi sai' },
      { key: 'C', en: 'Remove stopwords', vi: 'Xóa các từ dừng (stopwords)' },
      { key: 'D', en: 'Reduce dataset size', vi: 'Giảm kích thước tập dữ liệu' },
    ],
    answer: 'B',
  },
]
