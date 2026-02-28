const I18N = {
  zh: {
    langTag: "zh-CN",
    pageTitle: "Highscore 临床情报中心",
    eyebrow: "临床开发情报",
    langLabel: "语言",
    heroTitle: "Highscore 多项目信号平台",
    heroSub:
      "面向 10 个 clinical development 战略项目，持续跟踪申办方、技术平台、vendor、合作关系、成效指标、咨询报告与学术案例。",
    labels: {
      project: "项目",
      topic: "主题",
      date: "时间窗口",
      radar: "项目雷达",
      map: "10 项目地图",
      daily: "今日更新",
      dailyNew: "新增信号",
      dailyWatch: "科技巨头动向",
      sourceLink: "查看来源",
      relevance: "相关度",
      noData: "暂无结果，可先运行 <code>python3 scripts/fetch_news.py</code> 更新数据。",
      noDaily: "暂无每日摘要，请先运行抓取脚本。",
      noWatch: "今日未检测到科技巨头相关新增动向。",
      noNew: "本次更新暂无新增。",
      latestLink: "最新链接",
      noLink: "暂无链接",
      newTag: "新增",
      totalTag: "累计",
      allProjects: "全部项目",
      allTopics: "全部主题",
      allTime: "全部",
      days30: "近 30 天",
      days90: "近 90 天",
      days180: "近 180 天",
      resultCount: (n) => `共 ${n} 条`,
      updatedAt: (v) => `更新时间: ${v}`,
      metrics: {
        projects: (n) => `项目: ${n}`,
        signals: (n) => `情报条目: ${n}`,
        topics: (n) => `主题覆盖: ${n}`,
        updated: (d) => `更新日期: ${d}`,
      },
      dailyMetrics: {
        total: (n) => `总信号 ${n}`,
        newRun: (n) => `较上次新增 ${n}`,
        newToday: (n) => `今日发布 ${n}`,
        watchHits: (n) => `巨头命中 ${n}`,
      },
    },
    topics: {
      related_projects: "相关项目",
      technology_platform: "技术/平台",
      vendors: "Vendor",
      outcomes: "成效",
      partnerships: "合作",
      tech_companies: "科技公司",
      consulting_reports: "咨询报告",
      academic_literature: "学术/案例",
      tech_giants_watch: "科技巨头监控",
    },
    projectNames: {
      portfolio_mgmt: "临床运营组合管理（里程碑/预算/资源）",
      trial_simulator: "临床试验模拟能力",
      site_startup: "站点启动优化能力",
      footprint_selection: "数据驱动试验布局与中心选择",
      partner_of_choice: "差异化全球 Partner-of-Choice 模式",
      submission_closeout: "申报与结项加速能力",
      holistic_analytics_qms: "整体化分析/AI 赋能/风险导向质量管理",
      delivery_sourcing: "简化临床交付与采购模式以优化成本",
      data_tech_foundation: "一体化可扩展数据与技术底座",
      ai_authoring_automation: "端到端自动化 AI 工具（首步: 撰写）",
    },
  },
  en: {
    langTag: "en",
    pageTitle: "Highscore Clinical Intelligence Hub",
    eyebrow: "Clinical Development Intelligence",
    langLabel: "Language",
    heroTitle: "Highscore Multi-Program Signal Platform",
    heroSub:
      "Continuous monitoring across 10 clinical development priorities: sponsors, technology platforms, vendors, partnerships, outcomes, consulting reports, and academic cases.",
    labels: {
      project: "Project",
      topic: "Topic",
      date: "Time Window",
      radar: "Program Radar",
      map: "10-Program Map",
      daily: "Daily Updates",
      dailyNew: "New Signals",
      dailyWatch: "Big-Tech Watch",
      sourceLink: "View source",
      relevance: "Relevance",
      noData: "No records found. Run <code>python3 scripts/fetch_news.py</code> to refresh data.",
      noDaily: "No daily digest yet. Run the fetch script first.",
      noWatch: "No new big-tech movement detected in this run.",
      noNew: "No new signals in this run.",
      latestLink: "Latest link",
      noLink: "No link yet",
      newTag: "New",
      totalTag: "Total",
      allProjects: "All Projects",
      allTopics: "All Topics",
      allTime: "All",
      days30: "Last 30 days",
      days90: "Last 90 days",
      days180: "Last 180 days",
      resultCount: (n) => `${n} records`,
      updatedAt: (v) => `Updated: ${v}`,
      metrics: {
        projects: (n) => `Projects: ${n}`,
        signals: (n) => `Signals: ${n}`,
        topics: (n) => `Topic Coverage: ${n}`,
        updated: (d) => `Date: ${d}`,
      },
      dailyMetrics: {
        total: (n) => `Total ${n}`,
        newRun: (n) => `New vs last run ${n}`,
        newToday: (n) => `Published today ${n}`,
        watchHits: (n) => `Big-tech hits ${n}`,
      },
    },
    topics: {
      related_projects: "Related Projects",
      technology_platform: "Technology/Platform",
      vendors: "Vendors",
      outcomes: "Outcomes",
      partnerships: "Partnerships",
      tech_companies: "Tech Companies",
      consulting_reports: "Consulting Reports",
      academic_literature: "Academic/Cases",
      tech_giants_watch: "Big-Tech Watch",
    },
    projectNames: {
      portfolio_mgmt: "Clinical Operations Portfolio Management (Milestones/Budget/Resources)",
      trial_simulator: "Clinical Trial Simulator Capability",
      site_startup: "Optimized Site Startup Capability",
      footprint_selection: "Data-Driven Trial Footprint and Site Selection",
      partner_of_choice: "Differentiated Global Partner-of-Choice Model",
      submission_closeout: "Submission and Close-Out Acceleration",
      holistic_analytics_qms: "Holistic Analytics / AI-Enabled Risk-Based Quality Management",
      delivery_sourcing: "Simplified Clinical Delivery and Sourcing for Cost Optimization",
      data_tech_foundation: "Integrated, Scalable Data and Tech Foundation",
      ai_authoring_automation: "AI Tools for End-to-End Automation (First Step: Authoring)",
    },
  },
  de: {
    langTag: "de",
    pageTitle: "Highscore Klinische Intelligence-Plattform",
    eyebrow: "Clinical Development Intelligence",
    langLabel: "Sprache",
    heroTitle: "Highscore Multi-Programm Signalplattform",
    heroSub:
      "Kontinuierliches Monitoring von 10 klinischen Entwicklungsprioritaeten: Sponsoren, Technologieplattformen, Vendoren, Partnerschaften, Ergebnisse, Beratungsreports und akademische Fallbeispiele.",
    labels: {
      project: "Projekt",
      topic: "Thema",
      date: "Zeitraum",
      radar: "Programm-Radar",
      map: "10-Projekt-Karte",
      daily: "Taegliche Updates",
      dailyNew: "Neue Signale",
      dailyWatch: "Big-Tech Monitoring",
      sourceLink: "Quelle ansehen",
      relevance: "Relevanz",
      noData: "Keine Treffer. Fuehre <code>python3 scripts/fetch_news.py</code> aus, um Daten zu aktualisieren.",
      noDaily: "Noch kein Daily Digest vorhanden. Fuehre zuerst das Fetch-Skript aus.",
      noWatch: "Kein neues Big-Tech-Signal in diesem Lauf.",
      noNew: "Keine neuen Signale in diesem Lauf.",
      latestLink: "Neuester Link",
      noLink: "Noch kein Link",
      newTag: "Neu",
      totalTag: "Gesamt",
      allProjects: "Alle Projekte",
      allTopics: "Alle Themen",
      allTime: "Alle",
      days30: "Letzte 30 Tage",
      days90: "Letzte 90 Tage",
      days180: "Letzte 180 Tage",
      resultCount: (n) => `${n} Eintraege`,
      updatedAt: (v) => `Aktualisiert: ${v}`,
      metrics: {
        projects: (n) => `Projekte: ${n}`,
        signals: (n) => `Signale: ${n}`,
        topics: (n) => `Themenabdeckung: ${n}`,
        updated: (d) => `Datum: ${d}`,
      },
      dailyMetrics: {
        total: (n) => `Gesamt ${n}`,
        newRun: (n) => `Neu seit letztem Lauf ${n}`,
        newToday: (n) => `Heute publiziert ${n}`,
        watchHits: (n) => `Big-Tech Treffer ${n}`,
      },
    },
    topics: {
      related_projects: "Verwandte Projekte",
      technology_platform: "Technologie/Plattform",
      vendors: "Vendoren",
      outcomes: "Ergebnisse",
      partnerships: "Partnerschaften",
      tech_companies: "Tech-Unternehmen",
      consulting_reports: "Beratungsreports",
      academic_literature: "Akademisch/Fallstudien",
      tech_giants_watch: "Big-Tech Monitoring",
    },
    projectNames: {
      portfolio_mgmt: "Clinical Operations Portfoliomanagement (Meilensteine/Budget/Ressourcen)",
      trial_simulator: "Clinical-Trial-Simulator-Faehigkeit",
      site_startup: "Optimierte Site-Startup-Faehigkeit",
      footprint_selection: "Datengetriebene Trial-Footprint- und Site-Selektion",
      partner_of_choice: "Differenziertes globales Partner-of-Choice-Modell",
      submission_closeout: "Beschleunigung von Einreichung und Abschluss",
      holistic_analytics_qms: "Ganzheitliche Analytik / AI-gestuetztes risikobasiertes Qualitaetsmanagement",
      delivery_sourcing: "Vereinfachtes Clinical Delivery- und Sourcing-Modell zur Kostenoptimierung",
      data_tech_foundation: "Integriertes, skalierbares Daten- und Tech-Fundament",
      ai_authoring_automation: "AI-Tools fuer End-to-End-Automatisierung (erster Schritt: Authoring)",
    },
  },
};

const projectFilter = document.getElementById("projectFilter");
const topicFilter = document.getElementById("topicFilter");
const dateFilter = document.getElementById("dateFilter");
const signalGrid = document.getElementById("signalGrid");
const resultCount = document.getElementById("resultCount");
const projectGrid = document.getElementById("projectGrid");
const heroMetrics = document.getElementById("heroMetrics");
const cardTemplate = document.getElementById("signalCardTemplate");
const langSwitch = document.getElementById("langSwitch");
const dailyMetrics = document.getElementById("dailyMetrics");
const dailyNewList = document.getElementById("dailyNewList");
const dailyWatchList = document.getElementById("dailyWatchList");
const dailyUpdatedAt = document.getElementById("dailyUpdatedAt");

let projects = [];
let signals = [];
let digest = null;
let currentLang = "zh";

function i18n() {
  return I18N[currentLang] || I18N.zh;
}

function resolveProjectName(project) {
  return i18n().projectNames[project.id] || project.name;
}

function resolveProjectNameById(projectId) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return projectId;
  return resolveProjectName(p);
}

async function loadData() {
  const [projectRes, signalRes, digestRes] = await Promise.all([
    fetch("../data/projects.json"),
    fetch("../data/latest_signals.json").catch(() => null),
    fetch("../data/daily_digest.json").catch(() => null),
  ]);

  projects = await projectRes.json();

  if (signalRes && signalRes.ok) {
    signals = await signalRes.json();
  }
  if (!signals.length) {
    const sample = await fetch("../data/latest_signals.sample.json");
    signals = await sample.json();
  }

  if (digestRes && digestRes.ok) {
    digest = await digestRes.json();
  } else {
    const sampleDigest = await fetch("../data/daily_digest.sample.json").catch(() => null);
    digest = sampleDigest && sampleDigest.ok ? await sampleDigest.json() : null;
  }
}

function applyStaticTexts() {
  const t = i18n();
  document.documentElement.lang = t.langTag;
  document.title = t.pageTitle;
  document.getElementById("eyebrowText").textContent = t.eyebrow;
  document.getElementById("langLabel").textContent = t.langLabel;
  document.getElementById("heroTitle").textContent = t.heroTitle;
  document.getElementById("heroSub").textContent = t.heroSub;
  document.getElementById("projectFilterLabel").textContent = t.labels.project;
  document.getElementById("topicFilterLabel").textContent = t.labels.topic;
  document.getElementById("dateFilterLabel").textContent = t.labels.date;
  document.getElementById("radarTitle").textContent = t.labels.radar;
  document.getElementById("projectMapTitle").textContent = t.labels.map;
  document.getElementById("dailyTitle").textContent = t.labels.daily;
  document.getElementById("dailyNewTitle").textContent = t.labels.dailyNew;
  document.getElementById("dailyWatchTitle").textContent = t.labels.dailyWatch;
}

function setupFilters() {
  const selectedProject = projectFilter.value || "all";
  const selectedTopic = topicFilter.value || "all";
  const selectedDate = dateFilter.value || "all";
  const t = i18n();

  projectFilter.innerHTML = [
    `<option value="all">${t.labels.allProjects}</option>`,
    ...projects.map((p) => `<option value="${p.id}">${resolveProjectName(p)}</option>`),
  ].join("");

  topicFilter.innerHTML = [
    `<option value="all">${t.labels.allTopics}</option>`,
    ...Object.entries(t.topics).map(([key, label]) => `<option value="${key}">${label}</option>`),
  ].join("");

  dateFilter.innerHTML = [
    `<option value="all">${t.labels.allTime}</option>`,
    `<option value="30">${t.labels.days30}</option>`,
    `<option value="90">${t.labels.days90}</option>`,
    `<option value="180">${t.labels.days180}</option>`,
  ].join("");

  projectFilter.value = selectedProject;
  topicFilter.value = selectedTopic;
  dateFilter.value = selectedDate;
}

function withinDays(dateString, days) {
  if (days === "all") return true;
  const d = Number(days);
  const target = new Date(dateString).getTime();
  const threshold = Date.now() - d * 24 * 60 * 60 * 1000;
  return target >= threshold;
}

function renderHero() {
  const t = i18n();
  const countProjects = projects.length;
  const countSignals = signals.length;
  const countTopics = new Set(signals.map((s) => s.topic)).size;
  const today = new Date().toISOString().slice(0, 10);

  heroMetrics.innerHTML = `
    <span class="metric">${t.labels.metrics.projects(countProjects)}</span>
    <span class="metric">${t.labels.metrics.signals(countSignals)}</span>
    <span class="metric">${t.labels.metrics.topics(countTopics)}</span>
    <span class="metric">${t.labels.metrics.updated(today)}</span>
  `;
}

function renderDailyDigest() {
  const t = i18n();
  dailyMetrics.innerHTML = "";
  dailyNewList.innerHTML = "";
  dailyWatchList.innerHTML = "";

  if (!digest) {
    dailyUpdatedAt.textContent = "";
    dailyNewList.innerHTML = `<li class="daily-item">${t.labels.noDaily}</li>`;
    dailyWatchList.innerHTML = `<li class="daily-item">${t.labels.noDaily}</li>`;
    return;
  }

  dailyUpdatedAt.textContent = t.labels.updatedAt(digest.updated_at || "-");

  dailyMetrics.innerHTML = `
    <span class="metric">${t.labels.dailyMetrics.total(digest.total_signals || 0)}</span>
    <span class="metric">${t.labels.dailyMetrics.newRun(digest.new_since_last_run || 0)}</span>
    <span class="metric">${t.labels.dailyMetrics.newToday(digest.new_published_today || 0)}</span>
    <span class="metric">${t.labels.dailyMetrics.watchHits(digest.watchlist?.total_hits || 0)}</span>
  `;

  const newItems = digest.new_items || [];
  if (!newItems.length) {
    dailyNewList.innerHTML = `<li class="daily-item">${t.labels.noNew}</li>`;
  } else {
    dailyNewList.innerHTML = newItems
      .slice(0, 8)
      .map(
        (item) =>
          `<li class="daily-item daily-item-new">
            <a target="_blank" rel="noreferrer" href="${item.link}">${item.title}</a>
            <div class="daily-meta-row">${resolveProjectNameById(item.project_id)} | ${item.published_at} | ${item.source || "-"}</div>
          </li>`
      )
      .join("");
  }

  const newBreakdown = digest.watchlist?.new_hit_breakdown || {};
  const totalBreakdown = digest.watchlist?.hit_breakdown || {};
  const companies = digest.watchlist?.companies || [];
  const highlights = digest.watchlist?.highlights || [];
  const latestByCompany = new Map();

  highlights.forEach((item) => {
    (item.companies || []).forEach((company) => {
      if (!latestByCompany.has(company)) {
        latestByCompany.set(company, item);
      }
    });
  });

  if (!companies.length) {
    dailyWatchList.innerHTML = `<li class="daily-item">${t.labels.noWatch}</li>`;
  } else {
    dailyWatchList.innerHTML = companies
      .map((company) => {
        const newCount = newBreakdown[company] || 0;
        const totalCount = totalBreakdown[company] || 0;
        const latest = latestByCompany.get(company);
        const linkHtml = latest?.link
          ? `<a target="_blank" rel="noreferrer" href="${latest.link}">${t.labels.latestLink}</a>`
          : `<span>${t.labels.noLink}</span>`;

        return `<li class="daily-item daily-item-watch">
          <div class="watch-left">
            <strong>${company}</strong>
            <div class="watch-counts">${t.labels.newTag}: ${newCount} | ${t.labels.totalTag}: ${totalCount}</div>
          </div>
          <div class="watch-right">${linkHtml}</div>
        </li>`;
      })
      .join("");
  }
}

function renderProjects() {
  projectGrid.innerHTML = projects
    .map(
      (p) => `
        <div class="project-tag">
          <strong>${resolveProjectName(p)}</strong><br />
          <span>${p.keywords.slice(0, 3).join(" / ")}</span>
        </div>
      `
    )
    .join("");
}

function renderSignals() {
  const t = i18n();
  const p = projectFilter.value;
  const topic = topicFilter.value;
  const d = dateFilter.value;

  const filtered = signals.filter((s) => {
    const matchP = p === "all" || s.project_id === p;
    const matchT = topic === "all" || s.topic === topic;
    const matchD = withinDays(s.published_at, d);
    return matchP && matchT && matchD;
  });

  resultCount.textContent = t.labels.resultCount(filtered.length);
  signalGrid.innerHTML = "";

  if (!filtered.length) {
    signalGrid.innerHTML = `<div class="project-tag">${t.labels.noData}</div>`;
    return;
  }

  const projectMap = Object.fromEntries(projects.map((x) => [x.id, resolveProjectName(x)]));

  filtered.forEach((item) => {
    const node = cardTemplate.content.cloneNode(true);
    node.querySelector(".chip.project").textContent = projectMap[item.project_id] || item.project_id;
    node.querySelector(".chip.topic").textContent = t.topics[item.topic] || item.topic;
    node.querySelector(".chip.score").textContent = `${t.labels.relevance} ${item.relevance_score}`;
    node.querySelector(".signal-title").textContent = item.title;
    node.querySelector(".signal-summary").textContent = item.summary;
    node.querySelector(".meta").textContent = `${item.source} | ${item.published_at}`;
    const link = node.querySelector(".signal-link");
    link.href = item.link;
    link.textContent = t.labels.sourceLink;
    signalGrid.appendChild(node);
  });
}

function renderAll() {
  applyStaticTexts();
  setupFilters();
  renderHero();
  renderDailyDigest();
  renderProjects();
  renderSignals();
}

function setupLanguageSwitcher() {
  langSwitch.addEventListener("change", (event) => {
    currentLang = event.target.value;
    renderAll();
  });
}

function setupFilterListeners() {
  [projectFilter, topicFilter, dateFilter].forEach((el) => {
    el.addEventListener("change", renderSignals);
  });
}

async function bootstrap() {
  await loadData();
  setupLanguageSwitcher();
  setupFilterListeners();
  renderAll();
}

bootstrap();
