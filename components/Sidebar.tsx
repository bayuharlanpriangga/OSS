'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  BarChart3,
  Bot,
  Clock,
  Code2,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GitBranch,
  GitMerge,
  Grid2x2,
  Hash,
  Layers,
  LayoutGrid,
  LineChart,
  Moon,
  PieChart,
  Plus,
  Scale,
  ScatterChart,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Table2,
  Target,
  TrendingUp,
  Upload,
  Workflow,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { callOss } from '@/lib/oss-scripts';

function AnalyzeIcon({ sub }: { sub: string }) {
  const props = { size: 15, strokeWidth: 1.8 };
  switch (sub) {
    case 'descriptive':
      return <Activity {...props} />;
    case 'ttest':
      return <FlaskConical {...props} />;
    case 'rmanova':
      return <BarChart2 {...props} />;
    case 'correlation':
      return <ScatterChart {...props} />;
    case 'regression':
      return <TrendingUp {...props} />;
    case 'nonparam':
      return <Hash {...props} />;
    case 'glm':
      return <Sliders {...props} />;
    case 'hlm':
      return <Layers {...props} />;
    case 'reliability':
      return <ShieldCheck {...props} />;
    case 'crosstab':
      return <Grid2x2 {...props} />;
    case 'efa':
      return <Target {...props} />;
    case 'sem':
      return <Workflow {...props} />;
    case 'mediation':
      return <GitMerge {...props} />;
    case 'charts':
      return <PieChart {...props} />;
    case 'discriminant':
      return <GitBranch {...props} />;
    case 'cluster':
      return <Cpu {...props} />;
    case 'missinganalysis':
      return <AlertTriangle {...props} />;
    case 'roc':
      return <LineChart {...props} />;
    case 'survival':
      return <Clock {...props} />;
    case 'poweranalysis':
      return <Zap {...props} />;
    case 'moderation':
      return <Sparkles {...props} />;
    case 'impute':
      return <Wrench {...props} />;
    case 'bayesian':
      return <Award {...props} />;
    case 'timeseries':
      return <Clock {...props} />;
    case 'metaanalysis':
      return <BarChart3 {...props} />;
    default:
      return <Activity {...props} />;
  }
}

interface SideItemProps {
  tab?: string;
  sub?: string;
  active?: boolean;
  icon: ReactNode;
  label: ReactNode;
  onClick: () => void;
}

function SideItem({ tab, sub, active, icon, label, onClick }: SideItemProps) {
  return (
    <button
      type="button"
      className={`s-item${active ? ' active' : ''}`}
      data-tab={tab}
      data-sub={sub}
      onClick={onClick}
    >
      <span className="s-item-ic" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

const ANALYZE_MENU = [
  { sub: 'descriptive', group: 'descriptive', label: 'Descriptive' },
  { sub: 'ttest', group: 'ttest', label: 'T-Test' },
  { sub: 'rmanova', group: 'anova', label: 'ANOVA' },
  { sub: 'correlation', group: 'correlation', label: 'Correlation' },
  { sub: 'regression', group: 'regression', label: 'Regression' },
  { sub: 'nonparam', group: 'nonparam', label: 'Nonparametric' },
  { sub: 'glm', group: 'glm', label: 'General Linear Model' },
  { sub: 'hlm', group: 'hlm', label: 'Hierarchical Linear Model' },
  { sub: 'reliability', group: 'reliability', label: 'Reliability' },
  { sub: 'crosstab', group: 'crosstab', label: 'Crosstab' },
  { sub: 'efa', group: 'factor', label: 'Factor Analysis' },
  { sub: 'sem', group: 'sem', label: 'SEM' },
  { sub: 'mediation', group: 'mediation', label: 'Mediation' },
  { sub: 'charts', group: 'charts', label: 'Charts' },
  { sub: 'discriminant', group: 'discriminant', label: 'Discriminant' },
  { sub: 'cluster', group: 'cluster', label: 'Cluster Analysis' },
  { sub: 'missinganalysis', group: 'missinganalysis', label: 'Missing Analysis' },
  { sub: 'roc', group: 'roc', label: 'ROC Curve' },
  { sub: 'survival', group: 'survival', label: 'Survival Analysis' },
  { sub: 'poweranalysis', group: 'poweranalysis', label: 'Power Analysis' },
  { sub: 'moderation', group: 'moderation', label: 'Moderation' },
  { sub: 'impute', group: 'imputation', label: 'Imputation' },
  { sub: 'bayesian', group: 'bayesian', label: 'Bayesian Analysis' },
  { sub: 'timeseries', group: 'timeseries', label: 'Time Series' },
  { sub: 'metaanalysis', group: 'metaanalysis', label: 'Meta-Analysis' },
] as const;

export default function Sidebar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(t);
    };
    const raf = requestAnimationFrame(sync);
    window.addEventListener('oss-theme-change', sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('oss-theme-change', sync);
    };
  }, []);

  return (
    <aside id="side" onClick={(e) => e.stopPropagation()} aria-label="Navigasi utama">
      <div className="s-brand">
        <div className="s-brand-left">
          <div className="orias-prism-mark" aria-hidden="true">
            <div className="orias-prism-left" />
            <div className="orias-prism-right" />
            <div className="orias-prism-core" />
          </div>
          <span className="s-brand-title">OSS</span>
        </div>
        <div className="s-brand-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={() => window.__ossToggleTheme?.()}
            title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
          <button
            className="icon-btn s-close-mobile"
            type="button"
            onClick={() => callOss('closeSide')}
            title="Tutup menu"
            aria-label="Tutup menu navigasi"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="s-logo">
        <span
          id="oss-unsaved-dot"
          className="s-logo-unsaved"
          title="Ada perubahan belum tersimpan"
        />
        <span>Perubahan belum tersimpan</span>
      </div>

      <nav className="s-body">
        <div className="s-cat">Data</div>
        <SideItem
          tab="data"
          active
          onClick={() => callOss('switchTab', 'data')}
          icon={<BarChart3 size={15} strokeWidth={1.8} />}
          label="Data View"
        />
        <SideItem
          tab="variable"
          onClick={() => callOss('switchTab', 'variable')}
          icon={<Table2 size={15} strokeWidth={1.8} />}
          label="Variables"
        />

        <div className="s-cat">Analyze</div>
        {ANALYZE_MENU.map((item) => (
          <SideItem
            key={item.sub}
            tab="analyze"
            sub={item.sub}
            onClick={() => callOss('openAnalyze', item.sub, item.group)}
            icon={<AnalyzeIcon sub={item.sub} />}
            label={item.label}
          />
        ))}

        <div className="s-cat">Datasets</div>
        <div id="ds-list-side" />
        <button
          type="button"
          className="s-ds-add"
          onClick={() => callOss('showAddDatasetModal')}
        >
          <Plus size={14} strokeWidth={2} />
          <span>Dataset Baru</span>
        </button>

        <div className="s-cat">Transform</div>
        <SideItem
          tab="analyze"
          sub="transform"
          onClick={() => callOss('openAnalyze', 'transform', 'transform')}
          icon={<Wrench size={15} strokeWidth={1.8} />}
          label="Transform & Recode"
        />
        <SideItem
          tab="analyze"
          sub="weightcases"
          onClick={() => callOss('openAnalyze', 'weightcases', 'weightcases')}
          icon={<Scale size={15} strokeWidth={1.8} />}
          label={
            <>
              Weight Cases
              <span id="wc-badge" className="s-count-tag" style={{ display: 'none' }}>
                ON
              </span>
            </>
          }
        />

        <div className="s-cat">Tools</div>
        <SideItem
          tab="syntax"
          onClick={() => callOss('switchTab', 'syntax')}
          icon={<Code2 size={15} strokeWidth={1.8} />}
          label="Syntax"
        />
        <SideItem
          tab="pivot"
          onClick={() => callOss('switchTab', 'pivot')}
          icon={<LayoutGrid size={15} strokeWidth={1.8} />}
          label="Pivot Table"
        />
        <SideItem
          tab="ai"
          onClick={() => callOss('switchTab', 'ai')}
          icon={<Bot size={15} strokeWidth={1.8} />}
          label="Orias AI"
        />
        <SideItem
          tab="output"
          onClick={() => callOss('switchTab', 'output')}
          icon={<Download size={15} strokeWidth={1.8} />}
          label={
            <>
              Output
              <span id="out-badge" className="s-count-tag" style={{ display: 'none' }}>
                0
              </span>
            </>
          }
        />
      </nav>

      <div className="s-foot">
        <div className="s-badges">
          <div className="s-badge sb-cases" id="badge-cases">N=0 kasus</div>
          <div className="s-badge sb-miss" id="badge-miss">
            <AlertTriangle size={12} strokeWidth={2.2} />
            <span>0 missing</span>
          </div>
        </div>

        <div id="sidebar-install-wrap" style={{ marginBottom: '6px' }}>
          <button
            id="sidebar-install-btn"
            type="button"
            onClick={() => callOss('installPWA')}
            title="Install OSS sebagai aplikasi"
          >
            <Download size={13} strokeWidth={2} />
            <span id="sidebar-install-label">Install App</span>
          </button>
        </div>

        <div className="s-acts">
          <button
            className="s-act"
            type="button"
            onClick={() => callOss('openCmd')}
            title="Cari perintah"
            aria-label="Cari perintah"
          >
            <Search size={13} strokeWidth={2} />
          </button>
          <button
            className="s-act"
            type="button"
            onClick={() => callOss('exportDataCSV')}
            title="Ekspor data ke CSV"
            aria-label="Ekspor data ke CSV"
          >
            <Download size={11} strokeWidth={2} />
            <span>CSV</span>
          </button>
          <button
            className="s-act"
            type="button"
            onClick={() => document.getElementById('csv-input')?.click()}
            title="Impor data CSV"
            aria-label="Impor data CSV"
          >
            <Upload size={11} strokeWidth={2} />
            <span>CSV</span>
          </button>
          <button
            className="s-act"
            type="button"
            onClick={() => callOss('exportToExcel')}
            title="Ekspor hasil ke Excel"
            aria-label="Ekspor hasil ke Excel"
          >
            <FileSpreadsheet size={12} strokeWidth={2} />
          </button>
          <button
            className="s-act"
            type="button"
            onClick={() => callOss('exportWordDialog')}
            title="Ekspor hasil ke Word"
            aria-label="Ekspor hasil ke Word"
          >
            <FileText size={12} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
