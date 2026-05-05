export const fuzzyLogic = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the term for a mathematical function used in Fuzzy Logic to define the degree of truth of a statement, mapping input values to the interval [0, 1]?',
      vi: 'Thuật ngữ cho một hàm toán học được sử dụng trong Logic mờ để xác định mức độ tin cậy của một tuyên bố, ánh xạ các giá trị đầu vào vào khoảng [0, 1] là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Crisp Function', vi: 'Hàm sắc nét' },
      { key: 'B', en: 'Transfer Function', vi: 'Hàm truyền' },
      { key: 'C', en: 'Membership Function', vi: 'Hàm thành viên' },
      { key: 'D', en: 'Probability Density Function', vi: 'Hàm mật độ xác suất' },
    ],
    answer: 'C',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'The Mamdani-type Fuzzy Inference System typically uses which operator for the implication step?',
      vi: 'Hệ suy diễn mờ loại Mamdani thường sử dụng toán tử nào cho bước kéo theo (implication)?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Min (or product)', vi: 'Min (hoặc tích)' },
      { key: 'B', en: 'Max', vi: 'Max' },
      { key: 'C', en: 'Sum', vi: 'Tổng' },
      { key: 'D', en: 'Average', vi: 'Trung bình' },
    ],
    answer: 'A',
  },
  {
    id: 'q3',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Why is the Center of Gravity (Centroid) method generally considered the most robust defuzzification technique?',
      vi: 'Tại sao phương pháp Trọng tâm (Centroid) thường được coi là kỹ thuật giải mờ mạnh mẽ nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It always selects the mean of the maximum', vi: 'Nó luôn chọn giá trị trung bình của cực đại' },
      { key: 'B', en: 'It considers the entire shape and area of the aggregated fuzzy output set', vi: 'Nó xem xét toàn bộ hình dạng và diện tích của tập đầu ra mờ được tổng hợp' },
      { key: 'C', en: 'It only requires checking the peak value', vi: 'Nó chỉ yêu cầu kiểm tra giá trị đỉnh' },
      { key: 'D', en: 'It avoids the need for a rule base', vi: 'Nó tránh được sự cần thiết của một cơ sở luật' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Explain the consequence of using the Bounded Sum as the S-norm (OR operator) compared to the standard Max operator.',
      vi: 'Giải thích hệ quả của việc sử dụng Tổng giới hạn làm S-norm (toán tử HOẶC) so với toán tử Max tiêu chuẩn.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Bounded Sum always results in a lower membership degree', vi: 'Tổng giới hạn luôn dẫn đến độ thành viên thấp hơn' },
      { key: 'B', en: 'Bounded Sum can allow membership degree to reach 1 faster when sets overlap significantly', vi: 'Tổng giới hạn có thể cho phép độ thành viên đạt đến 1 nhanh hơn khi các tập chồng lấp đáng kể' },
      { key: 'C', en: 'Bounded Sum is only used in Sugeno systems', vi: 'Tổng giới hạn chỉ được dùng trong hệ Sugeno' },
      { key: 'D', en: 'Bounded Sum is equivalent to Max in all cases', vi: 'Tổng giới hạn tương đương với Max trong mọi trường hợp' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'If output sets are aggregated using Max, and Rule 1 firing strength is 0.7, Rule 2 is 0.9, what is the height of combined fuzzy set?',
      vi: 'Nếu các tập đầu ra được tổng hợp bằng Max, và cường độ kích hoạt của Luật 1 là 0.7, Luật 2 là 0.9, chiều cao của tập mờ kết hợp là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '0.7', vi: '0.7' },
      { key: 'B', en: '0.9', vi: '0.9' },
      { key: 'C', en: '1.6', vi: '1.6' },
      { key: 'D', en: '0.63', vi: '0.63' },
    ],
    answer: 'B',
  },
  {
    id: 'q6',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Calculate the membership values for intersection A ∩ B using standard Min operator for sets A={(1,0.2), (2,0.8), (3,0.5)} and B={(1,0.6), (2,0.3), (3,0.9)}.',
      vi: 'Tính các giá trị thành viên cho giao A ∩ B bằng toán tử Min tiêu chuẩn cho các tập A={(1,0.2), (2,0.8), (3,0.5)} và B={(1,0.6), (2,0.3), (3,0.9)}.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '{(1, 0.6), (2, 0.8), (3, 0.9)}', vi: '{(1, 0.6), (2, 0.8), (3, 0.9)}' },
      { key: 'B', en: '{(1, 0.8), (2, 1.1), (3, 1.4)}', vi: '{(1, 0.8), (2, 1.1), (3, 1.4)}' },
      { key: 'C', en: '{(1, 0.2), (2, 0.3), (3, 0.5)}', vi: '{(1, 0.2), (2, 0.3), (3, 0.5)}' },
      { key: 'D', en: '{(1, 0.4), (2, 0.5), (3, 0.4)}', vi: '{(1, 0.4), (2, 0.5), (3, 0.4)}' },
    ],
    answer: 'C',
  },
  {
    id: 'q7',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'If input variables and linguistic terms increase, what is the primary consequence concerning the rule base?',
      vi: 'Nếu các biến đầu vào và thuật ngữ ngôn ngữ tăng lên, hậu quả chính đối với cơ sở luật là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Defuzzification becomes simpler', vi: 'Giải mờ trở nên đơn giản hơn' },
      { key: 'B', en: 'System becomes less sensitive', vi: 'Hệ thống trở nên kém nhạy hơn' },
      { key: 'C', en: 'The rule base suffers from combinatorial explosion', vi: 'Cơ sở luật bị bùng nổ tổ hợp (tăng theo hàm mũ)' },
      { key: 'D', en: 'Fuzzification requires less computation', vi: 'Mờ hóa yêu cầu ít tính toán hơn' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Which system is generally faster for real-time control, Mamdani or Sugeno?',
      vi: 'Hệ thống nào thường nhanh hơn cho điều khiển thời gian thực, Mamdani hay Sugeno?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mamdani, because output calculation is simpler', vi: 'Mamdani, vì tính toán đầu ra đơn giản hơn' },
      { key: 'B', en: 'Mamdani, because it uses fuzzy sets directly', vi: 'Mamdani, vì nó sử dụng trực tiếp các tập mờ' },
      { key: 'C', en: 'Sugeno, because it avoids computationally intensive integration required by COG', vi: 'Sugeno, vì nó tránh được việc tích phân tốn kém tính toán theo phương pháp trọng tâm COG' },
      { key: 'D', en: 'Sugeno, because it produces fuzzy outputs', vi: 'Sugeno, vì nó tạo ra đầu ra mờ' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Evaluate the trade-off when selecting a narrow versus a wide Membership Function for "High" temperature.',
      vi: 'Đánh giá sự cân bằng khi chọn một Hàm thành viên hẹp so với rộng cho nhiệt độ "Cao".',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Narrow MF increases robustness', vi: 'MF hẹp làm tăng tính mạnh mẽ' },
      { key: 'B', en: 'Narrow MF increases sensitivity, potentially leading to oscillatory control', vi: 'MF hẹp làm tăng độ nhạy, có khả năng dẫn đến điều khiển dao động' },
      { key: 'C', en: 'Wide MF decreases overlap', vi: 'MF rộng làm giảm sự chồng lấp' },
      { key: 'D', en: 'Shape only affects aesthetics', vi: 'Hình dạng chỉ ảnh hưởng đến thẩm mỹ' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Design a fuzzy rule linking highly certain input state with moderately conservative output action.',
      vi: 'Thiết kế một luật mờ liên kết trạng thái đầu vào có độ chắc chắn cao với hành động đầu ra thận trọng vừa phải.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'IF Input_Certainty IS Very_High THEN Output_Action IS Aggressive', vi: 'IF Độ_chắc_chắn_đầu_vào LÀ Rất_Cao THEN Hành_động_đầu_ra LÀ Quyết_liệt' },
      { key: 'B', en: 'IF Input_Certainty IS Moderate THEN Output_Action IS Neutral', vi: 'IF Độ_chắc_chắn_đầu_vào LÀ Vừa_phải THEN Hành_động_đầu_ra LÀ Trung_tính' },
      { key: 'C', en: 'IF Input_Certainty IS Very_High THEN Output_Action IS Cautious', vi: 'IF Độ_chắc_chắn_đầu_vào LÀ Rất_Cao THEN Hành_động_đầu_ra LÀ Thận_trọng' },
      { key: 'D', en: 'IF Input_Certainty IS Low THEN Output_Action IS Aggressive', vi: 'IF Độ_chắc_chắn_đầu_vào LÀ Thấp THEN Hành_động_đầu_ra LÀ Quyết_liệt' },
    ],
    answer: 'C',
  },
]
