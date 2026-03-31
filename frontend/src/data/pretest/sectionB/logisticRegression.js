import { mcq3, txt } from './common.js'

export const logisticRegression = [
  mcq3(
    'Remembering',
    'Primary difference: Linear vs Logistic Regression for Y?',
    'Khác biệt chính giữa hồi quy tuyến tính và logistic với biến phụ thuộc Y?',
    {
      en: 'Linear predicts continuous; Logistic predicts probabilities for binary outcomes.',
      vi: 'Tuyến tính dự đoán liên tục; Logistic xác suất cho nhị phân.',
    },
    {
      en: 'Linear uses categorical inputs; Logistic continuous only.',
      vi: 'Tuyến tính chỉ đầu vào phân loại; Logistic chỉ liên tục.',
    },
    { en: 'Both predict continuous Y.', vi: 'Cả hai đều dự đoán Y liên tục.' }
  ),
  mcq3(
    'Remembering',
    'Function mapping linear output to probability in [0,1]?',
    'Hàm ánh xạ đầu ra tuyến tính sang xác suất trong [0,1]?',
    { en: 'ReLU', vi: 'ReLU' },
    { en: 'Softmax', vi: 'Softmax' },
    { en: 'Sigmoid', vi: 'Sigmoid' }
  ),
  mcq3(
    'Understanding',
    'Why Sigmoid instead of raw linear Y = β0 + β1X + ε in Logistic Regression?',
    'Vì sao dùng sigmoid thay cho phương trình tuyến tính thô?',
    { en: 'To ensure non-negative predictions.', vi: 'Đảm bảo dự đoán không âm.' },
    {
      en: 'To get valid probabilities in (0,1).',
      vi: 'Để có xác suất hợp lệ trong (0,1).',
    },
    { en: 'To minimize MSE.', vi: 'Để tối thiểu MSE.' }
  ),
  mcq3(
    'Understanding',
    'Formula for log-odds (logit) of success p?',
    'Công thức log-odds (logit) của xác suất thành công p?',
    { en: 'ln(p/(1-p))', vi: 'ln(p/(1-p))' },
    { en: 'p + (1-p)', vi: 'p + (1-p)' },
    { en: '1/p', vi: '1/p' }
  ),
  mcq3(
    'Applying',
    'Logit = 0 for a customer. Probability p of positive class?',
    'Logit = 0 cho một khách. Xác suất lớp dương p?',
    { en: '0', vi: '0' },
    { en: '0.5', vi: '0,5' },
    { en: '1', vi: '1' }
  ),
  mcq3(
    'Applying',
    'Typical cost minimized when training Logistic Regression?',
    'Hàm chi phí thường tối thiểu khi huấn luyện logistic?',
    { en: 'MSE', vi: 'MSE' },
    { en: 'R-squared', vi: 'R²' },
    { en: 'Cross-Entropy / Log Loss', vi: 'Cross-entropy / log loss' }
  ),
  mcq3(
    'Analyzing',
    'Interpret coefficient β in Logistic Regression.',
    'Diễn giải hệ số β trong hồi quy logistic.',
    {
      en: 'One-unit increase in X increases p by β.',
      vi: 'Tăng 1 đơn vị X làm p tăng β.',
    },
    {
      en: 'One-unit increase in X increases Y by β.',
      vi: 'Tăng 1 đơn vị X làm Y tăng β.',
    },
    {
      en: 'One-unit increase in X increases log-odds by β.',
      vi: 'Tăng 1 đơn vị X làm log-odds tăng β.',
    }
  ),
  mcq3(
    'Analyzing',
    'Perfect linear separability: why can unregularized Logistic Regression have numerical issues?',
    'Tách tuyến tính hoàn hảo: vì sao logistic không chuẩn hóa có vấn đề số học?',
    {
      en: 'Coefficients approach infinity (complete separation).',
      vi: 'Hệ số tiến tới vô cực (tách hoàn toàn).',
    },
    { en: 'Model converges immediately.', vi: 'Mô hình hội tụ ngay.' },
    { en: 'Loss becomes zero and stops.', vi: 'Mất mát bằng 0 và dừng.' }
  ),
  txt(
    'Evaluating',
    'Machine failure prediction: prioritize Precision (few false alarms) or Recall (catch failures)? Why?',
    'Dự đoán hỏng máy: ưu tiên Precision hay Recall? Vì sao?',
    'English.',
    'Vi tùy chọn.'
  ),
  txt(
    'Creating',
    'Propose how to extend binary Logistic Regression to 3+ mutually exclusive classes.',
    'Đề xuất cách mở rộng logistic nhị phân sang 3+ lớp loại trừ lẫn nhau.',
    'E.g. multinomial / softmax / one-vs-rest.',
    'Tiếng Anh chính.'
  ),
]
