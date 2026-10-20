import { useRef, useState } from 'react'
import { ArrowLeft, MessageSquare, Moon, PanelLeft, PanelRight, Plus, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtifactPanel } from '@/features/artifacts/ArtifactPanel'
import { ChatPanel } from '@/features/chat/ChatPanel'

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="navigation" aria-label="会话导航">
      <div className="brand" aria-label="Aion">aion<span aria-hidden="true">.</span></div>
      <Button className="new-session" variant="ghost" disabled><Plus aria-hidden="true" />新建会话</Button>
      <a className="current-session" href="#main" aria-current="page" onClick={onNavigate}><MessageSquare size={17} aria-hidden="true" />新任务</a>
      <div className="session-history"><h2>最近会话</h2></div>
      <div className="navigation-footer"><span className="local-avatar" aria-hidden="true">A</span><span>Aion 工作空间</span></div>
    </nav>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [showNavigation, setShowNavigation] = useState(true)
  const [showArtifacts, setShowArtifacts] = useState(false)
  const drawer = useRef<HTMLDialogElement>(null)
  const inspector = useRef<HTMLElement>(null)
  const inspectorToggle = useRef<HTMLButtonElement>(null)

  function handleToggleArtifacts() {
    setShowArtifacts(!showArtifacts)
    if (!showArtifacts) requestAnimationFrame(() => inspector.current?.focus())
  }

  function handleCloseArtifacts() {
    setShowArtifacts(false)
    inspectorToggle.current?.focus()
  }

  return (
    <div className="app-shell" data-theme={theme} data-navigation-open={showNavigation}>
      <a className="skip-link" href="#main">跳转到工作区</a>
      <aside className="desktop-navigation" id="desktop-navigation"><Navigation /></aside>
      <dialog className="navigation-drawer" ref={drawer} aria-label="会话导航抽屉">
        <Button variant="ghost" size="icon" className="drawer-close" aria-label="关闭导航" onClick={() => drawer.current?.close()}><X /></Button>
        <Navigation onNavigate={() => {
          drawer.current?.close()
          setShowArtifacts(false)
        }} />
      </dialog>
      <div className="workspace-shell">
        <header className="workspace-header">
          <div className="header-leading">
            <Button className="desktop-nav-toggle" variant="ghost" size="icon" aria-label={showNavigation ? '收起导航' : '展开导航'} aria-expanded={showNavigation} aria-controls="desktop-navigation" onClick={() => setShowNavigation(!showNavigation)}><PanelLeft /></Button>
            <Button className="mobile-nav-toggle" variant="ghost" size="icon" aria-label="打开导航" onClick={() => drawer.current?.showModal()}><PanelLeft /></Button>
            <span className="session-title">新任务</span>
          </div>
          <div className="header-actions">
            <Button variant="ghost" size="icon" aria-label={theme === 'light' ? '切换深色主题' : '切换浅色主题'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon /> : <Sun />}
            </Button>
            <Button ref={inspectorToggle} className="inspector-toggle" variant="ghost" aria-label={showArtifacts ? '收起产物面板' : '展开产物面板'} aria-expanded={showArtifacts} aria-controls="artifact-panel" onClick={handleToggleArtifacts}><PanelRight />产物</Button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="workbench" data-artifacts-open={showArtifacts}>
          <ChatPanel />
          <aside ref={inspector} id="artifact-panel" className="artifact-panel" tabIndex={-1} aria-label="产物审阅" hidden={!showArtifacts}>
            <header className="inspector-header"><h2>产物</h2><Button variant="ghost" size="icon" aria-label="返回任务" onClick={handleCloseArtifacts}><ArrowLeft /></Button></header>
            <ArtifactPanel />
          </aside>
        </main>
      </div>
    </div>
  )
}
