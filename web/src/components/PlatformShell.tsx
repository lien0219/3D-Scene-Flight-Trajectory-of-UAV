import type { ReactNode } from 'react'
import { Boxes, Building2, Plane, Radio } from 'lucide-react'
import type { ProjectId } from '../lib/projectRoute'

interface Props {
  activeProject: ProjectId
  onSelectProject: (project: ProjectId) => void
  children: ReactNode
}

const projects = [
  { id: 'flight' as const, label: '飞行轨迹', shortLabel: '飞行', icon: Plane },
  { id: 'digital-twin' as const, label: '数字孪生', shortLabel: '孪生', icon: Building2 },
]

export default function PlatformShell({ activeProject, onSelectProject, children }: Props) {
  const active = projects.find((project) => project.id === activeProject) ?? projects[0]

  return (
    <main className="platform-shell">
      <aside className="platform-rail" aria-label="项目导航">
        <div className="platform-brand" aria-label="TwinSpace 多项目平台">
          <span className="platform-brand__mark"><Boxes size={20} strokeWidth={1.8} /></span>
          <span className="platform-brand__name">Twin<br />Space</span>
        </div>

        <nav className="platform-projects">
          {projects.map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="platform-project"
              data-active={activeProject === id}
              aria-current={activeProject === id ? 'page' : undefined}
              aria-label={label}
              title={label}
              onClick={() => onSelectProject(id)}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span className="platform-project__full">{label}</span>
              <span className="platform-project__short">{shortLabel}</span>
            </button>
          ))}
        </nav>

        <div className="platform-rail__status" title="平台服务正常">
          <Radio size={15} />
          <span>ONLINE</span>
        </div>
      </aside>

      <section className="platform-stage">
        <header className="platform-context">
          <span className="platform-context__eyebrow">PROJECT / 0{projects.indexOf(active) + 1}</span>
          <strong>{active.label}</strong>
          <span className="platform-context__status"><i />运行中</span>
        </header>
        {children}
      </section>
    </main>
  )
}
