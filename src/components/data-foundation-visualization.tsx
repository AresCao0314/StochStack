'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  FileText, 
  Building2, 
  Globe, 
  Layers, 
  Cpu,
  ChevronRight,
  ChevronDown,
  Shield,
  Clock,
  User,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Microscope,
  Stethoscope,
  FlaskConical,
  MapPin,
  Activity,
  Users,
  Beaker
} from 'lucide-react';

// ============================================================================
// Types & Data Structures
// ============================================================================

type ProjectKey = 'authoring' | 'feasibility' | 'simulation';

interface DataObject {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface GovernanceField {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface LayerData {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  projects: Record<ProjectKey, {
    objects: DataObject[];
    owner: string;
    refresh: string;
    compliance: string[];
    kpis: string[];
  }>;
}

// ============================================================================
// Data Definition
// ============================================================================

const PROJECTS: Record<ProjectKey, { label: string; icon: React.ReactNode; color: string }> = {
  authoring: {
    label: 'Clinical Authoring 2.0',
    icon: <FileText className="w-4 h-4" />,
    color: '#6366f1'
  },
  feasibility: {
    label: 'Site Feasibility',
    icon: <MapPin className="w-4 h-4" />,
    color: '#10b981'
  },
  simulation: {
    label: 'Trial Simulation',
    icon: <Activity className="w-4 h-4" />,
    color: '#f59e0b'
  }
};

const LAYERS: LayerData[] = [
  {
    id: 0,
    title: 'Layer 0',
    subtitle: 'Source Systems',
    icon: <Database className="w-5 h-5" />,
    color: '#0ea5e9',
    bgColor: 'bg-sky-50',
    projects: {
      authoring: {
        objects: [
          { name: 'Document authoring', description: 'Word Add-in, Docuvera, AlphaLife drafts', icon: <FileText className="w-4 h-4" /> },
          { name: 'RIM/Approval', description: '文档状态、审批流、签署记录、eTMF', icon: <CheckCircle2 className="w-4 h-4" /> },
          { name: 'References', description: '参考文献库、TFL输出、SDTM/ADaM', icon: <BookIcon /> }
        ],
        owner: 'Medical Writing + Vendor IT + QMS/QA',
        refresh: '事件驱动 + 每日增量',
        compliance: ['21 CFR Part 11 / EU Annex 11', 'GxP版本不可篡改', '审计追踪完整', '访问分级'],
        kpis: ['文档版本链完整率', '审批事件缺失率', '元数据一致性']
      },
      feasibility: {
        objects: [
          { name: 'Trial Registry', description: 'CT.gov/CTIS 试验-中心-研究者信息', icon: <Globe className="w-4 h-4" /> },
          { name: 'CTMS Data', description: 'Site启动/入组/监查/关中心里程碑', icon: <Building2 className="w-4 h-4" /> },
          { name: 'Vendor Performance', description: 'Central lab/Imaging/IRT timelines', icon: <Users className="w-4 h-4" /> }
        ],
        owner: 'ClinOps + Data Platform + Market Intel',
        refresh: 'Registry每周~每日; CTMS每日',
        compliance: ['使用条款合规', 'PII分级与最小权限', '数据主权'],
        kpis: ['站点匹配成功率', 'CTMS关键字段缺失率', '去重准确率']
      },
      simulation: {
        objects: [
          { name: 'Ops Timeline', description: 'CTMS/IRT历史运营轨迹', icon: <Clock className="w-4 h-4" /> },
          { name: 'EDC Aggregation', description: '入组/脱落/终点数据时间轨迹', icon: <BarChart3 className="w-4 h-4" /> },
          { name: 'Assumptions', description: '入组假设、Screen fail率、Site capacity', icon: <FlaskConical className="w-4 h-4" /> }
        ],
        owner: 'Stats/BDS + ClinOps + Data Platform',
        refresh: '历史数据按月/季度; 参数随时更新',
        compliance: ['去标识/聚合数据优先', 'DPIA/合规评审', '可追溯性要求'],
        kpis: ['事件序列完整率', '参数版本可追溯率', '数据时间一致性']
      }
    }
  },
  {
    id: 1,
    title: 'Layer 1',
    subtitle: 'Landing / Raw',
    icon: <Layers className="w-5 h-5" />,
    color: '#8b5cf6',
    bgColor: 'bg-violet-50',
    projects: {
      authoring: {
        objects: [
          { name: 'raw_<system>_<entity>', description: '原始抽取文件/表(JSON/CSV/parquet/docx)', icon: <FileIcon /> },
          { name: 'raw_extract_log', description: '抽取批次、行数、哈希、源系统版本', icon: <LogIcon /> },
          { name: 'raw_access_tags', description: 'PII/GxP/Region标签', icon: <TagIcon /> }
        ],
        owner: 'Data Platform / Data Engineering',
        refresh: '与抽取一致(近实时/每日/每周)',
        compliance: ['WORM-like策略', '数据主权', 'EU数据落EU域'],
        kpis: ['抽取成功率', '延迟Freshness SLA', '行数/哈希一致性', '权限标签覆盖率']
      },
      feasibility: {
        objects: [
          { name: 'raw_ctgov_trials', description: 'CT.gov原始JSON/XML', icon: <Globe className="w-4 h-4" /> },
          { name: 'raw_ctms_sites', description: 'CTMS站点原始数据', icon: <Building2 className="w-4 h-4" /> },
          { name: 'raw_extract_metadata', description: '抽取元数据与血缘', icon: <Database className="w-4 h-4" /> }
        ],
        owner: 'Data Platform / Data Engineering',
        refresh: '每日增量抽取',
        compliance: ['WORM-like策略', '数据主权合规', '审计日志完整'],
        kpis: ['抽取成功率', 'Schema漂移监控', '血缘覆盖率']
      },
      simulation: {
        objects: [
          { name: 'raw_ops_events', description: '运营事件原始序列', icon: <Clock className="w-4 h-4" /> },
          { name: 'raw_enrollment_curves', description: '入组曲线原始数据', icon: <BarChart3 className="w-4 h-4" /> },
          { name: 'raw_assumption_versions', description: '假设版本原始记录', icon: <FileText className="w-4 h-4" /> }
        ],
        owner: 'Data Platform / Data Engineering',
        refresh: '按源系统频率(每日/每周)',
        compliance: ['患者级数据额外审批', 'WORM-like策略', '版本锁定'],
        kpis: ['数据延迟', '版本一致性', '抽取完整性']
      }
    }
  },
  {
    id: 2,
    title: 'Layer 2',
    subtitle: 'Conformed / Clean',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    projects: {
      authoring: {
        objects: [
          { name: 'doc_object', description: 'doc_id, study_id, doc_type, version, status', icon: <FileText className="w-4 h-4" /> },
          { name: 'doc_event', description: 'create/edit/submit/approve/reject事件', icon: <Clock className="w-4 h-4" /> },
          { name: 'doc_section_raw', description: '章节文本/段落/表格抽取', icon: <Layers className="w-4 h-4" /> },
          { name: 'reference_citation', description: '引用条目、位置、来源', icon: <BookIcon /> }
        ],
        owner: 'Medical Writing Ops + Data Eng',
        refresh: '每日增量 + 关键事件准实时',
        compliance: ['保留定位信息支持审计', '角色权限控制', 'Comment敏感性分级'],
        kpis: ['章节抽取覆盖率', '事件序列闭环率', 'Study/Doc类型一致性']
      },
      feasibility: {
        objects: [
          { name: 'trial_registry_trial', description: '试验级清洗数据', icon: <Microscope className="w-4 h-4" /> },
          { name: 'trial_registry_site', description: '中心级清洗数据', icon: <MapPin className="w-4 h-4" /> },
          { name: 'trial_registry_investigator', description: '研究者级清洗数据', icon: <User className="w-4 h-4" /> },
          { name: 'ctms_site_milestone', description: '启动/筛选/FPI/LPI/close', icon: <CheckCircle2 className="w-4 h-4" /> },
          { name: 'site_performance_observed', description: '历史表现聚合', icon: <BarChart3 className="w-4 h-4" /> }
        ],
        owner: 'ClinOps Analytics/BI + Data Eng',
        refresh: 'Registry每周/每日; CTMS每日',
        compliance: ['PII处理合规', '匹配规则版本化', '研究者信息保护'],
        kpis: ['匹配召回/精度', '里程碑缺失率', '异常日期率', 'Schema漂移监控']
      },
      simulation: {
        objects: [
          { name: 'ops_event_timeline', description: '聚合事件序列', icon: <Clock className="w-4 h-4" /> },
          { name: 'enrollment_curve_actual', description: '真实入组曲线', icon: <Activity className="w-4 h-4" /> },
          { name: 'dropout_rate_actual', description: '按时间窗/国家/中心', icon: <Users className="w-4 h-4" /> },
          { name: 'supply_event', description: '供药/补货/缺货事件', icon: <Beaker className="w-4 h-4" /> }
        ],
        owner: 'Stats/BDS + ClinOps + Data Eng',
        refresh: '每日/每周; 历史回填按批',
        compliance: ['默认聚合到site级以上', '患者级额外审批', '清洗规则版本化'],
        kpis: ['事件时间戳一致性', '曲线可重建率', '异常波动检测']
      }
    }
  },
  {
    id: 3,
    title: 'Layer 3',
    subtitle: 'Semantic / Canonical',
    icon: <Globe className="w-5 h-5" />,
    color: '#f97316',
    bgColor: 'bg-orange-50',
    projects: {
      authoring: {
        objects: [
          { name: 'canonical_document', description: 'Study×DocType×Version权威对象', icon: <FileText className="w-4 h-4" /> },
          { name: 'canonical_section', description: '标准章节树: CSR/Protocol/SAP映射', icon: <Layers className="w-4 h-4" /> },
          { name: 'canonical_statement', description: '关键声明结构化片段', icon: <CheckCircle2 className="w-4 h-4" /> },
          { name: 'traceability_link', description: '文本片段↔数据表↔证据↔审批记录', icon: <LinkIcon /> },
          { name: 'terminology_map', description: '术语表: 定义/同义词/缩写', icon: <BookIcon /> }
        ],
        owner: 'Medical Writing + Data Governance + QA',
        refresh: '事件驱动(版本发布) + 每日同步',
        compliance: ['证据链可追溯', '章节复用标注来源', '防止跨试验误用'],
        kpis: ['Traceability覆盖率', '章节标准映射一致率', '术语一致性']
      },
      feasibility: {
        objects: [
          { name: 'canonical_study/site/investigator', description: '统一ID体系', icon: <Database className="w-4 h-4" /> },
          { name: 'canonical_site_capacity', description: '容量/经验/适应症能力标签', icon: <Building2 className="w-4 h-4" /> },
          { name: 'canonical_performance_metrics', description: '统一口径KPI', icon: <BarChart3 className="w-4 h-4" /> },
          { name: 'feasibility_ruleset', description: '规则集版本: 权重/阈值/例外', icon: <Shield className="w-4 h-4" /> }
        ],
        owner: 'ClinOps + Data Governance',
        refresh: '每日/每周; 能力标签月更',
        compliance: ['规则透明可解释', '权重版本可追溯', '敏感人事评价控制'],
        kpis: ['统一ID覆盖率', '指标口径一致性', '规则版本使用合规率']
      },
      simulation: {
        objects: [
          { name: 'simulation_input_profile', description: '试验设计参数', icon: <Microscope className="w-4 h-4" /> },
          { name: 'simulation_assumption_registry', description: '假设库: Screen fail/Cycle time分布', icon: <FlaskConical className="w-4 h-4" /> },
          { name: 'simulation_calibration_dataset', description: '用于校准的历史基线', icon: <Activity className="w-4 h-4" /> }
        ],
        owner: 'Stats/BDS + ClinOps + Governance',
        refresh: '按项目迭代',
        compliance: ['假设可审计', '审批与版本控制', '可追溯要求'],
        kpis: ['假设覆盖率', '校准数据版本一致性', '复现实验成功率']
      }
    }
  },
  {
    id: 4,
    title: 'Layer 4',
    subtitle: 'Data Products / Feature Store',
    icon: <Cpu className="w-5 h-5" />,
    color: '#14b8a6',
    bgColor: 'bg-teal-50',
    projects: {
      authoring: {
        objects: [
          { name: 'authoring_context_api', description: '按study拉取: 段落/表格/引用/差异', icon: <FileText className="w-4 h-4" /> },
          { name: 'content_reuse_library', description: '可复用段落/表述', icon: <Layers className="w-4 h-4" /> },
          { name: 'doc_consistency_checks', description: 'Protocol vs SAP vs CSR冲突检测', icon: <AlertCircle className="w-4 h-4" /> },
          { name: 'vector_index_sections', description: '章节向量索引', icon: <Database className="w-4 h-4" /> }
        ],
        owner: 'Medical Writing Product Owner + Data/AI Platform',
        refresh: '文档版本发布后即时; 索引每日重建',
        compliance: ['AI生成标注来源与置信度', '不得覆盖原文事实', '人在回路策略'],
        kpis: ['检索命中率', '冲突检测Precision', '索引新鲜度SLA']
      },
      feasibility: {
        objects: [
          { name: 'site_scorecard', description: '综合评分卡: 维度分/总分/解释', icon: <BarChart3 className="w-4 h-4" /> },
          { name: 'ranking_service_features', description: '特征表: 历史表现/适应症匹配', icon: <Database className="w-4 h-4" /> },
          { name: 'human_feedback_log', description: '终端用户反馈: 加权/减权理由', icon: <Users className="w-4 h-4" /> },
          { name: 'monitoring_dashboard_mart', description: '漏斗: 候选→联系→启动→入组', icon: <Activity className="w-4 h-4" /> }
        ],
        owner: 'ClinOps Product Owner + DS + Platform',
        refresh: '每日/准实时; 反馈实时写入',
        compliance: ['反馈数据审计与权限控制', '偏见风险监控', '回写CTMS受控流程'],
        kpis: ['Score稳定性', '解释可用率', '反馈闭环率', '使用转化率']
      },
      simulation: {
        objects: [
          { name: 'simulation_run', description: '每次仿真运行记录', icon: <Clock className="w-4 h-4" /> },
          { name: 'scenario_library', description: '场景库: best/base/worst/国家策略', icon: <Layers className="w-4 h-4" /> },
          { name: 'digital_twin_dashboard_mart', description: '预测曲线/置信区间/敏感性分析', icon: <BarChart3 className="w-4 h-4" /> }
        ],
        owner: 'Stats/BDS + ClinOps Strategy + Platform',
        refresh: '按需运行; 结果持续沉淀',
        compliance: ['仿真=决策支持≠事实报告', '输出用途分级', '对外/对内可用范围'],
        kpis: ['复现率Reproducibility', '校准误差Backtesting MAPE', '敏感性覆盖率']
      }
    }
  },
  {
    id: 5,
    title: 'Layer 5',
    subtitle: 'Apps / Agents',
    icon: <Cpu className="w-5 h-5" />,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    projects: {
      authoring: {
        objects: [
          { name: 'Authoring Copilot', description: '起草/改写/一致性检查/引用建议', icon: <Cpu className="w-4 h-4" /> },
          { name: 'Evidence Navigator', description: '点到句子→回到证据源→显示版本', icon: <Eye className="w-4 h-4" /> },
          { name: 'Controlled generation log', description: 'Prompt/上下文/输出/引用/确认', icon: <Lock className="w-4 h-4" /> }
        ],
        owner: 'Medical Writing + QA/Compliance + AI Platform',
        refresh: '实时交互',
        compliance: ['人在回路HITL策略与记录', '生成内容不可自动进入受控文件', '人工确认要求'],
        kpis: ['引用覆盖率', '人工采纳率/修改率', '高风险用法触发率']
      },
      feasibility: {
        objects: [
          { name: 'Q&A筛选界面', description: '输入TA/phase/country→候选→解释→导出', icon: <Globe className="w-4 h-4" /> },
          { name: 'RLHF反馈界面', description: '加权/减权 + 证据说明', icon: <Users className="w-4 h-4" /> },
          { name: 'CTMS回写任务', description: '生成site outreach list/CTMS任务', icon: <Building2 className="w-4 h-4" /> }
        ],
        owner: 'ClinOps + Vendor Mgmt + Data/AI Platform',
        refresh: '实时/每日',
        compliance: ['回写CTMS受控流程', '权限/审计/回滚策略', '决策透明度'],
        kpis: ['使用转化率', '决策时间缩短', '误导率(解释不可信标记)']
      },
      simulation: {
        objects: [
          { name: '场景对话构建', description: '改参数→即时出曲线→解释敏感性', icon: <Activity className="w-4 h-4" /> },
          { name: '决策备忘录生成', description: '场景/假设/结果自动生成summary', icon: <FileText className="w-4 h-4" /> }
        ],
        owner: 'Stats/BDS + ClinOps Leadership + AI Platform',
        refresh: '按需',
        compliance: ['输出对外/对内可用范围', '监管沟通材料分级', '可审计要求'],
        kpis: ['预测命中(回测)', '决策一致性', '审计可追溯Run记录完整率']
      }
    }
  }
];

const UNIFIED_GOVERNANCE = [
  { key: 'source_system', label: 'Source System', icon: <Database className="w-3 h-3" /> },
  { key: 'source_object', label: 'Source Object', icon: <FileText className="w-3 h-3" /> },
  { key: 'extract_batch_id', label: 'Extract Batch ID', icon: <RefreshCw className="w-3 h-3" /> },
  { key: 'extract_ts', label: 'Extract Timestamp', icon: <Clock className="w-3 h-3" /> },
  { key: 'study_id_canonical', label: 'Study ID (Canonical)', icon: <Microscope className="w-3 h-3" /> },
  { key: 'gxp_flag', label: 'GxP Flag', icon: <Shield className="w-3 h-3" /> },
  { key: 'pii_flag', label: 'PII Flag', icon: <Lock className="w-3 h-3" /> },
  { key: 'region_flag', label: 'Region Flag', icon: <Globe className="w-3 h-3" /> },
  { key: 'data_quality_score', label: 'Data Quality Score', icon: <BarChart3 className="w-3 h-3" /> },
  { key: 'access_policy_id', label: 'Access Policy ID', icon: <Eye className="w-3 h-3" /> }
];

// ============================================================================
// Icon Components
// ============================================================================

function BookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FileIcon() {
  return <FileText className="w-4 h-4" />;
}

function LogIcon() {
  return <Clock className="w-4 h-4" />;
}

function TagIcon() {
  return <Shield className="w-4 h-4" />;
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ProjectBadge({ projectKey, active, onClick }: { projectKey: ProjectKey; active: boolean; onClick: () => void }) {
  const project = PROJECTS[projectKey];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active 
          ? 'ring-2 ring-offset-1' 
          : 'opacity-60 hover:opacity-100'
      }`}
      style={{ 
        backgroundColor: active ? `${project.color}20` : '#f3f4f6',
        color: project.color,
        boxShadow: active ? `0 0 0 2px white, 0 0 0 4px ${project.color}` : 'none'
      }}
    >
      {project.icon}
      <span>{project.label}</span>
    </button>
  );
}

function ObjectCard({ obj, color }: { obj: DataObject; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-2 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
        {obj.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{obj.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{obj.description}</p>
      </div>
    </div>
  );
}

function GovernanceCard() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">统一治理字段</h3>
        <span className="text-xs text-gray-500">(所有层/项目通用)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {UNIFIED_GOVERNANCE.map((field) => (
          <div key={field.key} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100">
            <span className="text-gray-400">{field.icon}</span>
            <span className="text-xs text-gray-600">{field.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

}

function LayerCard({ layer, activeProject }: { layer: LayerData; activeProject: ProjectKey }) {
  const [expanded, setExpanded] = useState(false);
  const projectData = layer.projects[activeProject];
  const projectColor = PROJECTS[activeProject].color;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${expanded ? 'border-gray-300' : 'border-gray-100 hover:border-gray-200'}`}
    >
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-4 flex items-center justify-between ${layer.bgColor}`}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white shadow-sm" style={{ color: layer.color }}>
            {layer.icon}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg" style={{ color: layer.color }}>{layer.title}</h3>
            <p className="text-sm text-gray-600">{layer.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{projectData.objects.length} objects</span>
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {/* Data Objects */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">关键数据对象</h4>
                <div className="grid gap-2">
                  {projectData.objects.map((obj, idx) => (
                    <ObjectCard key={idx} obj={obj} color={projectColor} />
                  ))}
                </div>
              </div>

              {/* Governance Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Owner */}
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">Owner</span>
                  </div>
                  <p className="text-sm text-gray-900">{projectData.owner}</p>
                </div>

                {/* Refresh */}
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">刷新频率</span>
                  </div>
                  <p className="text-sm text-gray-900">{projectData.refresh}</p>
                </div>
              </div>

              {/* Compliance */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">合规要求</span>
                </div>
                <ul className="space-y-1">
                  {projectData.compliance.map((item, idx) => (
                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* KPIs */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">质量 KPI</span>
                </div>
                <ul className="space-y-1">
                  {projectData.kpis.map((kpi, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {kpi}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ArchitectureDiagram({ activeProject }: { activeProject: ProjectKey }) {
  const colors = {
    authoring: '#6366f1',
    feasibility: '#10b981',
    simulation: '#f59e0b'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">六层架构概览</h3>
      <div className="relative">
        {/* Connection lines */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-3">
          {LAYERS.map((layer, idx) => (
            <div key={layer.id} className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center z-10 shadow-sm"
                style={{ backgroundColor: layer.color, color: 'white' }}
              >
                <span className="font-bold text-lg">L{layer.id}</span>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="font-medium text-sm">{layer.subtitle}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {layer.projects[activeProject].objects.length} objects • {layer.projects[activeProject].kpis.length} KPIs
                </p>
              </div>
            </div>
          )).reverse()}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-medium">数据流向:</span> Source → Raw → Clean → Canonical → Products → Apps
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DataFoundationVisualization() {
  const [activeProject, setActiveProject] = useState<ProjectKey>('authoring');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Foundation 架构</h2>
            <p className="text-gray-600">Clinical Authoring 2.0 + Site Feasibility + Trial Simulation</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          本文档按三个实际项目映射到 Data Foundation 六层架构，每层列出关键数据对象、责任归属、刷新频率、合规要求与质量KPI。
          统一治理字段贯穿所有层级，确保数据血缘可追溯、合规可审计。
        </p>
      </div>

      {/* Project Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROJECTS) as ProjectKey[]).map((key) => (
          <ProjectBadge 
            key={key}
            projectKey={key}
            active={activeProject === key}
            onClick={() => setActiveProject(key)}
          />
        ))}
      </div>

      {/* Architecture Overview */}
      <ArchitectureDiagram activeProject={activeProject} />

      {/* Governance Card */}
      <GovernanceCard />

      {/* Layer Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">详细层级映射</h3>
          <span className="text-xs text-gray-500">点击展开详情</span>
        </div>
        
        {LAYERS.map((layer) => (
          <LayerCard key={layer.id} layer={layer} activeProject={activeProject} />
        ))}
      </div>

      {/* Footer Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <h3 className="font-semibold text-lg mb-3">最小可用 Data Foundation (MVD)</h3>
        <p className="text-sm text-gray-300 mb-4">
          建议为三项目各选 10 个“必须有”的数据对象，定义最小可用 Data Foundation。每个对象需明确：
          Owner / Refresh / Compliance / KPI，形成可管理的产品 backlog。
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-white/10">
            <p className="font-medium text-indigo-300">Clinical Authoring 2.0</p>
            <p className="text-gray-400 mt-1">10 critical objects</p>
            <p className="text-xs text-gray-500 mt-1">Focus: Document lineage & traceability</p>
          </div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="font-medium text-emerald-300">Site Feasibility</p>
            <p className="text-gray-400 mt-1">10 critical objects</p>
            <p className="text-xs text-gray-500 mt-1">Focus: Site matching & performance</p>
          </div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="font-medium text-amber-300">Trial Simulation</p>
            <p className="text-gray-400 mt-1">10 critical objects</p>
            <p className="text-xs text-gray-500 mt-1">Focus: Event timelines & assumptions</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          <span>Source Systems</span>
        </div>
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>Raw Data</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Clean Data</span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>Semantic Model</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>Data Products</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>Applications</span>
        </div>
      </div>
    </div>
  );
}
