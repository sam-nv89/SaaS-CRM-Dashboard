"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
    {
        name: "Starter",
        price: "Free",
        description: "Perfect for getting started",
        features: [
            "Up to 50 appointments/month",
            "Basic client profiles",
            "Email reminders",
            "1 staff member",
        ],
        cta: "Get Started",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For growing salons",
        features: [
            "Unlimited appointments",
            "Full client database",
            "SMS & Email reminders",
            "Up to 5 staff members",
            "Financial reports",
            "Priority support",
        ],
        cta: "Start Free Trial",
        highlighted: true,
    },
    {
        name: "Enterprise",
        price: "$79",
        period: "/month",
        description: "For multi-location businesses",
        features: [
            "Everything in Pro",
            "Unlimited staff",
            "Multiple locations",
            "Custom integrations",
            "Dedicated account manager",
            "API access",
        ],
        cta: "Contact Sales",
        highlighted: false,
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
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

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance text-foreground">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose the plan that fits your business. No hidden fees, cancel anytime.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="relative"
                        >
                            <div
                                className={`h-full p-6 rounded-2xl glass-card transition-all duration-300 ${plan.highlighted
                                    ? "ring-2 ring-primary shadow-lg"
                                    : ""
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {plan.description}
                                    </p>
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                        {plan.period && (
                                            <span className="text-muted-foreground ml-1">{plan.period}</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link href={plan.cta === "Contact Sales" ? "#contact" : "/signup"} className="w-full block">
                                    <Button
                                        className={`w-full ${plan.highlighted
                                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            }`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
