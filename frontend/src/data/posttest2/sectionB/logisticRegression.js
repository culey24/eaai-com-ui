export const logisticRegression = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the primary difference between Linear Regression and Logistic Regression regarding the dependent variable (Y)?',
      vi: 'Sự khác biệt chính giữa Hồi quy Tuyến tính và Hồi quy Logistic liên quan đến biến phụ thuộc (Y) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Linear Regression predicts continuous values; Logistic Regression predicts probabilities for binary outcomes.', vi: 'Hồi quy Tuyến tính dự đoán các giá trị liên tục; Hồi quy Logistic dự đoán xác suất cho kết quả nhị phân.' },
      { key: 'B', en: 'Linear Regression uses categorical inputs; Logistic Regression uses continuous inputs.', vi: 'Hồi quy Tuyến tính sử dụng đầu vào phân loại; Hồi quy Logistic sử dụng đầu vào liên tục.' },
      { key: 'C', en: 'They both predict continuous values but use different optimization methods.', vi: 'Cả hai đều dự đoán các giá trị liên tục nhưng sử dụng các phương pháp tối ưu hóa khác nhau.' },
      { key: 'D', en: 'Logistic Regression cannot handle multiple inputs.', vi: 'Hồi quy Logistic không thể xử lý nhiều đầu vào.' },
    ],
    answer: 'A',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which function is applied in Logistic Regression to map the output of the linear equation into a probability range between 0 and 1?',
      vi: 'Hàm nào được áp dụng trong Hồi quy Logistic để ánh xạ đầu ra của phương trình tuyến tính vào phạm vi xác suất từ 0 đến 1?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Rectified Linear Unit (ReLU)', vi: 'Đơn vị tuyến tính chỉnh lưu (ReLU)' },
      { key: 'B', en: 'Softmax Function', vi: 'Hàm Softmax (Softmax Function)' },
      { key: 'C', en: 'Sigmoid Function', vi: 'Hàm Sigmoid (Sigmoid Function)' },
      { key: 'D', en: 'Tanh Function', vi: 'Hàm Tanh (Tanh Function)' },
    ],
    answer: 'C',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why does Logistic Regression use the Sigmoid function instead of directly using the linear equation Y = b0 + b1*X + e?',
      vi: 'Tại sao Hồi quy Logistic sử dụng hàm Sigmoid thay vì sử dụng trực tiếp phương trình tuyến tính Y = b0 + b1*X + e?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To ensure the predicted outcome is non-negative.', vi: 'Để đảm bảo kết quả dự đoán không âm.' },
      { key: 'B', en: 'To transform the output into a value that can be interpreted as a valid probability (between 0 and 1).', vi: 'Để chuyển đổi đầu ra thành một giá trị có thể được diễn giải như một xác suất hợp lệ (từ 0 đến 1).' },
      { key: 'C', en: 'To minimize the Mean Squared Error (MSE).', vi: 'Để cực tiểu hóa sai số bình phương trung bình (MSE).' },
      { key: 'D', en: 'To correct for multicollinearity.', vi: 'Để điều chỉnh đa cộng tuyến.' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'In Logistic Regression, the log-odds (logit) is defined as the logarithm of the ratio of the probability of success (p) to the probability of failure (1 - p). What is the formula for the log-odds?',
      vi: 'Trong Hồi quy Logistic, log-odds (logit) được định nghĩa là logarit của tỷ lệ xác suất thành công (p) trên xác suất thất bại (1 - p). Công thức cho log-odds là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'ln(p / (1 - p))', vi: 'ln(p / (1 - p))' },
      { key: 'B', en: 'p + (1 - p)', vi: 'p + (1 - p)' },
      { key: 'C', en: '1 / p', vi: '1 / p' },
      { key: 'D', en: 'e^p', vi: 'e^p' },
    ],
    answer: 'A',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'A Logistic Regression model provides a log-odds (logit) value of 0 for a specific customer. What is the calculated probability (p) that this customer belongs to the positive class?',
      vi: 'Một mô hình Hồi quy Logistic cung cấp giá trị log-odds (logit) bằng 0 cho một khách hàng cụ thể. Xác suất tính toán (p) khách hàng này thuộc lớp tích cực là bao nhiêu?',
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
      en: 'Which mathematical function is typically minimized as the cost function (loss function) when training a Logistic Regression model?',
      vi: 'Hàm toán học nào thường được cực tiểu hóa làm hàm chi phí (hàm mất mát) khi huấn luyện mô hình Hồi quy Logistic?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mean Squared Error (MSE)', vi: 'Sai số bình phương trung bình (MSE)' },
      { key: 'B', en: 'R^2', vi: 'R^2' },
      { key: 'C', en: 'Cross-Entropy Loss (or Log Loss)', vi: 'Mất mát entropy chéo (Cross-Entropy Loss hoặc Log Loss)' },
      { key: 'D', en: 'Sum of Absolute Errors (SAE)', vi: 'Tổng sai số tuyệt đối (SAE)' },
    ],
    answer: 'C',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'How should a coefficient beta be interpreted in Logistic Regression?',
      vi: 'Hệ số beta nên được diễn giải thế nào trong Hồi quy Logistic?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A one-unit increase in X increases the predicted probability p by beta.', vi: 'Tăng 1 đơn vị X làm tăng xác suất dự đoán p thêm beta đơn vị.' },
      { key: 'B', en: 'A one-unit increase in X increases the predicted Y by beta.', vi: 'Tăng 1 đơn vị X làm tăng Y dự đoán thêm beta đơn vị.' },
      { key: 'C', en: 'A one-unit increase in X increases the log-odds of the positive class by beta.', vi: 'Tăng 1 đơn vị X làm tăng log-odds của lớp tích cực thêm beta đơn vị.' },
      { key: 'D', en: 'A one-unit increase in X decreases the residual error by beta.', vi: 'Tăng 1 đơn vị X làm giảm sai số phần dư thêm beta đơn vị.' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'In a classification dataset, if the data points are perfectly separated by a linear boundary, why might training a standard (unregularized) Logistic Regression model lead to numerical issues?',
      vi: 'Trong một tập dữ liệu phân loại, nếu các điểm dữ liệu được phân tách hoàn hảo bởi một ranh giới tuyến tính, tại sao việc huấn luyện mô hình Hồi quy Logistic tiêu chuẩn (không có điều chuẩn) có thể dẫn đến các vấn đề tính toán?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The model will converge immediately.', vi: 'Mô hình sẽ hội tụ lập tức.' },
      { key: 'B', en: 'The coefficients (beta) will approach infinity, indicating complete separation (perfect fit).', vi: 'Các hệ số hồi quy (beta) sẽ tiến tới vô cùng, cho thấy sự phân tách hoàn toàn (khớp hoàn hảo).' },
      { key: 'C', en: 'The Cross-Entropy Loss will become zero, halting the training process prematurely.', vi: 'Mất mát Cross-Entropy sẽ bằng không, làm dừng quá trình huấn luyện sớm.' },
      { key: 'D', en: 'The Sigmoid function will output only 0s.', vi: 'Hàm Sigmoid sẽ chỉ cho đầu ra là các số 0.' },
    ],
    answer: 'B',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'For a system designed to predict whether a manufacturing machine will fail (positive class) or run normally (negative class), which metric should be prioritized and why?',
      vi: 'Đối với một hệ thống được thiết kế để dự đoán liệu máy sản xuất có bị lỗi (lớp tích cực) hay chạy bình thường (lớp tiêu cực), chỉ số nào nên được ưu tiên và tại sao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Precision, because minimizing False Positives is crucial for cost savings.', vi: 'Độ chính xác (Precision), vì giảm thiểu Dương tính giả là cực kỳ quan trọng để tiết kiệm chi phí.' },
      { key: 'B', en: 'Recall, because minimizing False Negatives (missed failures) is essential to prevent costly operational damage.', vi: 'Độ bao phủ (Recall), vì giảm thiểu Âm tính giả (bỏ sót lỗi thực tế) là cần thiết để ngăn ngừa hư hỏng vận hành tốn kém.' },
      { key: 'C', en: 'Accuracy, because the overall correctness matters most.', vi: 'Độ chính xác tổng thể (Accuracy), vì tính đúng đắn chung là quan trọng nhất.' },
      { key: 'D', en: 'F1 Score, because it balances Precision and Recall equally.', vi: 'F1 Score, vì nó cân bằng giữa Precision và Recall một cách đồng đều.' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Propose a specific architecture or method to adapt a Binary Logistic Regression model for a problem with three or more mutually exclusive classes (e.g., predicting Low, Medium, or High risk levels).',
      vi: 'Đề xuất một kiến trúc hoặc phương pháp cụ thể để điều chỉnh mô hình Hồi quy Logistic nhị phân cho bài toán có ba hoặc nhiều lớp loại trừ lẫn nhau (ví dụ: dự đoán mức độ rủi ro Thấp, Trung bình hoặc Cao).',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Use the Kernel Trick to map data to a higher dimension.', vi: 'Sử dụng Mẹo hạt nhân (Kernel Trick) để ánh xạ dữ liệu sang chiều cao hơn.' },
      { key: 'B', en: 'Use Simple Linear Regression for each class independently.', vi: 'Sử dụng Hồi quy Tuyến tính Đơn giản cho từng lớp một cách độc lập.' },
      { key: 'C', en: 'Use Multinomial Logistic Regression (Softmax Regression) or the One-vs-Rest (OvR) approach.', vi: 'Sử dụng Hồi quy Logistic đa biến (Hồi quy Softmax) hoặc phương pháp tiếp cận Một-đấu-Tất cả (One-vs-Rest - OvR).' },
      { key: 'D', en: 'Use the Sigmoid function multiple times on the same output.', vi: 'Sử dụng hàm Sigmoid nhiều lần trên cùng một đầu ra.' },
    ],
    answer: 'C',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The Eco-Routing system predicts the probability of an AEV motor \'Overheating\' (Y=1) based on real-time data from the IoT Sensor Grid. If the Logistic Regression model outputs a log-odds (logit) value of -0.8 for the current motor status, calculate the approximate probability (p) of the AEV motor overheating.',
      vi: 'Hệ thống Eco-Routing dự đoán xác suất động cơ AEV bị \'Quá nhiệt\' (Y=1) dựa trên dữ liệu thời gian thực từ lưới cảm biến IoT. Nếu mô hình Hồi quy Logistic đưa ra giá trị log-odds (logit) là -0.8 cho trạng thái động cơ hiện tại, hãy tính xác suất xấp xỉ (p) động cơ AEV bị quá nhiệt.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '0.69', vi: '0.69' },
      { key: 'B', en: '0.31', vi: '0.31' },
      { key: 'C', en: '0.50', vi: '0.50' },
      { key: 'D', en: '0.45', vi: '0.45' },
    ],
    answer: 'B',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'A Logistic Regression model predicts the likelihood of a human courier receiving a \'Low Satisfaction Score\' (Y=1) based on several factors, including \'Route Distance\' (X). If the coefficient for Route Distance is beta = 0.25 (positive), how should this coefficient be interpreted in terms of the risk?',
      vi: 'Một mô hình Hồi quy Logistic dự đoán khả năng một shipper nhận được \'Điểm hài lòng thấp\' (Y=1) dựa trên một số yếu tố, bao gồm \'Quãng đường tuyến đường\' (X). Nếu hệ số cho Quãng đường tuyến đường là beta = 0.25 (dương), hệ số này nên được giải thích như thế nào về mặt rủi ro?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A 1 km increase in Route Distance increases the probability of a low score by 25%.', vi: 'Tăng 1 km Quãng đường tuyến đường làm tăng xác suất nhận điểm thấp thêm 25%.' },
      { key: 'B', en: 'A 1 km increase in Route Distance decreases the probability of a low score by 0.25.', vi: 'Tăng 1 km Quãng đường tuyến đường làm giảm xác suất nhận điểm thấp đi 0.25.' },
      { key: 'C', en: 'A 1 km increase in Route Distance increases the log-odds (logit) of receiving a low satisfaction score by 0.25, holding all other factors constant.', vi: 'Tăng 1 km Quãng đường tuyến đường làm tăng log-odds (logit) nhận điểm hài lòng thấp thêm 0.25, giữ nguyên tất cả các yếu tố khác.' },
      { key: 'D', en: 'Route Distance is negatively correlated with customer satisfaction.', vi: 'Quãng đường tuyến đường tương quan nghịch với sự hài lòng của khách hàng.' },
    ],
    answer: 'C',
  },
  {
    id: 'q13',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'The Eco-Routing system is required to predict the binary outcome \'Package Damaged\' (Yes/No) based on AEV velocity and road conditions. Why is Logistic Regression, which uses the Sigmoid function, the appropriate choice over standard Linear Regression for this classification task?',
      vi: 'Hệ thống Eco-Routing được yêu cầu dự đoán kết quả nhị phân \'Bưu phẩm bị hỏng\' (Có/Không) dựa trên vận tốc AEV và điều kiện đường xá. Tại sao Hồi quy Logistic, sử dụng hàm Sigmoid, là lựa chọn thích hợp hơn so với Hồi quy Tuyến tính tiêu chuẩn cho tác vụ phân loại này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Linear Regression is too computationally intensive for continuous time-series data like velocity.', vi: 'Hồi quy Tuyến tính quá tốn tài nguyên tính toán đối với dữ liệu chuỗi thời gian liên tục như vận tốc.' },
      { key: 'B', en: 'The Sigmoid function bounds the output between [0, 1], allowing the result to be interpreted as a valid probability of damage, which Linear Regression\'s unbounded output cannot guarantee.', vi: 'Hàm Sigmoid giới hạn đầu ra trong khoảng [0, 1], cho phép kết quả được diễn giải như một xác suất hư hỏng hợp lệ, điều mà đầu ra không giới hạn của Hồi quy Tuyến tính không thể đảm bảo.' },
      { key: 'C', en: 'Logistic Regression is better suited for minimizing the Mean Squared Error (MSE).', vi: 'Hồi quy Logistic phù hợp hơn để cực tiểu hóa sai số bình phương trung bình (MSE).' },
      { key: 'D', en: 'Logistic Regression automatically handles non-linear relationships without needing feature transformation.', vi: 'Hồi quy Logistic tự động xử lý các mối quan hệ phi tuyến mà không cần biến đổi đặc trưng.' },
    ],
    answer: 'B',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'The system uses Logistic Regression to predict \'Immediate AEV Failure\' (Y=1) based on motor diagnostics. Given that the cost of a False Negative (failing to predict a failure that leads to a crash) is extremely high, which evaluation metric should the engineering team prioritize when setting the classification probability threshold?',
      vi: 'Hệ thống sử dụng Hồi quy Logistic để dự đoán \'Hỏng hóc AEV lập tức\' (Y=1) dựa trên chẩn đoán động cơ. Với chi phí của việc Âm tính giả (không dự đoán được lỗi dẫn đến va chạm) là cực kỳ cao, nhóm kỹ sư nên ưu tiên số đo đánh giá nào khi thiết lập ngưỡng xác suất phân loại?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Precision (minimizing False Positives, or unnecessary maintenance checks).', vi: 'Độ chính xác (Precision - giảm thiểu Dương tính giả, hoặc kiểm tra bảo trì không cần thiết).' },
      { key: 'B', en: 'Recall (minimizing False Negatives, or missed actual failures).', vi: 'Độ bao phủ (Recall - giảm thiểu Âm tính giả, hoặc bỏ sót các lỗi thực tế).' },
      { key: 'C', en: 'Accuracy (overall correctness across all predictions).', vi: 'Độ chính xác tổng thể (Accuracy - tính đúng đắn chung trên tất cả các dự đoán).' },
      { key: 'D', en: 'F1 Score (harmonic mean of Precision and Recall).', vi: 'F1 Score (trung bình điều hòa của Precision và Recall).' },
    ],
    answer: 'B',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'The logistics team wants to extend the predictive capability to classify delivery outcomes into three mutually exclusive levels: \'On Time,\' \'Minor Delay,\' and \'Major Delay.\' What is the required architectural modification to adapt the framework from Binary Logistic Regression to handle this multi-class classification task?',
      vi: 'Nhóm logistics muốn mở rộng khả năng dự đoán để phân loại kết quả giao hàng thành ba cấp độ loại trừ lẫn nhau: \'Đúng giờ,\' \'Trễ ít,\' và \'Trễ nhiều.\' Sửa đổi kiến trúc nào là cần thiết để chuyển đổi khung từ Hồi quy Logistic nhị phân sang xử lý tác vụ phân loại đa lớp này?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Replacing the Cross-Entropy loss function with Mean Squared Error (MSE).', vi: 'Thay thế hàm mất mát Cross-Entropy bằng Sai số bình phương trung bình (MSE).' },
      { key: 'B', en: 'Using Ordinary Least Squares (OLS) minimization with an unbounded output.', vi: 'Sử dụng cực tiểu hóa bình phương tối thiểu thông thường (OLS) với đầu ra không bị giới hạn.' },
      { key: 'C', en: 'Employing Multinomial Logistic Regression (Softmax Regression) or training multiple One-vs-Rest (OvR) binary models.', vi: 'Sử dụng Hồi quy Logistic đa thức (Hồi quy Softmax) hoặc huấn luyện nhiều mô hình nhị phân Một-đấu-Tất cả (One-vs-Rest - OvR).' },
      { key: 'D', en: 'Applying the Tanh activation function to normalize the input variables.', vi: 'Áp dụng hàm kích hoạt Tanh để chuẩn hóa các biến đầu vào.' },
    ],
    answer: 'C',
  },
]
