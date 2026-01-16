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
  Zap,
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
  CartesianGrid,
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

// Styled Custom Tooltip
function CustomTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = ""
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  prefix?: string;
  suffix?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 shadow-xl ring-1 ring-black/5 min-w-[100px]">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {payload[0].color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />}
          <span className="text-sm font-bold text-foreground">
            {prefix}{payload[0].value.toLocaleString()}{suffix}
          </span>
        </div>
      </div>
    )
  }
  return null
}

// Skeleton Loader
function GridSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl opacity-50" />
        ))}
      </div>
      <div className="skeleton h-40 rounded-xl opacity-50" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-32 rounded-xl opacity-50" />
        <div className="skeleton h-32 rounded-xl opacity-50" />
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

  // Financial Health State
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
          setAvailableMasters(mastersList)
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
            conversionRate: 34,
            noShowRate: Math.round(stats.noShowRate),
            staffUtilization: 72,
          })

          setRevenueData(chartData)
          setServiceBreakdown(servicesData)
          setPeakHoursData(peakHours)
          setStaffStatus(staffData)

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
    <div className="space-y-4 mesh-gradient min-h-full -mx-4 -mt-4 px-4 pt-4 pb-6">
      {/* Control Bar */}
      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-1 p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-white/5 shadow-sm">
          {(["today", "week", "month", "year"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${timePeriod === period
                ? "bg-card text-foreground shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 bg-card/50 backdrop-blur-sm border-white/10 flex-1 hover:bg-card/80 transition-all font-medium"
            onClick={onViewCalendar}
          >
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs">Calendar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-[1.5] justify-between text-xs h-9 bg-card/50 backdrop-blur-sm border-white/10 min-w-0 font-medium">
                <span className="truncate">
                  {selectedMasters.includes("All Masters") ? "All Staff" : `${selectedMasters.length} staff`}
                </span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-1">
              {availableMasters.map((master) => (
                <DropdownMenuCheckboxItem
                  key={master}
                  checked={selectedMasters.includes(master)}
                  onCheckedChange={() => handleMasterToggle(master)}
                  className="text-xs rounded-lg py-2"
                >
                  {master}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.section>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Revenue Card */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-primary/20">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Revenue</span>
                  </div>
                  <p className="text-2xl font-black text-foreground tracking-tight">{kpis.revenue.label}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${revenueChange >= 0 ? "bg-confirmed/10 text-confirmed" : "bg-destructive/10 text-destructive"}`}>
                      {revenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{Math.abs(revenueChange).toFixed(0)}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">vs prev.</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Avg Check Card */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-chart-2/20">
                      <Target className="h-4 w-4 text-chart-2" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Avg Check</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-foreground tracking-tight">${kpis.avgCheck.value}</p>
                    {kpis.avgCheck.prevValue > 0 && (
                      <span className="text-[10px] text-muted-foreground line-through decoration-muted-foreground/50">${kpis.avgCheck.prevValue}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${avgCheckChange >= 0 ? "bg-confirmed/10 text-confirmed" : "bg-destructive/10 text-destructive"}`}>
                      {avgCheckChange >= 0 ? "+" : ""}{avgCheckChange.toFixed(0)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Conversion */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-chart-3/20">
                      <Zap className="h-4 w-4 text-chart-3" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Conv.</span>
                  </div>
                  <p className="text-2xl font-black text-foreground tracking-tight">{kpis.conversionRate}%</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-1">visitors converted</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* No-Shows */}
            <motion.div variants={cardVariants}>
              <Card className="bg-card/80 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-destructive/20">
                      <UserX className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">No-Show</span>
                  </div>
                  <p className="text-2xl font-black text-foreground tracking-tight">{kpis.noShowRate}%</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-1">
                    {kpis.noShowRate <= 5 ? "Excellent" : "High rate"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Revenue Chart */}
          <motion.div variants={cardVariants}>
            <Card className="bg-card/90 backdrop-blur-xl border-white/10 shadow-lg overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenue Trend</CardTitle>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-primary font-bold">Live</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[160px] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50 pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      animationDuration={1500}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                      dy={-10}
                      interval="preserveStartEnd"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {/* Live Status */}
            <motion.div variants={cardVariants} className="flex flex-col h-full">
              <Card className="bg-card/85 backdrop-blur-md border-white/10 shadow-lg flex-1">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Studio Status
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-confirmed opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-confirmed"></span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2.5">
                    {staffStatus.slice(0, 4).map((staff) => (
                      <div key={staff.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${staff.status === 'busy' ? 'bg-pending' : staff.status === 'free' ? 'bg-confirmed' : 'bg-muted-foreground'
                            }`} />
                          <span className="text-[11px] font-semibold text-foreground truncate">{staff.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${staff.status === "busy" ? "bg-pending/10 text-pending" :
                            staff.status === "free" ? "bg-confirmed/10 text-confirmed" :
                              "bg-muted/50 text-muted-foreground"
                          }`}>
                          {staff.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services Donut */}
            <motion.div variants={cardVariants} className="flex flex-col h-full">
              <Card className="bg-card/85 backdrop-blur-md border-white/10 shadow-lg flex-1">
                <CardHeader className="pb-0 pt-4 px-4 mb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Services</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center justify-center pb-2">
                  <div className="h-32 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {serviceBreakdown.map((entry, index) => (
                            <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={serviceBreakdown}
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {serviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#color-${index})`} style={{ outline: 'none' }} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip suffix="%" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-foreground">{serviceBreakdown.length}</span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Types</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 px-2 pb-3 w-full">
                    {serviceBreakdown.slice(0, 2).map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-[10px] font-medium text-muted-foreground">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Peak Hours */}
          <motion.div variants={cardVariants}>
            <Card className="bg-card/90 backdrop-blur-xl border-white/10 shadow-lg">
              <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Activity by Hour</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[140px] px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }}
                      content={<CustomTooltip suffix=" bookings" />}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="url(#barGradient)"
                      radius={[6, 6, 6, 6]}
                      barSize={24}
                    />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                      interval={0}
                      dy={-5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Utilization - Bottom Full Width */}
          <motion.div variants={cardVariants}>
            <Card className="bg-card/85 backdrop-blur-md border-white/10 shadow-lg overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 ring-1 ring-purple-500/20">
                    <Activity className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Staff Load</p>
                    <p className="text-[10px] text-muted-foreground">
                      {kpis.staffUtilization >= 70 ? "High Demand" : "Moderate Load"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 max-w-[50%] flex flex-col items-end gap-1.5">
                  <span className="text-xl font-black text-foreground">{kpis.staffUtilization}%</span>
                  <Progress value={kpis.staffUtilization} className="h-2 w-full bg-secondary" indicatorClassName="bg-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      )}
    </div>
  )
}
