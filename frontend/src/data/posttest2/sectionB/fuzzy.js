export const fuzzyLogic = [
  {
    id: 'q1',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'What is the term for a mathematical function used in Fuzzy Logic to define the degree of truth of a statement, mapping input values to the interval [0, 1]?',
      vi: 'Thuật ngữ nào chỉ một hàm toán học được sử dụng trong Logic mờ để xác định mức độ chân lý của một phát biểu, ánh xạ các giá trị đầu vào vào khoảng [0, 1]?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Crisp Function', vi: 'Hàm Rõ (Crisp Function)' },
      { key: 'B', en: 'Transfer Function', vi: 'Hàm Truyền (Transfer Function)' },
      { key: 'C', en: 'Membership Function', vi: 'Hàm Thành Viên (Membership Function)' },
      { key: 'D', en: 'Probability Density Function', vi: 'Hàm Mật Độ Xác Suất (Probability Density Function)' },
    ],
    answer: 'C',
  },
  {
    id: 'q2',
    bloom: { en: 'Remembering', vi: 'Ghi nhớ' },
    prompt: {
      en: 'The Mamdani-type Fuzzy Inference System typically uses which operator for the implication step (applying the rule strength to the output fuzzy set)?',
      vi: 'Hệ suy diễn mờ kiểu Mamdani thường sử dụng toán tử nào cho bước kéo theo (áp dụng cường độ luật cho tập mờ đầu ra)?',
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
      vi: 'Tại sao phương pháp Trọng tâm (Centroid/COG) thường được coi là kỹ thuật giải mờ mạnh mẽ nhất?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It always selects the mean of the maximum output value.', vi: 'Nó luôn chọn giá trị trung bình của giá trị đầu ra lớn nhất.' },
      { key: 'B', en: 'It considers the entire shape and area of the aggregated fuzzy output set.', vi: 'Nó xem xét toàn bộ hình dạng và diện tích của tập đầu ra mờ được tổng hợp.' },
      { key: 'C', en: 'It only requires checking the peak value of the output fuzzy set.', vi: 'Nó chỉ yêu cầu kiểm tra giá trị đỉnh của tập mờ đầu ra.' },
      { key: 'D', en: 'It avoids the need for a rule base entirely.', vi: 'Nó tránh hoàn toàn việc cần một cơ sở luật.' },
    ],
    answer: 'B',
  },
  {
    id: 'q4',
    bloom: { en: 'Understanding', vi: 'Hiểu' },
    prompt: {
      en: 'Explain the consequence of using the Bounded Sum (A ⊕ B = min(1, μA(x) + μB(x))) as the S-norm (OR operator) compared to the standard Max operator.',
      vi: 'Giải thích kết quả của việc sử dụng Tổng giới hạn (Bounded Sum) làm S-norm (toán tử HOẶC) so với toán tử Max tiêu chuẩn.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Bounded Sum always results in a lower membership degree.', vi: 'Tổng giới hạn luôn dẫn đến độ thành viên thấp hơn.' },
      { key: 'B', en: 'Bounded Sum can allow the resulting membership degree to exceed Max(μA, μB), potentially reaching 1 faster when the two sets overlap significantly.', vi: 'Tổng giới hạn có thể cho phép độ thành viên kết quả vượt quá Max(μA, μB), có khả năng đạt tới 1 nhanh hơn khi hai tập mờ chồng chéo lên nhau đáng kể.' },
      { key: 'C', en: 'Bounded Sum is only used in Sugeno-type systems.', vi: 'Tổng giới hạn chỉ được sử dụng trong các hệ thống kiểu Sugeno.' },
      { key: 'D', en: 'Bounded Sum is equivalent to the Max operator in all cases.', vi: 'Tổng giới hạn tương đương với toán tử Max trong mọi trường hợp.' },
    ],
    answer: 'B',
  },
  {
    id: 'q5',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'A system has two rules contributing to the output \'Strong Wind\': Rule 1 firing strength is 0.7, and Rule 2 firing strength is 0.9. If the output sets are aggregated using the standard Max (Union) operator, what is the height of the combined fuzzy set \'Strong Wind\'?',
      vi: 'Một hệ thống có hai luật đóng góp vào đầu ra \'Gió mạnh\': Cường độ kích hoạt của Luật 1 là 0.7, và của Luật 2 là 0.9. Nếu các tập đầu ra được tổng hợp bằng toán tử Max (Hợp) tiêu chuẩn, chiều cao của tập mờ kết hợp \'Gió mạnh\' là bao nhiêu?',
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
      en: 'Given a fuzzy set A = { (1, 0.2), (2, 0.8), (3, 0.5) } and a fuzzy set B = { (1, 0.6), (2, 0.3), (3, 0.9) }. Calculate the membership values for the intersection A ∩ B using the standard Min operator.',
      vi: 'Cho tập mờ A = { (1, 0.2), (2, 0.8), (3, 0.5) } và tập mờ B = { (1, 0.6), (2, 0.3), (3, 0.9) }. Tính giá trị thành viên cho phần giao A ∩ B bằng toán tử Min tiêu chuẩn.',
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
      en: 'In a complex control system, if the number of input variables and the number of linguistic terms per variable both increase, what is the primary consequence concerning the rule base?',
      vi: 'Trong một hệ thống điều khiển phức tạp, nếu số lượng biến đầu vào và số lượng từ ngữ ngôn ngữ cho mỗi biến đều tăng lên, hậu quả chính liên quan đến cơ sở luật là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The defuzzification process becomes simpler.', vi: 'Quá trình giải mờ trở nên đơn giản hơn.' },
      { key: 'B', en: 'The system becomes less sensitive to input changes.', vi: 'Hệ thống trở nên ít nhạy cảm hơn với các thay đổi đầu vào.' },
      { key: 'C', en: 'The rule base suffers from combinatorial explosion (exponential growth in the number of rules).', vi: 'Cơ sở luật phải chịu sự bùng nổ tổ hợp (số lượng quy tắc tăng theo cấp số nhân).' },
      { key: 'D', en: 'The Fuzzification step requires less computation.', vi: 'Bước mờ hóa (Fuzzification) đòi hỏi ít tính toán hơn.' },
    ],
    answer: 'C',
  },
  {
    id: 'q8',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'Compare a Mamdani FIS that uses the Min operator for implication and the Center of Gravity (COG) for defuzzification versus a Sugeno FIS using weighted average. Which system is generally faster for real-time control, and why?',
      vi: 'So sánh hệ Mamdani FIS sử dụng toán tử Min cho phép kéo theo và Trọng tâm (COG) để giải mờ với Sugeno FIS sử dụng trung bình có trọng số. Hệ thống nào thường nhanh hơn cho điều khiển thời gian thực và tại sao?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Mamdani, because its output calculation is simpler.', vi: 'Mamdani, vì tính toán đầu ra của nó đơn giản hơn.' },
      { key: 'B', en: 'Mamdani, because it uses fuzzy sets directly.', vi: 'Mamdani, vì nó sử dụng trực tiếp các tập mờ.' },
      { key: 'C', en: 'Sugeno, because it avoids the computationally intensive integration required by the COG defuzzification method.', vi: 'Sugeno, vì nó tránh được việc tích phân tốn nhiều tài nguyên tính toán được yêu cầu bởi phương pháp giải mờ COG.' },
      { key: 'D', en: 'Sugeno, because it produces fuzzy outputs.', vi: 'Sugeno, vì nó tạo ra các đầu ra mờ.' },
    ],
    answer: 'C',
  },
  {
    id: 'q9',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'Evaluate the critical trade-off when selecting a narrow (steep slope) versus a wide (gentle slope) Membership Function for the linguistic term "High" in a temperature controller.',
      vi: 'Đánh giá sự cân bằng quan trọng khi chọn một Hàm thành viên hẹp (độ dốc đứng) so với rộng (độ dốc thoai thoải) cho từ ngôn ngữ "High" trong một bộ điều khiển nhiệt độ.',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'A narrow MF increases the robust nature of the system.', vi: 'Hàm thành viên hẹp làm tăng tính mạnh mẽ (robust) của hệ thống.' },
      { key: 'B', en: 'A narrow MF increases the system\'s sensitivity to small input changes, potentially leading to oscillatory control.', vi: 'Hàm thành viên hẹp làm tăng độ nhạy của hệ thống đối với những thay đổi đầu vào nhỏ, có khả năng dẫn đến dao động điều khiển.' },
      { key: 'C', en: 'A wide MF decreases the overlap between linguistic terms, simplifying the rule base.', vi: 'Hàm thành viên rộng làm giảm sự chồng chéo giữa các từ ngôn ngữ, đơn giản hóa cơ sở luật.' },
      { key: 'D', en: 'The shape of the MF only affects the aesthetic appearance of the control system.', vi: 'Hình dạng của hàm thành viên chỉ ảnh hưởng đến hình thức thẩm mỹ của hệ thống điều khiển.' },
    ],
    answer: 'B',
  },
  {
    id: 'q10',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Design a fuzzy rule that addresses the concept of hedging or uncertainty by linking a highly certain input state with a moderately conservative output action. Use the linguistic variables: Input_Certainty (Very_High, Moderate) and Output_Action (Aggressive, Cautious, Neutral).',
      vi: 'Thiết kế một luật mờ giải quyết khái niệm rào cản (hedging) hoặc sự không chắc chắn bằng cách liên kết một trạng thái đầu vào có độ chắc chắn cao với một hành động đầu ra thận trọng vừa phải. Sử dụng các biến ngôn ngữ: Input_Certainty (Very_High, Moderate) và Output_Action (Aggressive, Cautious, Neutral).',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'IF Input_Certainty IS Very_High THEN Output_Action IS Aggressive.', vi: 'IF Input_Certainty IS Very_High THEN Output_Action IS Aggressive.' },
      { key: 'B', en: 'IF Input_Certainty IS Moderate THEN Output_Action IS Neutral.', vi: 'IF Input_Certainty IS Moderate THEN Output_Action IS Neutral.' },
      { key: 'C', en: 'IF Input_Certainty IS Very_High THEN Output_Action IS Cautious.', vi: 'IF Input_Certainty IS Very_High THEN Output_Action IS Cautious.' },
      { key: 'D', en: 'IF Input_Certainty IS Low THEN Output_Action IS Aggressive.', vi: 'IF Input_Certainty IS Low THEN Output_Action IS Aggressive.' },
    ],
    answer: 'C',
  },
  // Case Study questions
  {
    id: 'q11',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'The Eco-Routing system utilizes human courier reports labeled "heavily congested" or "clear" (Data Source 2). Which Fuzzy Logic component is responsible for taking a precise, real-time traffic density sensor reading (e.g., 45 cars/km) and converting it into a degree of membership for the linguistic term "Heavily Congested"?',
      vi: 'Hệ thống Eco-Routing sử dụng các báo cáo của shippers được gắn nhãn "kẹt xe nặng" hoặc "thông thoáng" (Nguồn dữ liệu 2). Thành phần Logic mờ nào chịu trách nhiệm tiếp nhận số đọc cảm biến mật độ giao thông chính xác trong thời gian thực (ví dụ: 45 xe/km) và chuyển đổi nó thành độ thành viên cho từ ngôn ngữ "Heavily Congested"?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'Defuzzifier', vi: 'Bộ giải mờ (Defuzzifier)' },
      { key: 'B', en: 'Inference Engine', vi: 'Động cơ suy diễn (Inference Engine)' },
      { key: 'C', en: 'Fuzzifier', vi: 'Bộ mờ hóa (Fuzzifier)' },
      { key: 'D', en: 'Rule Base', vi: 'Cơ sở luật (Rule Base)' },
    ],
    answer: 'C',
  },
  {
    id: 'q12',
    bloom: { en: 'Applying', vi: 'Vận dụng' },
    prompt: {
      en: 'Two control rules contribute to the AEV\'s desired \'Minimum Speed\' state: Rule 1 (Battery is Low) has a derived strength of 0.6, and Rule 2 (Motor Temp is High) has a derived strength of 0.9. If the output fuzzy sets are aggregated (combined) using the standard fuzzy Max operator, what is the height (degree of membership) of the resulting combined fuzzy set \'Minimum Speed\'?',
      vi: 'Hai luật điều khiển đóng góp vào trạng thái \'Minimum Speed\' mong muốn của AEV: Luật 1 (Battery is Low) có cường độ dẫn xuất là 0.6, và Luật 2 (Motor Temp is High) có cường độ dẫn xuất là 0.9. Nếu các tập mờ đầu ra được tổng hợp bằng toán tử Max mờ tiêu chuẩn, chiều cao (độ thành viên) của tập mờ kết hợp \'Minimum Speed\' thu được là bao nhiêu?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: '0.6', vi: '0.6' },
      { key: 'B', en: '0.9', vi: '0.9' },
      { key: 'C', en: '1.5', vi: '1.5' },
      { key: 'D', en: '0.54', vi: '0.54' },
    ],
    answer: 'B',
  },
  {
    id: 'q13',
    bloom: { en: 'Analyzing', vi: 'Phân tích' },
    prompt: {
      en: 'The Project Eco-Routing team is choosing between a standard Crisp controller (fixed thresholds) and a Fuzzy Logic controller for the AEV’s motor speed. If the control input (e.g., motor temperature) constantly crosses a sharp, fixed threshold, what is the major drawback of the Crisp Logic system compared to the Fuzzy system?',
      vi: 'Nhóm Dự án Eco-Routing đang lựa chọn giữa bộ điều khiển rõ (Crisp) tiêu chuẩn (ngưỡng cố định) và bộ điều khiển Logic mờ cho tốc độ động cơ của AEV. Nếu đầu vào điều khiển (ví dụ: nhiệt độ động cơ) liên tục vượt qua một ngưỡng cố định, sắc nét, nhược điểm lớn của hệ thống logic rõ so với hệ thống mờ là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'The crisp system will be significantly faster to compute.', vi: 'Hệ thống rõ sẽ có tốc độ tính toán nhanh hơn đáng kể.' },
      { key: 'B', en: 'The crisp system will cause abrupt and continuous oscillation (chattering) of the control action (e.g., emergency fan activation) near the boundary.', vi: 'Hệ thống rõ sẽ gây ra dao động đột ngột và liên tục (chattering) của hành động điều khiển (ví dụ: kích hoạt quạt khẩn cấp) gần ranh giới.' },
      { key: 'C', en: 'The Fuzzy Logic system will suffer from the combinatorial explosion of rules near the boundary.', vi: 'Hệ thống Logic mờ sẽ phải chịu sự bùng nổ tổ hợp các luật gần ranh giới.' },
      { key: 'D', en: 'Both systems will behave identically because temperature is a continuous variable.', vi: 'Cả hai hệ thống sẽ hoạt động giống hệt nhau vì nhiệt độ là một biến liên tục.' },
    ],
    answer: 'B',
  },
  {
    id: 'q14',
    bloom: { en: 'Evaluating', vi: 'Đánh giá' },
    prompt: {
      en: 'In Project Eco-Routing, the engineer uses a narrow (steep slope) Membership Function for the linguistic term "Battery is Low." What is the primary consequence of using a narrow Membership Function on the sensitivity and stability of the AEV\'s control system?',
      vi: 'Trong Dự án Eco-Routing, kỹ sư sử dụng một Hàm thành viên hẹp (độ dốc đứng) cho từ ngôn ngữ "Battery is Low". Hậu quả chính của việc sử dụng Hàm thành viên hẹp đối với độ nhạy và độ ổn định của hệ thống điều khiển AEV là gì?',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'It makes the system robust against sensor noise, ignoring small changes.', vi: 'Nó giúp hệ thống mạnh mẽ chống lại nhiễu cảm biến, bỏ qua các thay đổi nhỏ.' },
      { key: 'B', en: 'It increases the necessary size of the rule base exponentially.', vi: 'Nó làm tăng kích thước cần thiết của cơ sở luật theo cấp số nhân.' },
      { key: 'C', en: 'It increases the system\'s sensitivity, causing the AEV to switch control states rapidly and potentially leading to oscillatory behavior with small battery fluctuations.', vi: 'Nó làm tăng độ nhạy của hệ thống, khiến AEV chuyển đổi các trạng thái điều khiển nhanh chóng và có khả năng dẫn đến hành vi dao động với những biến động nhỏ của pin.' },
      { key: 'D', en: 'It guarantees that the Defuzzifier will use the Center of Gravity method.', vi: 'Nó đảm bảo rằng Bộ giải mờ sẽ sử dụng phương pháp Trọng tâm.' },
    ],
    answer: 'C',
  },
  {
    id: 'q15',
    bloom: { en: 'Creating', vi: 'Sáng tạo' },
    prompt: {
      en: 'Propose a Mamdani-type fuzzy rule for Project Eco-Routing designed to optimize the AEV\'s operational safety and resource management under worst-case scenarios, using the linguistic inputs: Traffic (High, Low) and Battery (Low, Adequate).',
      vi: 'Đề xuất một luật mờ kiểu Mamdani cho Dự án Eco-Routing được thiết kế để tối ưu hóa an toàn vận hành và quản lý tài nguyên của AEV trong các tình huống xấu nhất, sử dụng các đầu vào ngôn ngữ: Traffic (High, Low) và Battery (Low, Adequate).',
    },
    type: 'mcq',
    choices: [
      { key: 'A', en: 'IF Traffic IS High OR Battery IS Adequate THEN Route IS Aggressive.', vi: 'IF Traffic IS High OR Battery IS Adequate THEN Route IS Aggressive.' },
      { key: 'B', en: 'IF Traffic IS Low AND Battery IS Adequate THEN Route IS Standard.', vi: 'IF Traffic IS Low AND Battery IS Adequate THEN Route IS Standard.' },
      { key: 'C', en: 'IF Traffic IS High AND Battery IS Low THEN Route IS Cautious (Detour/Recharge).', vi: 'IF Traffic IS High AND Battery IS Low THEN Route IS Cautious (Detour/Recharge).' },
      { key: 'D', en: 'IF Traffic IS Low OR Battery IS Low THEN Route IS Aggressive.', vi: 'IF Traffic IS Low OR Battery IS Low THEN Route IS Aggressive.' },
    ],
    answer: 'C',
  },
]
