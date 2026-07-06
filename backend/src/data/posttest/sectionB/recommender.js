export const recommenderSystem = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'Which accuracy metric is specifically noted for placing a higher emphasis on larger deviations between predicted and actual ratings?',
      vi: 'Số liệu đo độ chính xác nào được ghi nhận cụ thể là nhấn mạnh hơn vào các sai lệch lớn hơn giữa xếp hạng dự đoán và thực tế?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mean Absolute Error (MAE)', vi: 'Sai số tuyệt đối trung bình (MAE)' },
      { key: 'B', en: 'Root Mean Square Error (RMSE)', vi: 'Sai số bình phương trung bình căn (RMSE)' },
      { key: 'C', en: 'Precision at k', vi: 'Độ chính xác tại k' },
      { key: 'D', en: 'Recall', vi: 'Độ triệu hồi' },
    ],
    answer: 'B',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'In the context of Content-based Filtering, what does the Inverse Document Frequency (IDF) aim to achieve?',
      vi: 'Trong bối cảnh Lọc dựa trên nội dung, Tần suất nghịch đảo văn bản (IDF) nhằm đạt được mục tiêu gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Measuring the frequency of a term within a single document', vi: 'Đo tần suất của một thuật ngữ trong một văn bản duy nhất' },
      { key: 'B', en: 'Reducing the weight of terms that appear in almost all documents', vi: 'Giảm trọng số của các thuật ngữ xuất hiện trong hầu hết các văn bản' },
      { key: 'C', en: 'Normalizing the document length', vi: 'Chuẩn hóa độ dài văn bản' },
      { key: 'D', en: 'Identifying the semantic meaning', vi: 'Xác định ý nghĩa ngữ nghĩa' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why is Item-based Collaborative Filtering (I2I) often preferred over User-based (U2U) in large-scale commercial systems like Amazon?',
      vi: 'Tại sao Lọc cộng tác dựa trên mục (I2I) thường được ưu tiên hơn dựa trên người dùng (U2U) trong các hệ thống thương mại quy mô lớn như Amazon?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'User similarities are more stable than item similarities', vi: 'Sự tương đồng giữa người dùng ổn định hơn sự tương đồng giữa các mục' },
      { key: 'B', en: 'It eliminates the cold start problem for new users', vi: 'Nó loại bỏ vấn đề khởi đầu lạnh cho người dùng mới' },
      { key: 'C', en: 'Item relationships are more stable and the number of items is often smaller than users', vi: 'Mối quan hệ giữa các mục ổn định hơn và số lượng mục thường nhỏ hơn người dùng' },
      { key: 'D', en: 'It requires no pre-processing', vi: 'Nó không yêu cầu xử lý trước' },
    ],
    answer: 'C',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'From the "Recommendation Perspective," what is the primary goal of suggesting items from the "Long Tail"?',
      vi: 'Từ "Góc nhìn Gợi ý", mục tiêu chính của việc gợi ý các mục từ "Đuôi dài" (Long Tail) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To recommend the top 20% most popular items', vi: 'Gợi ý 20% mục phổ biến nhất' },
      { key: 'B', en: 'To identify widely unknown items that users might actually like (Serendipity)', vi: 'Xác định các mục không phổ biến rộng rãi mà người dùng thực sự có thể thích (Serendipity)' },
      { key: 'C', en: 'To reduce search costs', vi: 'Giảm chi phí tìm kiếm' },
      { key: 'D', en: 'To optimize for Precision', vi: 'Tối ưu hóa độ chính xác' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If a keyword i appears in every single document in a collection, what will its TF-IDF weight be?',
      vi: 'Nếu một từ khóa i xuất hiện trong mọi văn bản trong một bộ sưu tập, trọng số TF-IDF của nó sẽ là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '0', vi: '0' },
      { key: 'B', en: '1', vi: '1' },
      { key: 'C', en: '∞', vi: '∞' },
      { key: 'D', en: 'TF(i,j)', vi: 'TF(i,j)' },
    ],
    answer: 'A',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'In User-based CF, why do we add the weighted difference of neighbors\' ratings to the user\'s own average rating?',
      vi: 'Trong CF dựa trên người dùng, tại sao chúng ta cộng thêm chênh lệch trọng số của xếp hạng của hàng xóm vào xếp hạng trung bình của chính người dùng?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To simplify calculation', vi: 'Để đơn giản hóa việc tính toán' },
      { key: 'B', en: 'To account for differences in individual rating behavior (bias)', vi: 'Để tính đến sự khác biệt trong hành vi xếp hạng cá nhân (định kiến)' },
      { key: 'C', en: 'To ensure rating is between 1 and 5', vi: 'Để đảm bảo xếp hạng nằm trong khoảng từ 1 đến 5' },
      { key: 'D', en: 'To prioritize items already seen', vi: 'Để ưu tiên các mục đã xem' },
    ],
    answer: 'B',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'What is the fundamental disadvantage of using the "Memory-based" approach in a real-world system with millions of customers?',
      vi: 'Nhược điểm cơ bản của việc sử dụng cách tiếp cận "dựa trên bộ nhớ" (Memory-based) trong một hệ thống thực tế với hàng triệu khách hàng là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It requires excessive knowledge engineering', vi: 'Nó đòi hỏi kỹ thuật tri thức quá mức' },
      { key: 'B', en: 'It cannot handle explicit feedback', vi: 'Nó không thể xử lý phản hồi rõ ràng' },
      { key: 'C', en: 'It does not scale because the entire matrix must be used at run-time', vi: 'Nó không mở rộng được vì toàn bộ ma trận phải được sử dụng trong thời gian chạy' },
      { key: 'D', en: 'It is less accurate than content-based', vi: 'Nó kém chính xác hơn dựa trên nội dung' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'How does "Recursive Collaborative Filtering" address the challenge of sparse datasets?',
      vi: 'Lọc cộng tác đệ quy giải quyết thách thức của các tập dữ liệu thưa thớt như thế nào?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'By switching to non-personalized strategy', vi: 'Bằng cách chuyển sang chiến lược không cá nhân hóa' },
      { key: 'B', en: 'By increasing threshold for co-rated items', vi: 'Bằng cách tăng ngưỡng cho các mục được xếp hạng chung' },
      { key: 'C', en: 'By predicting ratings for neighbors who haven\'t rated an item yet to use as input', vi: 'Bằng cách dự đoán xếp hạng cho những người hàng xóm chưa xếp hạng một mục để sử dụng làm đầu vào' },
      { key: 'D', en: 'By only recommending popular items', vi: 'Bằng cách chỉ gợi ý các mục phổ biến' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'A researcher finds very high RMSE but excellent user satisfaction. Why might this happen?',
      vi: 'Một nhà nghiên cứu nhận thấy RMSE rất cao nhưng mức độ hài lòng của người dùng lại rất tốt. Tại sao điều này có thể xảy ra?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Accuracy metrics are the only true measure', vi: 'Số liệu chính xác là thước đo thực sự duy nhất' },
      { key: 'B', en: 'The system may excel at explaining results and giving users a "good feeling"', vi: 'Hệ thống có thể xuất sắc trong việc giải thích kết quả và mang lại cho người dùng "cảm giác tốt"' },
      { key: 'C', en: 'User community is too small', vi: 'Cộng đồng người dùng quá nhỏ' },
      { key: 'D', en: 'Wrong Ground Truth', vi: 'Ground Truth sai' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'In a Constraint-based system, what is the purpose of calculating "Minimal Diagnoses"?',
      vi: 'Trong một hệ thống dựa trên ràng buộc, mục đích của việc tính toán "Chẩn đoán tối thiểu" (Minimal Diagnoses) là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'To identify popular products', vi: 'Để xác định các sản phẩm phổ biến' },
      { key: 'B', en: 'To debug catalog errors', vi: 'Để gỡ lỗi danh mục' },
      { key: 'C', en: 'To find the smallest set of user requirements to relax to make a recommendation possible', vi: 'Để tìm tập hợp nhỏ nhất các yêu cầu của người dùng cần nới lỏng để có thể thực hiện gợi ý' },
      { key: 'D', en: 'To automatically increase budget', vi: 'Để tự động tăng ngân sách' },
    ],
    answer: 'C',
  },
]
