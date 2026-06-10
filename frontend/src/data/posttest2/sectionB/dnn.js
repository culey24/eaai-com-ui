export const deepNeuralNetworks = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the main benefit of using Residual Connections in deep networks?',
      vi: 'Lợi ích chính của việc sử dụng Kết nối tàn dư (Residual Connections) trong các mạng sâu là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Reduces model size', vi: 'Giảm kích thước mô hình' },
      { key: 'B', en: 'Increases activation values', vi: 'Tăng giá trị kích hoạt' },
      { key: 'C', en: 'Helps mitigate vanishing gradient problem', vi: 'Giúp giảm thiểu vấn đề triệt tiêu đạo hàm (vanishing gradient)' },
      { key: 'D', en: 'Faster inference speed', vi: 'Tốc độ suy diễn nhanh hơn' },
    ],
    answer: 'C',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which activation function is most commonly used in modern deep neural networks?',
      vi: 'Hàm kích hoạt nào được sử dụng phổ biến nhất trong các mạng thần kinh sâu hiện đại?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Sigmoid', vi: 'Sigmoid' },
      { key: 'B', en: 'Linear', vi: 'Tuyến tính (Linear)' },
      { key: 'C', en: 'Softmax', vi: 'Softmax' },
      { key: 'D', en: 'ReLU', vi: 'ReLU' },
    ],
    answer: 'D',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why is Batch Normalization commonly used?',
      vi: 'Tại sao chuẩn hóa theo lô (Batch Normalization) được sử dụng phổ biến?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To replace activation functions', vi: 'Để thay thế các hàm kích hoạt' },
      { key: 'B', en: 'To stabilize and speed up training', vi: 'Để ổn định và tăng tốc độ huấn luyện' },
      { key: 'C', en: 'To increase model capacity', vi: 'Để tăng dung lượng mô hình' },
      { key: 'D', en: 'To reduce the number of layers', vi: 'Để giảm số lượng các lớp' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'What does the vanishing gradient problem cause?',
      vi: 'Vấn đề triệt tiêu đạo hàm (vanishing gradient) gây ra điều gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Loss becomes infinite', vi: 'Mất mát trở nên vô hạn' },
      { key: 'B', en: 'Weights update too quickly', vi: 'Các trọng số cập nhật quá nhanh' },
      { key: 'C', en: 'Gradients become very small in early layers', vi: 'Đạo hàm trở nên rất nhỏ ở các lớp ban đầu' },
      { key: 'D', en: 'Model converges too fast', vi: 'Mô hình hội tụ quá nhanh' },
    ],
    answer: 'C',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'What should you do first if you observe exploding gradients?',
      vi: 'Bạn nên làm gì đầu tiên nếu quan sát thấy đạo hàm bị bùng nổ (exploding gradients)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Add more layers', vi: 'Thêm nhiều lớp hơn' },
      { key: 'B', en: 'Increase learning rate', vi: 'Tăng tốc độ học' },
      { key: 'C', en: 'Remove Batch Normalization', vi: 'Loại bỏ Batch Normalization' },
      { key: 'D', en: 'Apply Gradient Clipping', vi: 'Áp dụng Cắt đạo hàm (Gradient Clipping)' },
    ],
    answer: 'D',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If your DNN is severely overfitting, which technique is most effective?',
      vi: 'Nếu mạng DNN của bạn bị quá khớp nghiêm trọng, kỹ thuật nào sau đây là hiệu quả nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Add more neurons', vi: 'Thêm nhiều nơ-ron hơn' },
      { key: 'B', en: 'Increase learning rate', vi: 'Tăng tốc độ học' },
      { key: 'C', en: 'Reduce batch size to 1', vi: 'Giảm kích thước lô xuống 1' },
      { key: 'D', en: 'Use Dropout and Weight Decay', vi: 'Sử dụng Dropout và Suy giảm trọng số (Weight Decay)' },
    ],
    answer: 'D',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Why have Transformers largely replaced RNNs in many tasks?',
      vi: 'Tại sao mô hình Transformer phần lớn đã thay thế mạng RNN trong nhiều tác vụ?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Transformers use less data', vi: 'Transformer sử dụng ít dữ liệu hơn' },
      { key: 'B', en: 'RNNs require more memory', vi: 'RNN yêu cầu nhiều bộ nhớ hơn' },
      { key: 'C', en: 'Transformers are easier to implement', vi: 'Transformer dễ triển khai hơn' },
      { key: 'D', en: 'Transformers handle long-range dependencies better via self-attention', vi: 'Transformer xử lý các phụ thuộc tầm xa tốt hơn thông qua cơ chế tự chú ý (self-attention)' },
    ],
    answer: 'D',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is the main risk when a DNN is used for hiring decisions?',
      vi: 'Rủi ro chính khi một mạng DNN được sử dụng cho các quyết định tuyển dụng là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Slow inference time', vi: 'Thời gian suy diễn chậm' },
      { key: 'B', en: 'High computational cost', vi: 'Chi phí tính toán cao' },
      { key: 'C', en: 'Algorithmic bias from training data', vi: 'Độ thiên lệch thuật toán (bias) từ dữ liệu huấn luyện' },
      { key: 'D', en: 'Overfitting on small data', vi: 'Quá khớp trên dữ liệu nhỏ' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'What is the biggest concern with highly accurate but black-box DNNs in healthcare?',
      vi: 'Mối quan ngại lớn nhất đối với các mạng DNN có độ chính xác cao nhưng hoạt động như hộp đen (black-box) trong y tế là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Training time', vi: 'Thời gian huấn luyện' },
      { key: 'B', en: 'Number of parameters', vi: 'Số lượng tham số' },
      { key: 'C', en: 'Model size', vi: 'Kích thước mô hình' },
      { key: 'D', en: 'Lack of interpretability and trust', vi: 'Thiếu tính giải thích được (interpretability) và sự tin cậy' },
    ],
    answer: 'D',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Which approach is best to reduce gender bias in a DNN for loan approval?',
      vi: 'Phương pháp nào là tốt nhất để giảm thiểu thiên lệch giới tính trong mạng DNN phê duyệt khoản vay?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Use deeper architecture', vi: 'Sử dụng kiến trúc sâu hơn' },
      { key: 'B', en: 'Increase learning rate', vi: 'Tăng tốc độ học' },
      { key: 'C', en: 'Use only one-hot encoding', vi: 'Chỉ sử dụng mã hóa one-hot' },
      { key: 'D', en: 'Apply fairness constraints and remove sensitive features', vi: 'Áp dụng các ràng buộc công bằng và loại bỏ các đặc trưng nhạy cảm' },
    ],
    answer: 'D',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The team builds a Deep Neural Network to predict customer satisfaction score (1-5) using features from multiple data sources (order history, IoT telemetry, and text sentiment). This is a regression task. Which loss function is most appropriate?',
      vi: 'Nhóm xây dựng một Mạng thần kinh sâu để dự đoán điểm hài lòng của khách hàng (1-5) sử dụng các đặc trưng từ nhiều nguồn dữ liệu (lịch sử đơn hàng, đo lường từ xa IoT và cảm xúc văn bản). Đây là một tác vụ hồi quy (regression). Hàm mất mát nào là phù hợp nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Binary Cross-Entropy', vi: 'Binary Cross-Entropy' },
      { key: 'B', en: 'Mean Squared Error (MSE)', vi: 'Sai số bình phương trung bình (MSE)' },
      { key: 'C', en: 'Categorical Cross-Entropy', vi: 'Categorical Cross-Entropy' },
      { key: 'D', en: 'Hinge Loss', vi: 'Hinge Loss' },
    ],
    answer: 'B',
  },
  {
    id: 'q12',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'A DNN is trained to classify road conditions (Clear / Congested / Dangerous) from AEV dashcam images (Vision Stream). During training, the validation loss stops decreasing while training loss continues to drop significantly. What problem is occurring?',
      vi: 'Một mạng DNN được huấn luyện để phân loại điều kiện đường xá (Clear / Congested / Dangerous) từ hình ảnh dashcam của AEV (Luồng thị giác). Trong quá trình huấn luyện, mất mát kiểm thử (validation loss) ngừng giảm trong khi mất mát huấn luyện (training loss) tiếp tục giảm mạnh. Vấn đề gì đang xảy ra?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Underfitting', vi: 'Thiếu khớp (Underfitting)' },
      { key: 'B', en: 'Overfitting', vi: 'Quá khớp (Overfitting)' },
      { key: 'C', en: 'Vanishing Gradient', vi: 'Triệt tiêu đạo hàm (Vanishing Gradient)' },
      { key: 'D', en: 'Data Leakage', vi: 'Rò rỉ dữ liệu (Data Leakage)' },
    ],
    answer: 'B',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The team uses a Deep Neural Network with 6 hidden layers to predict AEV energy consumption. They observe that adding more layers improves training accuracy but makes the model very slow and unstable during training. What is the most likely cause?',
      vi: 'Nhóm sử dụng một Mạng thần kinh sâu với 6 lớp ẩn để dự báo lượng tiêu hao năng lượng của AEV. Họ nhận thấy rằng việc thêm nhiều lớp hơn giúp tăng độ chính xác huấn luyện nhưng khiến mô hình chạy rất chậm và không ổn định khi huấn luyện. Nguyên nhân nào có khả năng nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The network is too shallow.', vi: 'Mạng lưới quá nông.' },
      { key: 'B', en: 'Vanishing or Exploding Gradient Problem.', vi: 'Vấn đề Triệt tiêu hoặc Bùng nổ Đạo hàm.' },
      { key: 'C', en: 'The learning rate is too high.', vi: 'Tốc độ học quá cao.' },
      { key: 'D', en: 'They are using ReLU activation in all layers.', vi: 'Họ đang sử dụng kích hoạt ReLU trong tất cả các lớp.' },
    ],
    answer: 'B',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'The team has two models for predicting delivery delay (binary classification): Model X: Very deep DNN (many layers) - High training accuracy, moderate validation accuracy. Model Y: Shallower DNN with Residual Connections (ResNet-style) - Slightly lower training accuracy but much better validation accuracy and generalization. Which model should be chosen for real-time deployment and why?',
      vi: 'Nhóm có hai mô hình để dự đoán trễ hẹn giao hàng (phân loại nhị phân): Mô hình X: DNN rất sâu (nhiều lớp) - Độ chính xác huấn luyện cao, độ chính xác kiểm thử trung bình. Mô hình Y: DNN nông hơn với Kết nối tàn dư (kiểu ResNet) - Độ chính xác huấn luyện thấp hơn một chút nhưng độ chính xác kiểm thử và khả năng khái quát hóa tốt hơn nhiều. Nên chọn mô hình nào để triển khai thời gian thực và tại sao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Model X because deeper is always better.', vi: 'Mô hình X vì sâu hơn luôn tốt hơn.' },
      { key: 'B', en: 'Model Y because residual connections help mitigate degradation problem and improve generalization.', vi: 'Mô hình Y vì kết nối tàn dư giúp giảm bớt vấn đề suy thoái và cải thiện khả năng khái quát hóa.' },
      { key: 'C', en: 'Neither, they should use Logistic Regression instead.', vi: 'Không chọn mô hình nào, thay vào đó họ nên sử dụng Hồi quy Logistic.' },
      { key: 'D', en: 'Model X because it has higher training accuracy.', vi: 'Mô hình X vì nó có độ chính xác huấn luyện cao hơn.' },
    ],
    answer: 'B',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Design a suitable Deep Neural Network architecture for multi-task learning in Project Eco-Routing that simultaneously: (1) predicts delivery delay, (2) estimates customer satisfaction, and (3) detects unsafe road conditions from images.',
      vi: 'Thiết kế một kiến trúc Mạng thần kinh sâu phù hợp cho việc học đa tác vụ (multi-task learning) trong Dự án Eco-Routing nhằm đồng thời: (1) dự đoán trễ hẹn giao hàng, (2) ước tính độ hài lòng khách hàng, và (3) phát hiện điều kiện đường xá không an toàn từ hình ảnh.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Three completely separate DNNs.', vi: 'Ba mạng DNN hoàn toàn riêng biệt.' },
      { key: 'B', en: 'A shared backbone network with multiple task-specific heads (Multi-Task Learning).', vi: 'Một mạng khung xương sống (backbone) chia sẻ với nhiều nhánh đầu ra cụ thể cho từng tác vụ (Học đa tác vụ - Multi-Task Learning).' },
      { key: 'C', en: 'One very large DNN with 10 hidden layers for all tasks.', vi: 'Một mạng DNN cực lớn với 10 lớp ẩn cho tất cả các tác vụ.' },
      { key: 'D', en: 'Use only 1D-CNN because all data is time-series.', vi: 'Chỉ sử dụng 1D-CNN vì tất cả dữ liệu là chuỗi thời gian.' },
    ],
    answer: 'B',
  },
]
