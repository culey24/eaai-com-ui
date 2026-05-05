export const logisticRegression = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the primary difference between Linear and Logistic Regression regarding the dependent variable (Y)?',
      vi: 'Sự khác biệt chính giữa Hồi quy tuyến tính và Hồi quy Logistic về biến phụ thuộc (Y) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Linear predicts continuous; Logistic predicts probabilities for binary outcomes', vi: 'Tuyến tính dự đoán giá trị liên tục; Logistic dự đoán xác suất cho các kết quả nhị phân' },
      { key: 'B', en: 'Linear uses categorical; Logistic uses continuous', vi: 'Tuyến tính dùng biến phân loại; Logistic dùng biến liên tục' },
      { key: 'C', en: 'Both predict continuous but use different optimization', vi: 'Cả hai đều dự đoán giá trị liên tục nhưng dùng tối ưu hóa khác nhau' },
      { key: 'D', en: 'Logistic cannot handle multiple inputs', vi: 'Logistic không thể xử lý nhiều đầu vào' },
    ],
    answer: 'A',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which function is applied in Logistic Regression to map the output into a probability range between 0 and 1?',
      vi: 'Hàm nào được áp dụng trong Hồi quy Logistic để ánh xạ đầu ra vào khoảng xác suất từ 0 đến 1?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'ReLU', vi: 'ReLU' },
      { key: 'B', en: 'Softmax', vi: 'Softmax' },
      { key: 'C', en: 'Sigmoid', vi: 'Sigmoid' },
      { key: 'D', en: 'Tanh', vi: 'Tanh' },
    ],
    answer: 'C',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why does Logistic Regression use the Sigmoid function instead of directly using the linear equation?',
      vi: 'Tại sao Hồi quy Logistic sử dụng hàm Sigmoid thay vì sử dụng trực tiếp phương trình tuyến tính?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To ensure outcome is non-negative', vi: 'Để đảm bảo kết quả không âm' },
      { key: 'B', en: 'To transform output into a valid probability (0 to 1)', vi: 'Để chuyển đổi đầu ra thành một xác suất hợp lệ (từ 0 đến 1)' },
      { key: 'C', en: 'To minimize MSE', vi: 'Để tối thiểu hóa MSE' },
      { key: 'D', en: 'To correct for multicollinearity', vi: 'Để điều chỉnh đa cộng tuyến' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'In Logistic Regression, what is the formula for the log-odds (logit)?',
      vi: 'Trong Hồi quy Logistic, công thức cho log-odds (logit) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'ln(p / (1-p))', vi: 'ln(p / (1-p))' },
      { key: 'B', en: 'p + (1 - p)', vi: 'p + (1 - p)' },
      { key: 'C', en: '1/p', vi: '1/p' },
      { key: 'D', en: 'e^p', vi: 'e^p' },
    ],
    answer: 'A',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If a Logistic Regression model provides a log-odds value of 0, what is the probability (p)?',
      vi: 'Nếu mô hình Hồi quy Logistic đưa ra giá trị log-odds bằng 0, xác suất (p) là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '0', vi: '0' },
      { key: 'B', en: '0.5', vi: '0.5' },
      { key: 'C', en: '1', vi: '1' },
      { key: 'D', en: '0.731', vi: '0.731' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Which cost function is typically minimized for Logistic Regression?',
      vi: 'Hàm chi phí nào thường được tối thiểu hóa cho Hồi quy Logistic?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mean Squared Error (MSE)', vi: 'Sai số bình phương trung bình (MSE)' },
      { key: 'B', en: 'R-squared', vi: 'R-squared' },
      { key: 'C', en: 'Cross-Entropy Loss (or Log Loss)', vi: 'Cross-Entropy Loss (hoặc Log Loss)' },
      { key: 'D', en: 'Sum of Absolute Errors', vi: 'Tổng sai số tuyệt đối' },
    ],
    answer: 'C',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'How should a coefficient β be interpreted in Logistic Regression?',
      vi: 'Hệ số β nên được giải thích thế nào trong Hồi quy Logistic?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'One-unit increase in X increases p by β', vi: 'Tăng X một đơn vị làm tăng p thêm β' },
      { key: 'B', en: 'One-unit increase in X increases Y by β', vi: 'Tăng X một đơn vị làm tăng Y thêm β' },
      { key: 'C', en: 'One-unit increase in X increases log-odds of positive class by β', vi: 'Tăng X một đơn vị làm tăng log-odds của lớp dương tính thêm β' },
      { key: 'D', en: 'One-unit increase in X decreases residual by β', vi: 'Tăng X một đơn vị làm giảm phần dư thêm β' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'If data points are perfectly separated by a linear boundary, what happens to unregularized coefficients?',
      vi: 'Nếu các điểm dữ liệu được phân tách hoàn hảo bởi một ranh giới tuyến tính, điều gì xảy ra với các hệ số không có chính quy hóa?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Model converges immediately', vi: 'Mô hình hội tụ ngay lập tức' },
      { key: 'B', en: 'Coefficients approach infinity', vi: 'Các hệ số tiến tới vô cùng' },
      { key: 'C', en: 'Loss becomes zero, halting training', vi: 'Mất mát bằng không, dừng huấn luyện' },
      { key: 'D', en: 'Sigmoid outputs only 0s', vi: 'Sigmoid chỉ xuất ra 0' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'In predicting machine failure, which metric should be prioritized?',
      vi: 'Trong việc dự đoán hỏng máy, chỉ số nào nên được ưu tiên?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Precision, to minimize False Positives', vi: 'Độ chính xác (Precision), để giảm thiểu Dương tính giả' },
      { key: 'B', en: 'Recall, to minimize False Negatives (missed failures)', vi: 'Độ triệu hồi (Recall), để giảm thiểu Âm tính giả (bỏ sót hỏng hóc)' },
      { key: 'C', en: 'Accuracy', vi: 'Độ chính xác tổng thể' },
      { key: 'D', en: 'F1 Score', vi: 'F1 Score' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'How to adapt Binary Logistic Regression for three or more mutually exclusive classes?',
      vi: 'Làm thế nào để điều chỉnh Hồi quy Logistic nhị phân cho ba hoặc nhiều lớp loại trừ lẫn nhau?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Use Kernel Trick', vi: 'Sử dụng Kernel Trick' },
      { key: 'B', en: 'Use Simple Linear Regression for each class', vi: 'Sử dụng Hồi quy tuyến tính đơn giản cho mỗi lớp' },
      { key: 'C', en: 'Use Multinomial Logistic Regression (Softmax) or One-vs-Rest', vi: 'Sử dụng Hồi quy Logistic đa thức (Softmax) hoặc One-vs-Rest' },
      { key: 'D', en: 'Use Sigmoid multiple times on same output', vi: 'Sử dụng Sigmoid nhiều lần trên cùng một đầu ra' },
    ],
    answer: 'C',
  },
]
