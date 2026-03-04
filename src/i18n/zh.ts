const zh = {
  siteName: '随机栈 StochStack',
  slogan: '像从噪声中采样信号一样构建原型。',
  nav: {
    home: '首页',
    prototypes: '原型',
    ventures: 'Ventures',
    atlas: 'Atlas',
    notes: '笔记',
    life: '生活',
    about: '关于',
    contact: '联系'
  },
  home: {
    heroTitle: '随机栈',
    heroSubtitle: '以信号为核心的实验场，连接概念、系统与人的工作流。',
    cards: [
      { title: '原型入口', hint: '> 打开原型' },
      { title: 'Ventures 系统', hint: '> 打开 Ventures' },
      { title: 'Atlas 图谱', hint: '> 打开 Atlas' },
      { title: '信号笔记', hint: '> 阅读日志' },
      { title: '生活切片', hint: '> 查看信号' }
    ],
    portsTitle: 'Prototype Ports'
  },
  atlas: {
    title: '架构图谱 Atlas',
    subtitle: '一图胜千言，把复杂系统压缩成可讨论的视觉结构。'
  },
  ventures: {
    title: 'Ventures 系统',
    subtitle: '面向复杂业务的大型系统，部署在隔离运行环境中。',
    cards: [
      {
        title: 'Protocol OS Lite（单页版）',
        summary: '单页全流程 mock 演示：A/B 方案、policy 评分、导出均为可控 fake 结果。',
        href: '/ventures/protocol-os-lite',
        cta: '打开 Lite 版本'
      },
      {
        title: 'Protocol OS（决策中枢）',
        summary: 'Design Graph + Policy Scoring + Skill Swarm + 可追溯导出。',
        href: 'https://labs.stochstack.com/zh/projects',
        cta: '打开 labs 子域'
      },
      {
        title: '本地镜像入口',
        summary: '当 labs 子域不可用时，可用主站镜像路径继续演示。',
        href: '/projects',
        cta: '打开本地镜像'
      }
    ]
  },
  common: {
    filterByTag: '按标签筛选',
    filterByStatus: '按状态筛选',
    all: '全部',
    alpha: 'alpha',
    beta: 'beta',
    live: 'live',
    readMore: '查看详情',
    visit: '访问',
    designIntent: '设计意图',
    timeline: '时间线'
  },
  prototypes: {
    title: '原型阵列',
    subtitle: '在概念与可用性之间，持续试验与迭代。'
  },
  notes: {
    title: '信号日志',
    subtitle: '来自日常研究与构建过程的片段、模型与注记。',
    topics: ['AI', '临床', '阅读', '思考', '数据底座', '负责任 AI', '前沿 AI'],
    topicLabels: {
      AI: 'AI',
      Clinical: '临床',
      Books: '阅读',
      Thinking: '思考',
      'Data Foundation': '数据底座',
      'Responsible AI': '负责任 AI',
      'Advanced AI': '前沿 AI'
    },
    capture: {
      title: '随手记录',
      subtitle: '在手机或网页端快速写下原始想法，一键整理成可用要点。',
      placeholder: '中英文都可以。可记录：会议纪要、灵感片段、读书摘记、临床工作流观察等...',
      summarize: '整理要点',
      save: '保存到本地记录',
      clear: '清空',
      copy: '复制要点',
      history: '最近记录',
      empty: '还没有本地记录。',
      usingQwen: '由通义千问整理',
      usingFallback: '由本地兜底整理',
      error: '整理失败，请重试。',
      saved: '已保存到当前设备本地。'
    }
  },
  life: {
    title: '生活索引',
    subtitle: '产品界面之外，仍在塑造我的系统感知。',
    sections: {
      books: '读书',
      tennis: '网球',
      editing: '剪辑',
      films: '电影',
      architecture: '建筑'
    }
  },
  about: {
    title: '理念堆栈',
    manifesto: 'Manifesto',
    now: 'Now',
    stack: 'Stack'
  },
  contact: {
    title: '建立连接',
    subtitle: '当前不接后端表单，先以邮件开启对话。',
    name: '姓名',
    email: '邮箱',
    message: '消息',
    submit: '复制邮箱并打开邮件',
    copied: '邮箱已复制，正在打开邮件客户端...'
  },
  console: {
    title: '随机控制台',
    next: '下一条',
    copy: '复制'
  },
  footer: {
    imprint: '站点信息'
  },
  signal: {
    title: 'Signal 海报实验室',
    subtitle: '基于 seed 的随机格网，可导出 PNG。',
    regenerate: '重新生成',
    download: '下载 PNG'
  }
};

export default zh;
