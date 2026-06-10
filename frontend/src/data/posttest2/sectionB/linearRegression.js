export const linearRegression = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the primary goal of Simple Linear Regression?',
      vi: 'Mục tiêu chính của Hồi quy Tuyến tính Đơn giản là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To find the best fitting curve.', vi: 'Để tìm đường cong phù hợp nhất.' },
      { key: 'B', en: 'To model the relationship between one independent variable (X) and one dependent variable (Y) using a straight line.', vi: 'Để mô hình hóa mối quan hệ giữa một biến độc lập (X) và một biến phụ thuộc (Y) bằng một đường thẳng.' },
      { key: 'C', en: 'To classify data points into discrete categories.', vi: 'Để phân loại các điểm dữ liệu vào các danh mục riêng biệt.' },
      { key: 'D', en: 'To minimize the sum of absolute errors.', vi: 'Để giảm thiểu tổng các sai số tuyệt đối.' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In the linear regression equation Y = b0 + b1*X + e, what does b1 represent?',
      vi: 'Trong phương trình hồi quy tuyến tính Y = b0 + b1*X + e, b1 đại diện cho điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The Y-intercept.', vi: 'Giao điểm với trục Y (hệ số chặn).' },
      { key: 'B', en: 'The slope of the regression line.', vi: 'Hệ số góc (độ dốc) của đường hồi quy.' },
      { key: 'C', en: 'The residual error.', vi: 'Sai số dư (residual error).' },
      { key: 'D', en: 'The expected value of Y when X is zero.', vi: 'Giá trị kỳ vọng của Y khi X bằng không.' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What is the fundamental difference between Simple Linear Regression and Multiple Linear Regression?',
      vi: 'Sự khác biệt cơ bản giữa Hồi quy Tuyến tính Đơn giản và Hồi quy Tuyến tính Đa biến là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Simple Linear Regression has continuous variables; Multiple Linear Regression has categorical variables.', vi: 'Hồi quy Tuyến tính Đơn giản có các biến liên tục; Hồi quy Tuyến tính Đa biến có các biến phân loại.' },
      { key: 'B', en: 'Simple Linear Regression uses one predictor variable; Multiple Linear Regression uses two or more predictor variables.', vi: 'Hồi quy Tuyến tính Đơn giản sử dụng một biến dự báo; Hồi quy Tuyến tính Đa biến sử dụng hai hoặc nhiều biến dự báo.' },
      { key: 'C', en: 'Multiple Linear Regression is only used for non-linear relationships.', vi: 'Hồi quy Tuyến tính Đa biến chỉ được sử dụng cho các mối quan hệ phi tuyến.' },
      { key: 'D', en: 'Simple Linear Regression cannot handle noise (e).', vi: 'Hồi quy Tuyến tính Đơn giản không thể xử lý nhiễu (e).' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Explain the meaning of a coefficient of determination (R2) value of 0.85 in a model.',
      vi: 'Giải thích ý nghĩa của giá trị hệ số xác định (R2) bằng 0.85 trong một mô hình.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '85% of the data points fall directly on the regression line.', vi: '85% các điểm dữ liệu nằm trực tiếp trên đường hồi quy.' },
      { key: 'B', en: '85% of the variance in the dependent variable (Y) is predictable from the independent variable (X).', vi: '85% phương sai của biến phụ thuộc (Y) có thể dự đoán được từ biến độc lập (X).' },
      { key: 'C', en: 'The model has an 85% chance of predicting the correct value.', vi: 'Mô hình có 85% cơ hội dự đoán giá trị chính xác.' },
      { key: 'D', en: 'The correlation between X and Y is 0.85.', vi: 'Mối tương quan giữa X và Y là 0.85.' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'A model predicts house price (Y) based on square footage (X) with the equation Price = 50,000 + 100 * SqFt. If a house is 2,000 SqFt, what is the predicted price?',
      vi: 'Một mô hình dự đoán giá nhà (Y) dựa trên diện tích (X) với phương trình Price = 50,000 + 100 * SqFt. Nếu một ngôi nhà rộng 2,000 SqFt, giá dự đoán là bao nhiêu?',
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
      en: 'Which loss function is most commonly minimized during the training of a standard Linear Regression model using the Ordinary Least Squares (OLS) method?',
      vi: 'Hàm mất mát nào thường được cực tiểu hóa nhất trong quá trình huấn luyện mô hình Hồi quy Tuyến tính tiêu chuẩn bằng phương pháp Bình phương tối thiểu thông thường (OLS)?',
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
      en: 'When performing residual analysis, if you observe a distinct pattern (e.g., a parabolic shape) in the plot of residuals versus fitted values, what does this indicate about the linear regression model?',
      vi: 'Khi thực hiện phân tích phần dư, nếu bạn quan sát thấy một mẫu rõ rệt (ví dụ: hình parabol) trong biểu đồ phần dư so với giá trị khớp (fitted values), điều này cho thấy điều gì về mô hình hồi quy tuyến tính?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The model is highly accurate.', vi: 'Mô hình có độ chính xác cao.' },
      { key: 'B', en: 'The assumption of linearity has been violated.', vi: 'Giả định về tính tuyến tính đã bị vi phạm.' },
      { key: 'C', en: 'The data is perfectly correlated.', vi: 'Dữ liệu tương quan hoàn hảo.' },
      { key: 'D', en: 'The residuals are normally distributed.', vi: 'Các phần dư được phân phối chuẩn.' },
    ],
    answer: 'B',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Why is it crucial to check for multicollinearity in Multiple Linear Regression, and what statistical measure is often used to detect it?',
      vi: 'Tại sao việc kiểm tra đa cộng tuyến trong Hồi quy Tuyến tính Đa biến lại cực kỳ quan trọng và thước đo thống kê nào thường được sử dụng để phát hiện nó?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Multicollinearity makes the model faster; VIF is used.', vi: 'Đa cộng tuyến giúp mô hình chạy nhanh hơn; VIF được sử dụng.' },
      { key: 'B', en: 'Multicollinearity inflates the standard errors of the coefficients, making them unstable; Variance Inflation Factor (VIF) is used.', vi: 'Đa cộng tuyến làm thổi phồng các sai số chuẩn của các hệ số hồi quy, khiến chúng không ổn định; Hệ số phóng đại phương sai (VIF) được sử dụng.' },
      { key: 'C', en: 'Multicollinearity is only a problem in simple regression; R-squared is used.', vi: 'Đa cộng tuyến chỉ là vấn đề trong hồi quy đơn giản; R-squared được sử dụng.' },
      { key: 'D', en: 'Multicollinearity implies a perfect fit; ANOVA is used.', vi: 'Đa cộng tuyến ngụ ý sự khớp hoàn hảo; ANOVA được sử dụng.' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Evaluate the trade-off between using a high-degree polynomial regression model (which perfectly fits the training data) versus a simple linear regression model for future prediction. Which model is generally preferred for generalization, and why?',
      vi: 'Đánh giá sự đánh đổi giữa việc sử dụng mô hình hồi quy đa thức bậc cao (khớp hoàn hảo với dữ liệu huấn luyện) so với mô hình hồi quy tuyến tính đơn giản cho việc dự đoán trong tương lai. Mô hình nào thường được ưu tiên hơn để khái quát hóa (generalization) và tại sao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The simple linear regression model, because the polynomial model is prone to overfitting and will perform poorly on new, unseen data.', vi: 'Mô hình hồi quy tuyến tính đơn giản, vì mô hình đa thức dễ bị quá khớp (overfitting) và sẽ hoạt động kém trên dữ liệu mới chưa từng thấy.' },
      { key: 'B', en: 'The polynomial model, because a perfect fit on the training data guarantees high accuracy everywhere.', vi: 'Mô hình đa thức, vì sự khớp hoàn hảo trên dữ liệu huấn luyện đảm bảo độ chính xác cao ở mọi nơi.' },
      { key: 'C', en: 'The choice depends only on the R-squared value, not on generalization.', vi: 'Sự lựa chọn chỉ phụ thuộc vào giá trị R-squared, không phụ thuộc vào khả năng khái quát hóa.' },
      { key: 'D', en: 'Both models generalize poorly; only non-parametric models should be used.', vi: 'Cả hai mô hình đều khái quát hóa kém; chỉ nên sử dụng các mô hình phi tham số.' },
    ],
    answer: 'A',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Propose a hypothetical feature transformation (e.g., squaring, logging) for the independent variable X in a dataset where the relationship between X and Y is initially exponential, and briefly explain why this transformation is necessary for Linear Regression.',
      vi: 'Đề xuất một phép biến đổi đặc trưng giả định (ví dụ: bình phương, lấy log) cho biến độc lập X trong một tập dữ liệu nơi mối quan hệ giữa X và Y ban đầu là hàm mũ, và giải thích ngắn gọn tại sao phép biến đổi này là cần thiết cho Hồi quy Tuyến tính.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Transform X to log(X). This is necessary because Linear Regression assumes a linear relationship, and the logarithmic transformation effectively linearizes the initial exponential relationship.', vi: 'Biến đổi X thành log(X). Điều này là cần thiết vì Hồi quy Tuyến tính giả định mối quan hệ tuyến tính, và phép biến đổi logarit giúp tuyến tính hóa mối quan hệ hàm mũ ban đầu một cách hiệu quả.' },
      { key: 'B', en: 'Transform X to X^2. This is necessary to satisfy the normality assumption of the errors.', vi: 'Biến đổi X thành X^2. Điều này là cần thiết để thỏa mãn giả định phân phối chuẩn của các sai số.' },
      { key: 'C', en: 'Transform Y to Y^-1. This is necessary to deal with heteroscedasticity.', vi: 'Biến đổi Y thành Y^-1. Điều này là cần thiết để xử lý phương sai sai số không đồng nhất.' },
      { key: 'D', en: 'No transformation is necessary; Linear Regression can handle exponential relationships directly.', vi: 'Không cần phép biến đổi nào; Hồi quy Tuyến tính có thể xử lý trực tiếp mối quan hệ hàm mũ.' },
    ],
    answer: 'A',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The Eco-Routing system estimates the Estimated Time of Arrival (ETA, in minutes, Y) based on Distance (km, X) using the Simple Linear Regression model: Y = 3 + 1.8 * X. If an AEV has a distance of 15 km to cover, what is the predicted ETA?',
      vi: 'Hệ thống Eco-Routing ước tính Thời gian đến dự kiến (ETA, tính bằng phút, Y) dựa trên Khoảng cách (km, X) bằng mô hình Hồi quy Tuyến tính Đơn giản: Y = 3 + 1.8 * X. Nếu một AEV có khoảng cách 15 km cần đi, ETA dự đoán là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '27 minutes', vi: '27 phút' },
      { key: 'B', en: '32 minutes', vi: '32 phút' },
      { key: 'C', en: '30 minutes', vi: '30 phút' },
      { key: 'D', en: '25.8 minutes', vi: '25.8 phút' },
    ],
    answer: 'C',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'A Multiple Linear Regression (MLR) model predicts the AEV\'s Energy Consumption (Y, kWh) based on Motor Temperature (X1) and Average Speed (X2). If the coefficient beta 1 (for Motor Temperature) is 0.05, assuming all other factors remain constant, what is the statistical meaning of this finding?',
      vi: 'Một mô hình Hồi quy Tuyến tính Đa biến (MLR) dự đoán Lượng tiêu thụ năng lượng của AEV (Y, kWh) dựa trên Nhiệt độ động cơ (X1) và Tốc độ trung bình (X2). Nếu hệ số beta 1 (cho Nhiệt độ động cơ) là 0.05, giả sử các yếu tố khác không đổi, ý nghĩa thống kê của kết quả này là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Motor Temperature has no relationship with Energy Consumption.', vi: 'Nhiệt độ động cơ không có mối quan hệ với Tiêu thụ năng lượng.' },
      { key: 'B', en: 'A 1-unit increase in Motor Temperature increases the log-odds of Energy Consumption by 0.05.', vi: 'Tăng 1 đơn vị Nhiệt độ động cơ làm tăng log-odds của Tiêu thụ năng lượng thêm 0.05.' },
      { key: 'C', en: 'When the Motor Temperature increases by 1°C, the average Energy Consumption is expected to increase by 0.05 kWh.', vi: 'Khi Nhiệt độ động cơ tăng thêm 1°C, Tiêu thụ năng lượng trung bình dự kiến sẽ tăng thêm 0.05 kWh.' },
      { key: 'D', en: '5% of the variation in Energy Consumption is explained by Motor Temperature.', vi: '5% sự biến động của Tiêu thụ năng lượng được giải thích bởi Nhiệt độ động cơ.' },
    ],
    answer: 'C',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Eco-Routing engineers observe that two input variables for the prediction model (Delay Time X1 and Traffic Level X2, both derived from the IoT Sensor Grid) are nearly perfectly correlated (r > 0.95). What severe statistical problem occurs when running Multiple Linear Regression (MLR) with these two variables?',
      vi: 'Các kỹ sư Eco-Routing quan sát thấy hai biến đầu vào cho mô hình dự đoán (Thời gian trễ X1 và Mức độ giao thông X2, đều từ lưới cảm biến IoT) gần như tương quan hoàn hảo (r > 0.95). Vấn đề thống kê nghiêm trọng nào xảy ra khi chạy Hồi quy Tuyến tính Đa biến (MLR) với hai biến này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Autocorrelation in the time series.', vi: 'Tự tương quan trong chuỗi thời gian.' },
      { key: 'B', en: 'Multicollinearity, which causes the regression coefficients (beta) to become unstable and difficult to interpret.', vi: 'Đa cộng tuyến (Multicollinearity), khiến các hệ số hồi quy (beta) trở nên không ổn định và khó diễn giải.' },
      { key: 'C', en: 'Heteroscedasticity, indicating that the error variance is non-constant.', vi: 'Phương sai sai số thay đổi (Heteroscedasticity), cho biết phương sai sai số không hằng số.' },
      { key: 'D', en: 'The slope of the model will always be zero.', vi: 'Độ dốc của mô hình sẽ luôn bằng không.' },
    ],
    answer: 'B',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'An MLR model predicting customer satisfaction (Y, scale 1-5) has a very high Coefficient of Determination (R2 = 0.92). However, upon inspecting the Residual Plot, the residual points form a distinct U-shape (parabolic pattern). Which evaluation is correct?',
      vi: 'Một mô hình MLR dự đoán mức độ hài lòng của khách hàng (Y, thang điểm 1-5) có Hệ số xác định rất cao (R2 = 0.92). Tuy nhiên, khi kiểm tra Biểu đồ phần dư, các điểm phần dư tạo thành hình chữ U rõ rệt (dạng parabol). Đánh giá nào sau đây là đúng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The model is perfect because R2 is high, and the U-shape is just random noise.', vi: 'Mô hình hoàn hảo vì R2 cao, và hình chữ U chỉ là nhiễu ngẫu nhiên.' },
      { key: 'B', en: 'The assumption of homoscedasticity is violated, requiring the use of Weighted Least Squares.', vi: 'Giả định về phương sai đồng nhất bị vi phạm, đòi hỏi phải sử dụng phương pháp Bình phương tối thiểu có trọng số.' },
      { key: 'C', en: 'The assumption of linearity is violated; the model is missing a non-linear relationship (e.g., quadratic) between the independent and dependent variables, requiring feature transformation.', vi: 'Giả định về tính tuyến tính bị vi phạm; mô hình đang bỏ sót một mối quan hệ phi tuyến (ví dụ: bậc hai) giữa biến độc lập và phụ thuộc, đòi hỏi phải biến đổi đặc trưng.' },
      { key: 'D', en: 'The model is Underfitting (lack of complexity), requiring a reduction in the number of input variables.', vi: 'Mô hình bị Thiếu khớp (Underfitting), đòi hỏi phải giảm số lượng biến đầu vào.' },
    ],
    answer: 'C',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Data from the IoT Sensor Grid shows that the relationship between Distance Traveled (X) and Remaining Battery Capacity (Y) is non-linear, where the rate of battery depletion slows down as distance increases (diminishing returns). To enable the use of standard Linear Regression, propose a common transformation for the independent variable X.',
      vi: 'Dữ liệu từ lưới cảm biến IoT cho thấy mối quan hệ giữa Quãng đường đã đi (X) và Dung lượng pin còn lại (Y) là phi tuyến tính, trong đó tốc độ tiêu hao pin chậm lại khi quãng đường tăng lên. Để cho phép sử dụng Hồi quy Tuyến tính tiêu chuẩn, hãy đề xuất một phép biến đổi phổ biến cho biến độc lập X.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Transform X to X^2 (Quadratic transformation).', vi: 'Biến đổi X thành X^2 (Biến đổi bậc hai).' },
      { key: 'B', en: 'Transform Y to log(Y) (Logarithmic transformation for the dependent variable).', vi: 'Biến đổi Y thành log(Y) (Biến đổi logarit cho biến phụ thuộc).' },
      { key: 'C', en: 'Transform X to log(X) (Logarithmic transformation for the independent variable).', vi: 'Biến đổi X thành log(X) (Biến đổi logarit cho biến độc lập).' },
      { key: 'D', en: 'No transformation is needed because Linear Regression can handle non-linear relationships.', vi: 'Không cần biến đổi vì Hồi quy Tuyến tính có thể xử lý trực tiếp các mối quan hệ phi tuyến.' },
    ],
    answer: 'C',
  },
]
