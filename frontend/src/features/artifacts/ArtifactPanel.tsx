import { FileText, Files, GitCompareArrows, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const views = [
  { value: 'artifacts', label: '成果', icon: FileText, title: '暂无成果' },
  { value: 'files', label: '文件', icon: Files, title: '暂无文件' },
  { value: 'changes', label: '变更', icon: GitCompareArrows, title: '暂无变更' },
  { value: 'output', label: '记录', icon: List, title: '暂无记录' },
]

export function ArtifactPanel() {
  return (
    <Tabs defaultValue="artifacts" className="review-content">
      <TabsList className="review-tabs" aria-label="审阅内容">
        {views.map(({ value, label }) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
      </TabsList>
      {views.map(({ value, icon: Icon, title }) => (
        <TabsContent key={value} value={value}>
          <div className="artifact-empty">
            <Icon size={28} strokeWidth={1.3} aria-hidden="true" />
            <h3>{title}</h3>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
