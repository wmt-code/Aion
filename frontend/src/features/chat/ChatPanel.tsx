import { useState } from 'react'
import { ArrowUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatPanel() {
  const [draft, setDraft] = useState('')

  return (
    <section className="chat-panel" aria-label="任务对话">
      <div className="task-sheet">
        <div className="welcome">
          <h1>今天，想完成什么？</h1>
        </div>
        <form className="composer" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="task">任务描述</label>
          <textarea
            id="task"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="描述你的目标，或从一个问题开始…"
            aria-describedby="draft-note"
            maxLength={12000}
            rows={4}
          />
          <div className="composer-actions">
            <div className="mode-control">
              <select aria-label="任务模式" defaultValue="plan">
                <option value="plan">计划 · 只读</option>
                <option value="execute">执行 · 允许写入</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
            <Button className="send-button" size="icon" type="submit" disabled aria-label="发送"><ArrowUp /></Button>
          </div>
        </form>
        <p id="draft-note" className={draft ? 'draft-note' : 'sr-only'}>草稿仅保留在当前页面，刷新后清空。{draft.length > 0 && <span>{draft.length.toLocaleString()} / 12,000</span>}</p>
      </div>
    </section>
  )
}
