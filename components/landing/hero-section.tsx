"use client"

import { Button } from "@/components/ui/button"
import { Play, Calendar, Users, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 mesh-gradient" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left"
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance">
                            <span className="text-foreground">Streamline Your </span>
                            <span className="text-gradient">Beauty Business</span>
                        </h1>

                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            The all-in-one platform for booking, client management, and effortless business growth.
                            Built for beauty salons and independent stylists.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/signup">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base"
                                >
                                    Get Started Free
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-8 text-base border-border bg-card/50 hover:bg-card text-foreground"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    View Demo
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Content - Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative animate-float">
                            {/* Main Dashboard Card */}
                            <div className="glass-card rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Today&apos;s Schedule</h3>
                                        <p className="text-sm text-muted-foreground">Monday, Jan 19</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                </div>

                                {/* Appointment Cards */}
                                <div className="space-y-3">
                                    {[
                                        { time: "9:00 AM", client: "Sarah Johnson", service: "Haircut & Color", duration: "2h" },
                                        { time: "11:30 AM", client: "Emma Wilson", service: "Balayage", duration: "3h" },
                                        { time: "3:00 PM", client: "Mia Davis", service: "Blowout", duration: "45m" },
                                    ].map((apt, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-background/50 border border-border/50"
                                        >
                                            <div className="w-1 h-12 rounded-full bg-primary" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-foreground text-sm">{apt.client}</span>
                                                    <span className="text-xs text-muted-foreground">{apt.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">{apt.service}</span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground">{apt.duration}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Stats Card - Bottom Left */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 }}
                                className="absolute -bottom-4 -left-4 glass-card rounded-xl p-4 shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Revenue Today</div>
                                        <div className="text-lg font-bold text-foreground">$1,420</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating Client Card - Top Right */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="absolute -top-4 -right-4 glass-card rounded-xl p-4 shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">New Clients</div>
                                        <div className="text-lg font-bold text-foreground">+12</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
