export const deepNeuralNetworks = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What defines a deep neural network?',
      vi: 'Cái gì định nghĩa một mạng nơ-ron sâu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Large dataset', vi: 'Tập dữ liệu lớn' },
      { key: 'B', en: 'Multiple hidden layers', vi: 'Nhiều lớp ẩn' },
      { key: 'C', en: 'High accuracy', vi: 'Độ chính xác cao' },
      { key: 'D', en: 'Large input size', vi: 'Kích thước đầu vào lớn' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which activation function is widely used in modern DNNs?',
      vi: 'Hàm kích hoạt nào được sử dụng rộng rãi trong các DNN hiện đại?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Sigmoid', vi: 'Sigmoid' },
      { key: 'B', en: 'ReLU', vi: 'ReLU' },
      { key: 'C', en: 'Tanh', vi: 'Tanh' },
      { key: 'D', en: 'Step', vi: 'Step' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why are non-linear activation functions important?',
      vi: 'Tại sao các hàm kích hoạt phi tuyến lại quan trọng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Reduce training time', vi: 'Giảm thời gian huấn luyện' },
      { key: 'B', en: 'Enable learning complex patterns', vi: 'Cho phép học các mẫu phức tạp' },
      { key: 'C', en: 'Normalize data', vi: 'Chuẩn hóa dữ liệu' },
      { key: 'D', en: 'Prevent overfitting', vi: 'Ngăn chặn quá khớp' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the purpose of backpropagation?',
      vi: 'Mục đích của lan truyền ngược (backpropagation) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Initialize weights', vi: 'Khởi tạo trọng số' },
      { key: 'B', en: 'Update weights using gradients', vi: 'Cập nhật trọng số bằng cách sử dụng gradient' },
      { key: 'C', en: 'Normalize inputs', vi: 'Chuẩn hóa đầu vào' },
      { key: 'D', en: 'Reduce dataset size', vi: 'Giảm kích thước tập dữ liệu' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'What is computed before activation in a neuron?',
      vi: 'Cái gì được tính toán trước khi kích hoạt trong một nơ-ron?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'x1 + x2', vi: 'x1 + x2' },
      { key: 'B', en: 'w1 + w2', vi: 'w1 + w2' },
      { key: 'C', en: 'Weighted sum + bias', vi: 'Tổng trọng số + độ lệch (bias)' },
      { key: 'D', en: 'x1*x2', vi: 'x1*x2' },
    ],
    answer: 'C',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'What happens if learning rate is too high?',
      vi: 'Điều gì xảy ra nếu tốc độ học quá cao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Slow training', vi: 'Huấn luyện chậm' },
      { key: 'B', en: 'Better accuracy', vi: 'Độ chính xác tốt hơn' },
      { key: 'C', en: 'Divergence of loss', vi: 'Sự phân kỳ của mất mát (loss)' },
      { key: 'D', en: 'No effect', vi: 'Không có hiệu ứng' },
    ],
    answer: 'C',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is the vanishing gradient problem?',
      vi: 'Vấn đề triệt tiêu gradient (vanishing gradient) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Gradients explode', vi: 'Gradient bùng nổ' },
      { key: 'B', en: 'Gradients approach zero in deep layers', vi: 'Gradient tiến dần về không trong các lớp sâu' },
      { key: 'C', en: 'Loss becomes zero', vi: 'Mất mát bằng không' },
      { key: 'D', en: 'Weights freeze completely', vi: 'Trọng số đóng băng hoàn toàn' },
    ],
    answer: 'B',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'A DNN shows lower acceptance rates for a specific demographic. What is the likely issue?',
      vi: 'Một DNN cho thấy tỷ lệ chấp nhận thấp hơn đối với một nhóm nhân khẩu học cụ thể. Vấn đề có khả năng là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Overfitting', vi: 'Quá khớp' },
      { key: 'B', en: 'Data leakage', vi: 'Rò rỉ dữ liệu' },
      { key: 'C', en: 'Algorithmic bias in training data', vi: 'Định kiến thuật toán trong dữ liệu huấn luyện' },
      { key: 'D', en: 'High variance', vi: 'Phương sai cao' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'A highly accurate DNN cannot explain its decisions. What is the main concern?',
      vi: 'Một DNN có độ chính xác cao nhưng không thể giải thích các quyết định của mình. Mối quan tâm chính là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Model size', vi: 'Kích thước mô hình' },
      { key: 'B', en: 'Training speed', vi: 'Tốc độ huấn luyện' },
      { key: 'C', en: 'Lack of interpretability and trust', vi: 'Thiếu tính diễn giải và sự tin tưởng' },
      { key: 'D', en: 'Low precision', vi: 'Độ chính xác thấp' },
    ],
    answer: 'C',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'How would you improve fairness in a DNN used for loan approval?',
      vi: 'Làm thế nào để cải thiện tính công bằng trong một DNN được sử dụng để phê duyệt khoản vay?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Increase layers', vi: 'Tăng các lớp' },
      { key: 'B', en: 'Remove sensitive attributes and apply fairness-aware training', vi: 'Loại bỏ các thuộc tính nhạy cảm và áp dụng huấn luyện nhận thức về tính công bằng' },
      { key: 'C', en: 'Increase learning rate', vi: 'Tăng tốc độ học' },
      { key: 'D', en: 'Use larger dataset only', vi: 'Chỉ sử dụng tập dữ liệu lớn hơn' },
    ],
    answer: 'B',
  },
]
