import { mcq3, txt } from './common.js'

export const linearRegression = [
  mcq3(
    'Remembering',
    'Primary goal of Simple Linear Regression?',
    'Mục tiêu chính của hồi quy tuyến tính đơn?',
    { en: 'Find the best fitting curve.', vi: 'Tìm đường cong khớp nhất.' },
    {
      en: 'Model relationship between one X and one Y with a straight line.',
      vi: 'Mô hình quan hệ một X và một Y bằng đường thẳng.',
    },
    { en: 'Classify into discrete categories.', vi: 'Phân loại rời rạc.' }
  ),
  mcq3(
    'Remembering',
    'In Y = β0 + β1X + ε, β1 represents:',
    'Trong Y = β0 + β1X + ε, β1 là:',
    { en: 'Y-intercept', vi: 'Giao điểm trục Y' },
    { en: 'Slope of the regression line', vi: 'Hệ số dốc của đường hồi quy' },
    { en: 'Residual error', vi: 'Sai số phần dư' }
  ),
  mcq3(
    'Understanding',
    'Meaning of R² = 0.85?',
    'Ý nghĩa R² = 0,85?',
    { en: '85% of points lie on the line.', vi: '85% điểm nằm trên đường.' },
    {
      en: '85% of variance in Y is explained by X.',
      vi: '85% phương sai của Y được giải thích bởi X.',
    },
    { en: '85% chance of correct prediction.', vi: '85% xác suất dự đoán đúng.' }
  ),
  mcq3(
    'Understanding',
    'Difference between Simple and Multiple Linear Regression?',
    'Khác nhau giữa hồi quy tuyến tính đơn và bội?',
    {
      en: 'Simple: continuous X; Multiple: categorical X.',
      vi: 'Đơn: X liên tục; Bội: X phân loại.',
    },
    {
      en: 'Simple: one predictor; Multiple: two or more predictors.',
      vi: 'Đơn: một biến dự báo; Bội: hai biến trở lên.',
    },
    {
      en: 'Multiple is only for non-linear relationships.',
      vi: 'Bội chỉ cho quan hệ phi tuyến.',
    }
  ),
  mcq3(
    'Applying',
    'Price = 50,000 + 100·SqFt. Predicted price for 2,000 SqFt?',
    'Price = 50.000 + 100·SqFt. Giá dự đoán cho 2.000 SqFt?',
    { en: '$250,000', vi: '250.000 USD' },
    { en: '$200,000', vi: '200.000 USD' },
    { en: '$150,000', vi: '150.000 USD' }
  ),
  mcq3(
    'Applying',
    'Most common loss minimized for standard linear regression training?',
    'Hàm mất mát thường tối thiểu hóa khi huấn luyện hồi quy tuyến tính chuẩn?',
    { en: 'MAE', vi: 'MAE' },
    { en: 'Binary Cross-Entropy', vi: 'Binary cross-entropy' },
    { en: 'Mean Squared Error (MSE)', vi: 'MSE' }
  ),
  mcq3(
    'Analyzing',
    'Residuals vs fitted values show a parabolic pattern. What does it indicate?',
    'Phần dư vs giá trị khớp có hình parabol. Điều này cho thấy:',
    { en: 'Model is highly accurate.', vi: 'Mô hình rất chính xác.' },
    { en: 'Linearity assumption is violated.', vi: 'Giả định tuyến tính bị vi phạm.' },
    { en: 'Data is perfectly correlated.', vi: 'Dữ liệu tương quan hoàn hảo.' }
  ),
  mcq3(
    'Analyzing',
    'Why check multicollinearity in Multiple LR? Common measure?',
    'Vì sao kiểm tra đa cộng tuyến trong hồi quy bội? Độ đo thường dùng?',
    {
      en: 'Multicollinearity makes model faster; use VIF.',
      vi: 'Đa cộng tuyến làm mô hình nhanh; dùng VIF.',
    },
    {
      en: 'It inflates SE of coefficients; use VIF.',
      vi: 'Làm phồng SE hệ số; dùng VIF.',
    },
    {
      en: 'Only a problem in simple regression; use R².',
      vi: 'Chỉ với hồi quy đơn; dùng R².',
    }
  ),
  txt(
    'Evaluating',
    'Trade-off: high-degree polynomial (perfect train fit) vs simple linear for future prediction—which generalizes better and why?',
    'Đánh giá đánh đổi: đa thức bậc cao (khớp tập huấn luyện) vs hồi quy tuyến tính đơn cho dự báo tương lai.',
    'English primary.',
    'Tiếng Việt tùy chọn.'
  ),
  txt(
    'Creating',
    'Propose a feature transform (e.g., log) when X–Y is exponential; explain for linear regression.',
    'Đề xuất biến đổi đặc trưng (vd. log) khi quan hệ X–Y mũ; giải thích cho hồi quy tuyến tính.',
    'English.',
    'Song ngữ ngắn được.'
  ),
]
