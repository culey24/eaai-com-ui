import { mcq3, txt } from './common.js'

export const fuzzyLogic = [
  mcq3(
    'Remembering',
    'Essential range for the degree of membership in a fuzzy set?',
    'Miền giá trị cơ bản cho độ thuộc của một tập mờ?',
    { en: 'Only 0 or 1', vi: 'Chỉ 0 hoặc 1' },
    { en: 'Any real number', vi: 'Bất kỳ số thực' },
    { en: 'A value in [0, 1]', vi: 'Giá trị trong [0, 1]' }
  ),
  mcq3(
    'Remembering',
    'Which FIS component turns fuzzy output into a single crisp value?',
    'Thành phần FIS nào chuyển đầu ra mờ thành một giá trị crisp?',
    { en: 'Fuzzifier', vi: 'Bộ mờ hóa' },
    { en: 'Inference Engine', vi: 'Cơ chế suy luận' },
    { en: 'Defuzzifier', vi: 'Bộ khử mờ' }
  ),
  mcq3(
    'Understanding',
    'For standard fuzzy Max operator, membership of A ∪ B is:',
    'Với toán tử Max chuẩn, độ thuộc của A ∪ B là:',
    { en: 'Min(μA(x), μB(x))', vi: 'Min(μA(x), μB(x))' },
    { en: 'Max(μA(x), μB(x))', vi: 'Max(μA(x), μB(x))' },
    { en: '1 - μA(x)', vi: '1 - μA(x)' }
  ),
  mcq3(
    'Understanding',
    'Primary limitation of Boolean (crisp) logic for concepts like "Hot" or "Fast"?',
    'Hạn chế chính của logic Boolean với khái niệm như "Nóng" hay "Nhanh"?',
    {
      en: 'It requires too many complex functions.',
      vi: 'Đòi hỏi quá nhiều hàm phức tạp.',
    },
    {
      en: 'Binary 0/1 fails to capture partial truth.',
      vi: 'Chỉ 0/1, không gắn được "độ thật một phần".',
    },
    { en: 'It only works with discrete variables.', vi: 'Chỉ làm việc biến rời rạc.' }
  ),
  mcq3(
    'Applying',
    'IF Pressure High (μ=0.9) AND Temperature Low (μ=0.5) THEN Valve Closed. Min-AND firing strength is:',
    'Luật AND dùng Min: cường độ kích hoạt là:',
    { en: '0.9', vi: '0,9' },
    { en: '0.5', vi: '0,5' },
    { en: '0.7', vi: '0,7' }
  ),
  mcq3(
    'Applying',
    'Trapezoid MF: 50 km/h → μ=1.0, 70 km/h → μ=0.5. Method used?',
    'Hàm thang: 50 km/h có μ=1,0; 70 km/h có μ=0,5. Phương pháp gán?',
    { en: 'Expert knowledge (Heuristics)', vi: 'Tri thức chuyên gia (heuristic)' },
    { en: 'Random Assignment', vi: 'Gán ngẫu nhiên' },
    { en: 'Statistical Regression', vi: 'Hồi quy thống kê' }
  ),
  mcq3(
    'Analyzing',
    'Why is choice and shape of membership functions critical in fuzzy control?',
    'Vì sao chọn/chọn dạng hàm thành viên quan trọng trong điều khiển mờ?',
    {
      en: 'They define how inputs are interpreted and what linguistic terms mean.',
      vi: 'Chúng định nghĩa cách hiểu đầu vào và ý nghĩa thuật ngữ ngôn ngữ.',
    },
    { en: 'They only affect defuzzification.', vi: 'Chỉ ảnh hưởng bước khử mờ.' },
    { en: 'Chosen randomly as long as range is covered.', vi: 'Chọn ngẫu nhiên nếu phủ miền.' }
  ),
  mcq3(
    'Analyzing',
    'Fundamental difference between Mamdani and Sugeno FIS outputs?',
    'Khác biệt cơ bản giữa đầu ra Mamdani và Sugeno?',
    {
      en: 'Mamdani: fuzzy set outputs; Sugeno: crisp/math functions.',
      vi: 'Mamdani: đầu ra tập mờ; Sugeno: hàm crisp/toán.',
    },
    {
      en: 'Mamdani for classification only; Sugeno for control.',
      vi: 'Mamdani chỉ phân loại; Sugeno chỉ điều khiển.',
    },
    { en: 'Mamdani faster; Sugeno more accurate.', vi: 'Mamdani nhanh hơn; Sugeno chính xác hơn.' }
  ),
  txt(
    'Evaluating',
    'Compare sharp-threshold vs fuzzy control for chemical mixing: which yields smoother actions and why?',
    'So sánh điều khiển ngưỡng cứng và mờ cho pha trộn hóa chất: cái nào mượt hơn, vì sao?',
    'Short answer (English).',
    'Có thể thêm tiếng Việt.'
  ),
  txt(
    'Creating',
    'Propose one linguistic rule for a room thermostat using Room Temperature (Cold/Perfect/Hot) and Change Rate (Falling/Stable/Rising).',
    'Đề xuất một luật ngôn ngữ cho bộ điều nhiệt phòng với nhiệt độ phòng và tốc độ thay đổi.',
    'IF … THEN … (English preferred).',
    'Có thể song ngữ ngắn.'
  ),
]
