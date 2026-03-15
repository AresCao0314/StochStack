import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileStack, Filter, Microscope, Radar, SlidersHorizontal, Users2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { CountryReadinessChart, EnrollmentForecastChart, ScenarioCompareChart, ScoreDistributionChart } from '@/components/site-feasibility-platform/charts';
import { MetricCard } from '@/components/site-feasibility-platform/metric-card';
import { SectionHeader } from '@/components/site-feasibility-platform/section-header';
import { getDashboardSeries, getEnrollmentCurve, getRecommendations, getSiteExplorerRows, getSiteFeasibilityDataset } from '@/lib/site-feasibility-platform/selectors';

const dataset = getSiteFeasibilityDataset();
const recommendations = getRecommendations(dataset);
const dashboardSeries = getDashboardSeries(dataset);
const enrollmentCurve = getEnrollmentCurve(dataset);
const explorerRows = getSiteExplorerRows(dataset);

export function DashboardView() {
  const topThree = recommendations.slice(0, 3);
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Dashboard"
        title="Executive Site Feasibility Dashboard"
        description="Single-screen view of protocol burden, country readiness, startup risk, and shortlist strength for RESP-204."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Protocol complexity" value={`${dataset.study.complexity.overall}/100`} detail="High due to image cadence, respiratory function checks, and layered inclusion criteria." tone="warn" />
        <MetricCard label="Target enrollment" value={`${dataset.study.targetEnrollment}`} detail="Planned across 6 countries with 9 initial activations." tone="accent" />
        <MetricCard label="Tier 1 sites" value={`${recommendations.filter((r) => r.tier === 'Tier 1').length}`} detail="Sites already strong enough for immediate outreach." />
        <MetricCard label="Forecast LPI" value="39 weeks" detail="Balanced launch scenario using current mock assumptions." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <CardTitle>Country readiness and startup pressure</CardTitle>
          <CardDescription className="mt-1">Enrollment forecast, startup risk, and readiness stacked into one comparative view.</CardDescription>
          <div className="mt-4 h-[280px]">
            <CountryReadinessChart data={dashboardSeries} />
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>Tier 1 recommendation stack</CardTitle>
          <CardDescription className="mt-1">Best current shortlist for leadership review.</CardDescription>
          <div className="mt-4 space-y-3">
            {topThree.map((item) => {
              const site = dataset.sites.find((x) => x.id === item.siteId)!;
              return (
                <div key={item.siteId} className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.rank}. {site.name}</p>
                      <p className="text-sm text-ink/64">{item.summary}</p>
                    </div>
                    <Badge className="border-accent1/30 bg-accent1/10 text-ink">{item.score}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-ink/70">{item.action}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <CardTitle>Enrollment plan vs forecast</CardTitle>
        <CardDescription className="mt-1">Used to communicate whether current site mix can absorb protocol complexity without missing the Phase II operating window.</CardDescription>
        <div className="mt-4 h-[280px]">
          <EnrollmentForecastChart data={enrollmentCurve} />
        </div>
      </Card>
    </div>
  );
}

export function StudyWorkspaceView() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Study Workspace"
        title="Study Design and Protocol Burden Workspace"
        description="Frame how protocol features drive downstream feasibility. This is the surface used to explain why good sites still fail when the design is too heavy."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <FileStack size={16} />
            <CardTitle>RESP-204 design profile</CardTitle>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/55">Study</p>
              <p className="mt-2 text-lg font-semibold">{dataset.study.code}</p>
              <p className="text-sm text-ink/64">{dataset.study.phase} · {dataset.study.indication}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/55">Operational target</p>
              <p className="mt-2 text-lg font-semibold">{dataset.study.targetEnrollment} patients</p>
              <p className="text-sm text-ink/64">Initial country package across EU6</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/55">Inclusion / exclusion burden</p>
              <p className="mt-2 text-lg font-semibold">{dataset.study.complexity.inclusionExclusion}/100</p>
              <p className="text-sm text-ink/64">Likely to elevate screen failure if referral quality is weak</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/55">Procedure load</p>
              <p className="mt-2 text-lg font-semibold">{dataset.study.complexity.procedures}/100</p>
              <p className="text-sm text-ink/64">Imaging cadence and pulmonary tests challenge low-capacity sites</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Microscope size={16} />
            <CardTitle>Protocol complexity lens</CardTitle>
          </div>
          <div className="mt-4 space-y-3 text-sm text-ink/70">
            <div className="rounded-2xl border border-orange-300/50 bg-orange-50/70 p-4">
              <p className="font-medium text-ink">Screening load</p>
              <p className="mt-1">ILD phenotype confirmation plus imaging review means community sites with weak pre-screening pathways are structurally disadvantaged.</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="font-medium text-ink">Visit cadence</p>
              <p className="mt-1">Week 0/4/8/12/16/24 imaging rhythm favors sites with protected imaging slots and stable coordinator staffing.</p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="font-medium text-ink">Country gating implication</p>
              <p className="mt-1">Fast-start countries help FPI optics, but the protocol still requires a few academically dense sites to hit total enrollment.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SiteExplorerView() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Site Explorer"
        title="18-site explorer with explainable scoring"
        description="Show where the tradeoffs live: some sites are rich in patients but operationally slow; some activate fast but cannot carry enrollment."
      />
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Score distribution</CardTitle>
            <CardDescription className="mt-1">Sorted by blended fit score using current default settings.</CardDescription>
          </div>
          <Badge className="border-ink/10 bg-white/80">{explorerRows.length} sites</Badge>
        </div>
        <div className="mt-4 h-[340px]">
          <ScoreDistributionChart data={explorerRows.slice(0, 10).map((site) => ({ name: site.city, score: site.score, country: site.country }))} />
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-4">
          <Filter size={16} />
          <CardTitle>Detailed site table</CardTitle>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-[0.12em] text-ink/58">
              <tr>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Startup</th>
                <th className="px-4 py-3">Patient match</th>
                <th className="px-4 py-3">Diversity</th>
                <th className="px-4 py-3">Competition</th>
                <th className="px-4 py-3">Signal</th>
              </tr>
            </thead>
            <tbody>
              {explorerRows.map((site) => (
                <tr key={site.id} className="border-t border-ink/8">
                  <td className="px-4 py-3">
                    <p className="font-medium">{site.name}</p>
                    <p className="text-xs text-ink/56">{site.principalInvestigator}</p>
                  </td>
                  <td className="px-4 py-3">{site.country}</td>
                  <td className="px-4 py-3 font-semibold">{site.score}</td>
                  <td className="px-4 py-3">{site.startupDays}d</td>
                  <td className="px-4 py-3">{site.patientMatchScore}</td>
                  <td className="px-4 py-3">{site.diversityFit}</td>
                  <td className="px-4 py-3">{site.competitionRisk}</td>
                  <td className="px-4 py-3 text-ink/66">{site.rationale[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function ScenarioLabView() {
  const chartData = dataset.scenarios.map((scenario) => ({
    label: scenario.label,
    lpiWeeks: scenario.expectedLpiWeeks,
    activatedSites: scenario.expectedActivatedSites,
    enrollmentAtMonth6: scenario.expectedEnrollmentAtMonth6
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Scenario Lab"
        title="Scenario simulation for country and site strategy"
        description="This is where the site strategy becomes a leadership decision: speed, enrollment, representation, or a balanced launch."
      />
      <Card className="p-5">
        <CardTitle>Scenario compare matrix</CardTitle>
        <CardDescription className="mt-1">Each scenario changes the scoring logic and shifts who becomes Tier 1.</CardDescription>
        <div className="mt-4 h-[300px]">
          <ScenarioCompareChart data={chartData} />
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {dataset.scenarios.map((scenario) => (
          <Card key={scenario.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{scenario.label}</CardTitle>
                <CardDescription className="mt-1">{scenario.narrative}</CardDescription>
              </div>
              <Badge className="border-ink/10 bg-white/80">{scenario.expectedLpiWeeks}w LPI</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
              <div className="rounded-2xl border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Startup weight</p>
                <p className="mt-2 font-semibold">{Math.round(scenario.assumptions.startupWeight * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Enrollment weight</p>
                <p className="mt-2 font-semibold">{Math.round(scenario.assumptions.enrollmentWeight * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-ink/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Diversity weight</p>
                <p className="mt-2 font-semibold">{Math.round(scenario.assumptions.diversityWeight * 100)}%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RecommendationCenterView() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Recommendation Center"
        title="Explainable recommendation stack"
        description="Not just a ranked list. Each recommendation ties back to protocol complexity, startup risk, and enrollment contribution."
      />
      <div className="space-y-4">
        {recommendations.slice(0, 6).map((item) => {
          const site = dataset.sites.find((x) => x.id === item.siteId)!;
          return (
            <Card key={item.siteId} className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="border-accent1/35 bg-accent1/10 text-ink">#{item.rank}</Badge>
                    <CardTitle>{site.name}</CardTitle>
                    <Badge className="border-ink/10 bg-white/80">{item.tier}</Badge>
                  </div>
                  <CardDescription>{item.summary}</CardDescription>
                  <p className="text-sm text-ink/70">{item.action}</p>
                </div>
                <div className="min-w-[120px] text-right">
                  <p className="text-xs uppercase tracking-[0.12em] text-ink/56">Composite score</p>
                  <p className="mt-1 text-3xl font-bold">{item.score}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {item.explainability.map((factor) => (
                  <div key={factor.label} className="rounded-2xl border border-ink/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-ink/55">{factor.label}</p>
                    <p className="mt-2 font-semibold">{factor.value}</p>
                    <p className="mt-1 text-xs text-ink/62">{factor.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function DataCatalogView() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Data Catalog"
        title="Source transparency for feasibility logic"
        description="This is the handoff-friendly inventory that makes the mock system feel replaceable with real data later."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {dataset.catalog.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="mt-1">{item.type}</CardDescription>
              </div>
              <Badge className="border-ink/10 bg-white/80">{item.freshness}</Badge>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Coverage</p>
                <p className="mt-1 text-ink/72">{item.coverage}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Owner</p>
                <p className="mt-1 text-ink/72">{item.owner}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Key fields</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.fields.map((field) => (
                    <Badge key={field} className="border-ink/10 bg-white/80">{field}</Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/58">Usage</p>
                <p className="mt-1 text-ink/72">{item.usage}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Settings"
        title="Scoring and policy controls"
        description="Mock settings surface showing how this frontend can later map to admin-configurable backend policy."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <CardTitle>Scoring weights</CardTitle>
          <CardDescription className="mt-1">Current default used by dashboard and recommendation center.</CardDescription>
          <div className="mt-4 space-y-3">
            {Object.entries(dataset.settings.scoringWeights).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-ink/72">{key}</span>
                  <span className="font-medium">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/8">
                  <div className="h-2 rounded-full bg-gradient-to-r from-accent2 to-accent1" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>Operational thresholds</CardTitle>
          <CardDescription className="mt-1">What pushes a site into Tier 1 versus reserve pool.</CardDescription>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 p-4">
              <span>Tier 1 minimum score</span>
              <span className="font-semibold">{dataset.settings.thresholds.tier1Score}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 p-4">
              <span>Maximum startup days</span>
              <span className="font-semibold">{dataset.settings.thresholds.maxStartupDays}d</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 p-4">
              <span>Maximum competition risk</span>
              <span className="font-semibold">{dataset.settings.thresholds.maxCompetitionRisk}</span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-orange-300/50 bg-orange-50/70 p-4 text-sm text-ink/72">
            These settings are intentionally front-end only for now. The data contract is already explicit enough to swap to a real admin API later.
          </div>
        </Card>
      </div>
    </div>
  );
}

export function HeaderSummaryRail() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Clock3 size={15} /> Startup pressure</div>
        <p className="mt-2 text-sm text-ink/68">Germany and UK drive scientific fit, but startup drag remains the main operational threat.</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Users2 size={15} /> Enrollment logic</div>
        <p className="mt-2 text-sm text-ink/68">Enrollment is concentrated in 6-7 sites; reserve sites help optics but not target delivery.</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Radar size={15} /> Competition watch</div>
        <p className="mt-2 text-sm text-ink/68">London and Berlin improve fit but need competitive contingency planning before activation.</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={15} /> Recommendation logic</div>
        <p className="mt-2 text-sm text-ink/68">Spain + Italy form the most presentation-ready launch layer; Germany/UK add depth selectively.</p>
      </Card>
    </div>
  );
}

export function FooterCallout() {
  return (
    <Card className="border-accent2/25 bg-gradient-to-r from-white via-white to-accent2/10 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Leadership takeaway</CardTitle>
          <CardDescription className="mt-1">
            The shortlist is not just the highest-scoring sites. It is the smallest cross-country mix that can absorb protocol complexity, hit activation optics, and still protect enrollment.
          </CardDescription>
        </div>
        <Button className="gap-2">
          Move to executive review
          <ArrowRight size={15} />
        </Button>
      </div>
    </Card>
  );
}

export function RiskBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-orange-300/60 bg-orange-50/80 p-4 text-sm text-ink/72">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-600" />
      <div>
        <p className="font-medium text-ink">Protocol complexity is the hidden feasibility driver.</p>
        <p className="mt-1">Sites with high patient access still fall out if imaging cadence, screen-fail logic, and coordinator burden are not explicitly modeled in the score.</p>
      </div>
    </div>
  );
}

