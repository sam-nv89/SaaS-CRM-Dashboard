"use client"

import { motion } from "framer-motion"
import { Calendar, Users, BarChart3 } from "lucide-react"

const features = [
    {
        icon: Calendar,
        title: "Smart Scheduling",
        description: "AI-powered time slot suggestions that optimize your calendar and reduce no-shows automatically.",
    },
    {
        icon: Users,
        title: "Client Database",
        description: "Complete client profiles with visit history, preferences, notes, and automated follow-ups.",
    },
    {
        icon: BarChart3,
        title: "Financial Insights",
        description: "Real-time revenue tracking, expense management, and growth insights at your fingertips.",
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
}

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 relative overflow-hidden bg-muted/30">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance text-foreground">
                        Everything You Need
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Powerful tools designed specifically for beauty professionals. Simple to use, impossible to outgrow.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="group"
                        >
                            <div className="h-full p-6 rounded-2xl glass-card transition-all duration-300 hover:shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>

                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
