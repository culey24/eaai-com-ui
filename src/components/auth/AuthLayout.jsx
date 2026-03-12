export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary/5 p-6">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-secondary mb-6 shadow-glow-secondary">
            <span className="text-white text-4xl font-bold">BK</span>
          </div>
          <h1 className="text-secondary text-xl font-bold uppercase tracking-tight">
            ĐẠI HỌC QUỐC GIA TP.HỒ CHÍ MINH
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Trường Đại học Bách Khoa</p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-slate-100">
          {children}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          Nền tảng Chatbot đa nhiệm dành cho sinh viên
        </p>
      </div>
    </div>
  )
}
