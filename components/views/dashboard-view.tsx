"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CreditCard,
  Banknote,
  UserX,
  Activity,
  ChevronDown,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns"
import {
  getDashboardStats,
  getRevenueByPeriod,
  getServiceBreakdown,
  getPeakHours,
  getStaffStatus,
  getMasters
} from "@/lib/db"
import type {
  RevenueDataPoint,
  ServiceBreakdownItem,
  PeakHourData,
  StaffStatusItem
} from "@/lib/db"

interface DashboardViewProps {
  onViewCalendar?: () => void
}

type TimePeriod = "today" | "week" | "month" | "year"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-lg">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold text-foreground">${payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

// Skeleton
function GridSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-36 rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardView({ onViewCalendar }: DashboardViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today")
  const [selectedMasters, setSelectedMasters] = useState<string[]>(["All Masters"])
  const [availableMasters, setAvailableMasters] = useState<string[]>(["All Masters"])
  const [selectedServices, setSelectedServices] = useState<string[]>(["All Services"])
  const [isLoading, setIsLoading] = useState(true)

  // Data States
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([])
  const [peakHoursData, setPeakHoursData] = useState<PeakHourData[]>([])
  const [staffStatus, setStaffStatus] = useState<StaffStatusItem[]>([])

  // KPI State
  const [kpis, setKpis] = useState({
    revenue: { value: 0, prevValue: 0, label: "$0" },
    avgCheck: { value: 0, prevValue: 0 },
    conversionRate: 0,
    noShowRate: 0,
    staffUtilization: 0
  })

  // Financial Health State (Derived from revenue for now)
  const [financialHealth, setFinancialHealth] = useState({
    cash: 0,
    card: 0,
    total: 0
  })

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Calculate date range
        const now = new Date()
        let start = now
        let end = now

        switch (timePeriod) {
          case "today":
            start = startOfToday()
            end = endOfToday()
            break
          case "week":
            start = startOfWeek(now, { weekStartsOn: 1 })
            end = endOfWeek(now, { weekStartsOn: 1 })
            break
          case "month":
            start = startOfMonth(now)
            end = endOfMonth(now)
            break
          case "year":
            start = startOfYear(now)
            end = endOfYear(now)
            break
        }

        const startDate = start.toISOString()
        const endDate = end.toISOString()

        // Fetch all data in parallel
        const [
          stats,
          chartData,
          servicesData,
          peakHours,
          staffData,
          mastersList
        ] = await Promise.all([
          getDashboardStats(startDate, endDate, selectedMasters),
          getRevenueByPeriod(timePeriod, startDate, endDate),
          getServiceBreakdown(startDate, endDate),
          getPeakHours(format(now, 'yyyy-MM-dd')),
          getStaffStatus(),
          getMasters()
        ])

        if (mounted) {
          // Update Masters List
          setAvailableMasters(mastersList)

          // Update KPIs
          setKpis({
            revenue: {
              value: stats.revenue,
              prevValue: stats.previousRevenue,
              label: `$${stats.revenue.toLocaleString()}`
            },
            avgCheck: {
              value: Math.round(stats.avgCheck),
              prevValue: Math.round(stats.previousAvgCheck)
            },
            conversionRate: 34, // Mock: Requires visitor tracking
            noShowRate: Math.round(stats.noShowRate),
            staffUtilization: 72, // Mock: Requires complex availability calculation
          })

          // Update Charts
          setRevenueData(chartData)
          setServiceBreakdown(servicesData)
          setPeakHoursData(peakHours)
          setStaffStatus(staffData)

          // Update Financial Split (Mock split for visualization)
          const cashRatio = 0.35 + Math.random() * 0.1
          const cash = Math.round(stats.revenue * cashRatio)
          setFinancialHealth({
            cash,
            card: stats.revenue - cash,
            total: stats.revenue
          })
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [timePeriod, selectedMasters, selectedServices])

  const handleMasterToggle = (master: string) => {
    if (master === "All Masters") {
      setSelectedMasters(["All Masters"])
    } else {
      const newSelection = selectedMasters.includes(master)
        ? selectedMasters.filter((m) => m !== master)
        : [...selectedMasters.filter((m) => m !== "All Masters"), master]
      setSelectedMasters(newSelection.length ? newSelection : ["All Masters"])
    }
  }

  const handleServiceToggle = (service: string) => {
    if (service === "All Services") {
      setSelectedServices(["All Services"])
    } else {
      const newSelection = selectedServices.includes(service)
        ? selectedServices.filter((s) => s !== service)
        : [...selectedServices.filter((s) => s !== "All Services"), service]
      setSelectedServices(newSelection.length ? newSelection : ["All Services"])
    }
  }

  const revenueChange = kpis.revenue.prevValue > 0
    ? ((kpis.revenue.value - kpis.revenue.prevValue) / kpis.revenue.prevValue) * 100
    : 0

  const avgCheckChange = kpis.avgCheck.prevValue > 0
    ? ((kpis.avgCheck.value - kpis.avgCheck.prevValue) / kpis.avgCheck.prevValue) * 100
    : 0

  const serviceTypes = ["All Services", "Hair", "Nail", "Skin", "Massage", "Makeup", "Other"]

  return (
    <div className="space-y-3 mesh-gradient min-h-full -mx-4 -mt-4 px-3 pt-3 pb-4">
      {/* Control Bar */}
      <section className="space-y-2">
        <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg">
          {(["today", "week", "month", "year"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${timePeriod === period
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-card/60 w-full"
          onClick={onViewCalendar}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px]">View Calendar</span>
        </Button>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 justify-between text-[11px] h-8 bg-card/60 min-w-0">
                <span className="truncate">
                  {selectedMasters.includes("All Masters") ? "All Masters" : `${selectedMasters.length} staff`}
                </span>
                <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 max-h-[200px] overflow-y-auto">
              {availableMasters.map((master) => (
                <DropdownMenuCheckboxItem
                  key={master}
                  checked={selectedMasters.includes(master)}
                  onCheckedChange={() => handleMasterToggle(master)}
                  className="text-xs"
                >
                  {master}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 justify-between text-[11px] h-8 bg-card/60 min-w-0">
                <span className="truncate">
                  {selectedServices.includes("All Services") ? "All Services" : `${selectedServices.length} types`}
                </span>
                <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {serviceTypes.map((service) => (
                <DropdownMenuCheckboxItem
                  key={service}
                  checked={selectedServices.includes(service)}
                  onCheckedChange={() => handleServiceToggle(service)}
                  className="text-xs"
                >
                  {service}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
          <div className="grid grid-cols-2 gap-2">
            {/* Total Revenue */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                      Revenue
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground truncate">{kpis.revenue.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {revenueChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-confirmed shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-medium ${revenueChange >= 0 ? "text-confirmed" : "text-destructive"}`}
                    >
                      {revenueChange >= 0 ? "+" : ""}
                      {revenueChange.toFixed(1)}% vs last
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Average Check with comparison */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                      <Target className="h-3.5 w-3.5 text-chart-2" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                      Avg Check
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-foreground">${kpis.avgCheck.value}</p>
                    <span className="text-[10px] text-muted-foreground line-through">${kpis.avgCheck.prevValue}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {avgCheckChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-confirmed shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-medium ${avgCheckChange >= 0 ? "text-confirmed" : "text-destructive"}`}
                    >
                      {avgCheckChange >= 0 ? "+" : ""}
                      {avgCheckChange.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Conversion Rate */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-chart-3" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                      Conversion
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{kpis.conversionRate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">visitors to bookings</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* No-Show Rate */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <UserX className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                      No-Shows
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{kpis.noShowRate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {kpis.noShowRate <= 5 ? "Healthy rate" : "Needs attention"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground truncate">Staff Utilization</span>
                  </div>
                  <span className="text-lg font-bold text-foreground shrink-0">{kpis.staffUtilization}%</span>
                </div>
                <Progress value={kpis.staffUtilization} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {kpis.staffUtilization >= 70
                    ? "High demand"
                    : kpis.staffUtilization >= 50
                      ? "Normal load"
                      : "Low activity"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
              <CardHeader className="pb-0 pt-3 px-3">
                <CardTitle className="text-[11px] font-medium text-foreground">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pr-2">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "#71717a" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            {/* Live Studio Status */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardHeader className="pb-1.5 pt-2.5 px-3">
                  <CardTitle className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-confirmed opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-confirmed"></span>
                    </span>
                    Live Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2.5 pt-0">
                  <div className="space-y-1.5">
                    {staffStatus.map((staff) => (
                      <div key={staff.name} className="flex items-center justify-between gap-1 min-w-0">
                        <span className="text-[10px] font-medium text-foreground truncate flex-1">{staff.name}</span>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${staff.status === "busy"
                            ? "bg-pending/15 text-pending"
                            : staff.status === "free"
                              ? "bg-confirmed/15 text-confirmed"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {staff.status === "busy" ? "Busy" : staff.status === "free" ? "Free" : "Break"}
                        </span>
                      </div>
                    ))}
                    {staffStatus.length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">No active staff</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Health */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm h-full">
                <CardHeader className="pb-1.5 pt-2.5 px-3">
                  <CardTitle className="text-[11px] font-medium text-foreground">Today&apos;s Payments</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2.5 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Banknote className="h-3 w-3 text-confirmed shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Cash (Est.)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">${financialHealth.cash}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CreditCard className="h-3 w-3 text-chart-2 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Card (Est.)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">${financialHealth.card}</span>
                    </div>
                    <div className="border-t border-border/50 pt-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">Total</span>
                      <span className="text-xs font-bold text-foreground">${financialHealth.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Services Donut */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
                <CardHeader className="pb-0 pt-2.5 px-3">
                  <CardTitle className="text-[11px] font-medium text-foreground">By Service</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={38}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {serviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Share"]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "10px",
                            padding: "4px 8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {serviceBreakdown.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                        No data
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-2 px-2 pb-2 flex-wrap">
                    {serviceBreakdown.slice(0, 3).map((s) => (
                      <div key={s.name} className="flex items-center gap-1" title={`${s.name}: ${s.value}%`}>
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-[9px] text-muted-foreground truncate max-w-[50px]">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Peak Hours */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
                <CardHeader className="pb-0 pt-2.5 px-3">
                  <CardTitle className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    Peak Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pr-1">
                  <div className="h-[100px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHoursData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="hour"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 8, fill: "#71717a" }}
                          interval={1}
                        />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value: number) => [value, "Bookings"]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "10px",
                            padding: "4px 8px",
                          }}
                        />
                        <Bar dataKey="bookings" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {peakHoursData.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                        No data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
