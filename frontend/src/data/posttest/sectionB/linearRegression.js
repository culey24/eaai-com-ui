export const linearRegression = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the primary goal of Simple Linear Regression?',
      vi: 'Mục tiêu chính của Hồi quy tuyến tính đơn giản là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To find the best fitting curve', vi: 'Tìm đường cong khớp nhất' },
      { key: 'B', en: 'To model the relationship between one independent and one dependent variable using a straight line', vi: 'Mô hình hóa mối quan hệ giữa một biến độc lập và một biến phụ thuộc bằng một đường thẳng' },
      { key: 'C', en: 'To classify data points', vi: 'Phân loại các điểm dữ liệu' },
      { key: 'D', en: 'To minimize absolute errors', vi: 'Tối thiểu hóa sai số tuyệt đối' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In the equation Y = β0 + β1X + ϵ, what does ϵ represent?',
      vi: 'Trong phương trình Y = β0 + β1X + ϵ, ϵ đại diện cho cái gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The Y-intercept', vi: 'Điểm cắt trục Y' },
      { key: 'B', en: 'The slope', vi: 'Hệ số góc' },
      { key: 'C', en: 'The residual error', vi: 'Sai số dư' },
      { key: 'D', en: 'The expected value of Y when X is zero', vi: 'Giá trị kỳ vọng của Y khi X bằng không' },
    ],
    answer: 'C',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the fundamental difference between Simple and Multiple Linear Regression?',
      vi: 'Sự khác biệt cơ bản giữa Hồi quy tuyến tính đơn và đa biến là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Simple has continuous variables; Multiple has categorical', vi: 'Đơn biến có biến liên tục; đa biến có biến phân loại' },
      { key: 'B', en: 'Simple uses one predictor; Multiple uses two or more', vi: 'Đơn biến dùng một biến dự báo; đa biến dùng hai hoặc nhiều hơn' },
      { key: 'C', en: 'Multiple is only for non-linear', vi: 'Đa biến chỉ dành cho phi tuyến' },
      { key: 'D', en: 'Simple cannot handle noise', vi: 'Đơn biến không thể xử lý nhiễu' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Explain the meaning of an R-squared value of 0.85 in a model.',
      vi: 'Giải thích ý nghĩa của giá trị R-squared bằng 0.85 trong một mô hình.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '85% of points fall on the line', vi: '85% các điểm nằm trên đường thẳng' },
      { key: 'B', en: '85% of variance in Y is predictable from X', vi: '85% sự biến động của biến phụ thuộc (Y) có thể dự đoán được từ biến độc lập (X)' },
      { key: 'C', en: '85% chance of correct prediction', vi: '85% cơ hội dự đoán đúng' },
      { key: 'D', en: 'Correlation is 0.85', vi: 'Tương quan là 0.85' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Model Price = 50,000 + 100 * SqFt. If a house is 2,000 SqFt, what is the predicted price?',
      vi: 'Mô hình Giá = 50,000 + 100 * Diện_tích. Nếu một ngôi nhà có diện tích 2,000, giá dự đoán là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '$250,000', vi: '$250,000' },
      { key: 'B', en: '$200,000', vi: '$200,000' },
      { key: 'C', en: '$150,000', vi: '$150,000' },
      { key: 'D', en: '$100,000', vi: '$100,000' },
    ],
    answer: 'A',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Which loss function is most commonly minimized using Ordinary Least Squares (OLS)?',
      vi: 'Hàm mất mát nào thường được tối thiểu hóa nhất khi sử dụng phương pháp Bình phương tối thiểu thông thường (OLS)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mean Absolute Error (MAE)', vi: 'Sai số tuyệt đối trung bình (MAE)' },
      { key: 'B', en: 'Binary Cross-Entropy', vi: 'Binary Cross-Entropy' },
      { key: 'C', en: 'Mean Squared Error (MSE)', vi: 'Sai số bình phương trung bình (MSE)' },
      { key: 'D', en: 'Log Loss', vi: 'Log Loss' },
    ],
    answer: 'C',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'If you observe a parabolic shape in residual plot, what does it indicate?',
      vi: 'Nếu bạn quan sát thấy hình parabol trong biểu đồ phần dư, nó cho thấy điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Model is accurate', vi: 'Mô hình chính xác' },
      { key: 'B', en: 'Assumption of linearity has been violated', vi: 'Giả định về tính tuyến tính đã bị vi phạm' },
      { key: 'C', en: 'Data is perfectly correlated', vi: 'Dữ liệu tương quan hoàn hảo' },
      { key: 'D', en: 'Residuals are normal', vi: 'Phần dư phân phối chuẩn' },
    ],
    answer: 'B',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Why check for multicollinearity in Multiple Linear Regression?',
      vi: 'Tại sao cần kiểm tra đa cộng tuyến trong Hồi quy tuyến tính đa biến?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Makes model faster', vi: 'Làm mô hình nhanh hơn' },
      { key: 'B', en: 'Inflates standard errors, making coefficients unstable', vi: 'Làm tăng sai số chuẩn, khiến các hệ số không ổn định' },
      { key: 'C', en: 'Only a problem in simple regression', vi: 'Chỉ là vấn đề trong hồi quy đơn biến' },
      { key: 'D', en: 'Implies perfect fit', vi: 'Ngụ ý sự khớp hoàn hảo' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'High-degree polynomial versus simple linear model for future prediction: which generalize better?',
      vi: 'Mô hình đa thức bậc cao so với mô hình tuyến tính đơn giản để dự đoán tương lai: cái nào tổng quát hóa tốt hơn?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Simple linear model, because polynomial is prone to overfitting', vi: 'Mô hình tuyến tính đơn giản, vì đa thức dễ bị quá khớp (overfitting)' },
      { key: 'B', en: 'Polynomial, because perfect training fit guarantees accuracy', vi: 'Đa thức, vì sự khớp hoàn hảo trên tập huấn luyện đảm bảo độ chính xác' },
      { key: 'C', en: 'Choice depends only on R-squared', vi: 'Lựa chọn chỉ phụ thuộc vào R-squared' },
      { key: 'D', en: 'Both generalize poorly', vi: 'Cả hai đều tổng quát hóa kém' },
    ],
    answer: 'A',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Propose a transformation for X when the relationship is exponential.',
      vi: 'Đề xuất một phép biến đổi cho X khi mối quan hệ là hàm mũ.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Transform X to log(X) to linearize the relationship', vi: 'Biến đổi X thành log(X) để tuyến tính hóa mối quan hệ' },
      { key: 'B', en: 'Transform X to X^2', vi: 'Biến đổi X thành X^2' },
      { key: 'C', en: 'Transform Y to Y^-1', vi: 'Biến đổi Y thành Y^-1' },
      { key: 'D', en: 'No transformation necessary', vi: 'Không cần biến đổi' },
    ],
    answer: 'A',
  },
]
