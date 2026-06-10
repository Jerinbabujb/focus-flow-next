import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import {cn} from "@/src/lib/utils"
interface KpiCardProps {
  label: string
  value: string
  caption: string
  change: number
  icon: LucideIcon
}

export function KpiCard({ label, value, caption, change, icon: Icon }: KpiCardProps) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            isPositive
              ? "bg-chart-3/15 text-chart-3"
              : "bg-destructive/15 text-destructive",
          )}
        >
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {Math.abs(change)}%
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  )
}
