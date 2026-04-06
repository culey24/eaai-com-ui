import { Bot } from 'lucide-react'
import hcmutLogo from '../../assets/hcmut_logo/logo.png'

/**
 * ThinkingIndicator
 * Hiển thị khi agent đang xử lý câu trả lời.
 * Gồm: avatar bot (logo HCMUT) + animation "Đang suy nghĩ..."
 *
 * @param {string} [agentLabel] — nhãn hiển thị thay thế "Agent"
 */
export default function ThinkingIndicator({ agentLabel }) {
  return (
    <div className="flex gap-3.5 items-end animate-thinking-appear">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {agentLabel && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {agentLabel}
          </span>
        )}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary overflow-hidden">
          <img
            src={hcmutLogo}
            alt="Agent"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'flex'
            }}
          />
          <Bot
            className="w-4 h-4 text-white hidden items-center justify-center"
            aria-hidden
          />
        </div>
      </div>

      {/* Thinking bubble */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-soft flex items-center gap-1.5">
        <span className="text-[13px] text-slate-400 dark:text-slate-500 font-medium tracking-wide mr-1 italic select-none">
          Đang suy nghĩ
        </span>
        <span className="thinking-dot thinking-dot-1" />
        <span className="thinking-dot thinking-dot-2" />
        <span className="thinking-dot thinking-dot-3" />
      </div>
    </div>
  )
}
