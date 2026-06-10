import {
  Wallet,
  CreditCard,
  Flame,
  Users,
  TrendingUp,
  ListChecks,
  Receipt,
  CalendarClock,
} from "lucide-react"
import { KpiCard } from "@/src/components/kpi-card"

const kpis = [
  {
    label: "Monthly Income",
    value: "$8,420",
    caption: "vs. $7,980 last month",
    change: 5.5,
    icon: Wallet,
  },
  {
    label: "Active Expenses",
    value: "$3,180",
    caption: "12 recurring charges",
    change: -2.3,
    icon: CreditCard,
  },
  {
    label: "Task Streak",
    value: "27 days",
    caption: "Personal best streak",
    change: 12.0,
    icon: Flame,
  },
  {
    label: "Total Group Debt",
    value: "$642",
    caption: "Across 4 groups",
    change: -8.1,
    icon: Users,
  },
]

const placeholders = [
  { title: "Spending Overview", icon: TrendingUp, span: "lg:col-span-2" },
  { title: "Upcoming Tasks", icon: ListChecks, span: "" },
  { title: "Recent Bills", icon: Receipt, span: "" },
  { title: "Debt Breakdown", icon: Users, span: "" },
  { title: "Schedule", icon: CalendarClock, span: "lg:col-span-2" },
]

export function DashboardView() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Friday, June 10</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Good afternoon, Avery
          </h1>
        </div>
        <button
          type="button"
          className="w-fit rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          New Entry
        </button>
      </header>

      {/* KPI grid */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Placeholder content grid */}
      <section aria-label="Dashboard panels">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {placeholders.map((panel) => {
            const Icon = panel.icon
            return (
              <div
                key={panel.title}
                className={`glass flex min-h-56 flex-col gap-4 rounded-3xl p-5 ${panel.span}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-semibold">{panel.title}</h2>
                </div>

                {/* Skeleton placeholder rows */}
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <div className="h-3 w-3/4 rounded-full bg-muted" />
                  <div className="h-3 w-1/2 rounded-full bg-muted" />
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="h-3 w-2/5 rounded-full bg-muted" />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
