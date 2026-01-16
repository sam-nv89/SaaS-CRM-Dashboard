import { DollarSign, Calendar, Users, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const kpis = [
  {
    label: "Today's Revenue",
    value: "$1,240",
    change: "+12%",
    icon: DollarSign,
    trend: "up",
  },
  {
    label: "Appointments",
    value: "8/12",
    subtext: "Completed",
    icon: Calendar,
    trend: "neutral",
  },
  {
    label: "New Clients",
    value: "3",
    change: "+2",
    icon: Users,
    trend: "up",
  },
  {
    label: "Occupancy",
    value: "78%",
    subtext: "Today",
    icon: TrendingUp,
    trend: "up",
  },
]

export function KpiCards() {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Overview</h2>
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                {kpi.change && (
                  <span className="text-xs font-medium text-confirmed bg-confirmed/10 px-2 py-0.5 rounded-full">
                    {kpi.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.subtext || kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
