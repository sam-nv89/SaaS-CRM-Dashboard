"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  Wallet,
  Activity,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Legend
} from "recharts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

// Helper for formatting numbers with thousands separator (space)
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ru-RU').format(value)
}

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border shadow-md rounded-md p-3 text-sm z-[100] min-w-[120px]">
        {/* Only show label if it's provided and not empty */}
        {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-muted-foreground capitalize">
                  {entry.name}:
                </span>
              </div>
              <span className="font-medium text-foreground">
                {formatNumber(entry.value)}
                {entry.unit || unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function DashboardView({ onViewCalendar }: DashboardViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week")
  const [selectedMasters, setSelectedMasters] = useState<string[]>(["All Masters"])
  const [availableMasters, setAvailableMasters] = useState<string[]>(["All Masters"])
  const [isLoading, setIsLoading] = useState(true)

  // Data States
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([])
  const [peakHoursData, setPeakHoursData] = useState<PeakHourData[]>([])
  const [staffStatus, setStaffStatus] = useState<StaffStatusItem[]>([])

  // KPI State
  const [kpis, setKpis] = useState({
    revenue: { value: 0, prevValue: 0 },
    avgCheck: { value: 0, prevValue: 0 },
    conversionRate: 0,
    noShowRate: 0,
    staffUtilization: 0
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

          // Re-sort peak hours to be chronological 09-21
          const sortedPeakHours = [...peakHours].sort((a, b) => {
            return parseInt(a.hour) - parseInt(b.hour)
          })
          setPeakHoursData(sortedPeakHours)

          setStaffStatus(staffData)
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
  }, [timePeriod, selectedMasters])

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

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const revenueChange = calculateTrend(kpis.revenue.value, kpis.revenue.prevValue)
  const avgCheckChange = calculateTrend(kpis.avgCheck.value, kpis.avgCheck.prevValue)

  // Chart Colors using CSS variables
  const CHART_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-1 border">
            {(["today", "week", "month", "year"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timePeriod === period
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {selectedMasters.includes("All Masters") ? "All Staff" : `${selectedMasters.length} staff`}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {availableMasters.map((master) => (
                <DropdownMenuCheckboxItem
                  key={master}
                  checked={selectedMasters.includes(master)}
                  onCheckedChange={() => handleMasterToggle(master)}
                >
                  {master}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" onClick={onViewCalendar}>
            <Calendar className="mr-2 h-4 w-4" /> View Calendar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(kpis.revenue.value)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-confirmed mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={revenueChange >= 0 ? "text-confirmed" : "text-destructive"}>
                {Math.abs(revenueChange)}%
              </span>
              <span className="ml-1">from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Check</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(kpis.avgCheck.value)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {avgCheckChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-confirmed mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={avgCheckChange >= 0 ? "text-confirmed" : "text-destructive"}>
                {Math.abs(avgCheckChange)}%
              </span>
              <span className="ml-1">from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">No-Show Rate</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.noShowRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.noShowRate < 5 ? "Excellent reliability" : "Attention needed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffStatus.filter(s => s.status === 'busy').length} / {staffStatus.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently busy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Activity/Revenue Chart */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Income trends over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${formatNumber(value)}`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip unit="$" />} cursor={{ fill: 'transparent', stroke: 'var(--color-border)' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Services & Breakdown */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Distribution across services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-sm text-foreground ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Reduced size and centered nicely to avoid overlaps */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8 text-center" style={{ zIndex: 0 }}>
                <div>
                  <span className="text-2xl font-bold block text-foreground">{serviceBreakdown.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Categories</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Peak Hours & Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Busiest times of the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="hour"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatNumber}
                    width={30}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                    content={<CustomTooltip />}
                  />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Status List */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Status</CardTitle>
            <CardDescription>Real-time availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffStatus.map((staff) => (
                <div key={staff.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${staff.status === 'busy' ? 'bg-orange-500' :
                        staff.status === 'free' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    <span className="font-medium text-sm">{staff.name}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${staff.status === 'busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      staff.status === 'free' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                    }`}>
                    {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                  </span>
                </div>
              ))}
              {staffStatus.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">No staff data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
