"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"
import Link from "next/link"
import {
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Target,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Moon,
  Sun,
  Bot,
  FileText,
  Bell,
  Clock,
  PieChart,
  Workflow,
  Sparkles,
  Play,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"

// Custom hook for scroll animations
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
      }
    }, { threshold: 0.1, ...options })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, isInView } = useInView()
  const numericValue = parseInt(value.replace(/\D/g, '')) || 0

  useEffect(() => {
    if (isInView && numericValue > 0) {
      let start = 0
      const duration = 2000
      const increment = numericValue / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= numericValue) {
          setCount(numericValue)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [isInView, numericValue])

  return (
    <span ref={ref}>
      {value.includes('%') ? `${count}%` : value.includes('x') ? `${count}x` : value.includes('/') ? value : count}
      {suffix}
    </span>
  )
}

// Generate fixed particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 15, top: 20, delay: 0.5, duration: 8 },
  { left: 85, top: 15, delay: 1.2, duration: 12 },
  { left: 45, top: 80, delay: 2.1, duration: 9 },
  { left: 70, top: 45, delay: 0.8, duration: 11 },
  { left: 25, top: 60, delay: 3.2, duration: 7 },
  { left: 90, top: 70, delay: 1.5, duration: 10 },
  { left: 10, top: 85, delay: 2.8, duration: 13 },
  { left: 55, top: 25, delay: 0.3, duration: 8 },
  { left: 35, top: 55, delay: 4.1, duration: 9 },
  { left: 80, top: 90, delay: 1.9, duration: 11 },
  { left: 20, top: 35, delay: 2.5, duration: 10 },
  { left: 65, top: 75, delay: 3.8, duration: 7 },
  { left: 40, top: 10, delay: 0.9, duration: 12 },
  { left: 95, top: 50, delay: 2.2, duration: 8 },
  { left: 5, top: 65, delay: 1.1, duration: 14 },
  { left: 75, top: 30, delay: 3.5, duration: 9 },
  { left: 50, top: 95, delay: 0.6, duration: 11 },
  { left: 30, top: 40, delay: 4.5, duration: 8 },
  { left: 60, top: 5, delay: 2.9, duration: 10 },
  { left: 12, top: 50, delay: 1.7, duration: 13 },
]

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const heroRef = useInView()
  const statsRef = useInView()
  const featuresRef = useInView()
  const workflowRef = useInView()
  const benefitsRef = useInView()
  const ctaRef = useInView()

  const features = [
    {
      icon: Users,
      title: "Lead Management",
      description: "Capture, track, and nurture leads through your entire sales pipeline with ease.",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Schedule meetings, demos, and follow-ups with Google Calendar integration.",
    },
    {
      icon: Bot,
      title: "AI Chatbot",
      description: "Automated customer engagement with intelligent chatbot assistance.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights and reports to track team performance and conversions.",
    },
    {
      icon: Workflow,
      title: "Drip Campaigns",
      description: "Automate your marketing with customizable drip email sequences.",
    },
    {
      icon: FileText,
      title: "Proposals & Quotations",
      description: "Create professional proposals and quotations in minutes.",
    },
  ]

  const benefits = [
    "Role-based access control for secure team collaboration",
    "Bulk upload leads from Excel/CSV files",
    "Real-time activity tracking and logging",
    "Custom task management with reminders",
    "Client conversion tracking with detailed history",
    "Mobile-responsive design for on-the-go access",
  ]

  const stats = [
    { value: "50%", label: "Increase in Conversions" },
    { value: "3x", label: "Faster Follow-ups" },
    { value: "100%", label: "Team Visibility" },
    { value: "24/7", label: "Automation Support" },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse"
          style={{
            left: `${mousePosition.x * 0.02}px`,
            top: `${mousePosition.y * 0.02}px`,
            transition: 'left 0.5s ease-out, top 0.5s ease-out'
          }}
        />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-primary/50">
              <Target className="h-5 w-5 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground bg-clip-text transition-all duration-300 group-hover:from-primary group-hover:to-blue-600 group-hover:text-transparent">
              Indus CRM
            </span>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 transition-all duration-300 hover:scale-110 hover:rotate-180"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            <Button variant="ghost" asChild className="transition-all duration-300 hover:scale-105">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50 animate-shimmer bg-[linear-gradient(110deg,var(--primary),45%,#60a5fa,55%,var(--primary))] bg-[length:200%_100%]">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" ref={heroRef.ref}>
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-40" />

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLE_POSITIONS.map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge with pulse animation */}
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-sm transition-all duration-700 ${
                heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Powerful CRM for Modern Businesses</span>
            </div>

            {/* Animated headline */}
            <h1
              className={`mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-700 delay-200 ${
                heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="inline-block animate-[slideInWord_0.5s_ease-out_0.3s_both]">Manage</span>{" "}
              <span className="inline-block animate-[slideInWord_0.5s_ease-out_0.4s_both]">Relationships,</span>{" "}
              <span className="inline-block bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Drive Growth
              </span>
            </h1>

            <p
              className={`mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl transition-all duration-700 delay-400 ${
                heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Streamline your sales process, automate follow-ups, and convert more leads with Indus CRM.
              The all-in-one platform designed for teams that want to win.
            </p>

            {/* CTA buttons with hover effects */}
            <div
              className={`flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-700 delay-500 ${
                heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Button
                size="lg"
                className="h-12 px-8 text-base group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                asChild
              >
                <Link href="/login">
                  <span className="relative z-10 flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_100%] animate-shimmer" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base group transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-primary/5"
                asChild
              >
                <Link href="#features">
                  <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-125" />
                  See Features
                </Link>
              </Button>
            </div>

            {/* Animated scroll indicator */}
            <div className="mt-16 flex justify-center animate-bounce">
              <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
                <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-[scrollDown_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30 py-16" ref={statsRef.ref}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  statsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-3xl font-bold text-primary md:text-5xl mb-2 tabular-nums">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                <div className="mt-3 h-1 w-12 mx-auto bg-gradient-to-r from-primary to-blue-500 rounded-full transform scale-x-0 animate-[scaleX_0.5s_ease-out_forwards]" style={{ animationDelay: `${index * 150 + 500}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28" ref={featuresRef.ref}>
        <div className="container mx-auto px-4">
          <div
            className={`mx-auto mb-16 max-w-2xl text-center transition-all duration-700 ${
              featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 text-primary mb-4 text-sm font-medium">
              <div className="h-px w-8 bg-primary" />
              FEATURES
              <div className="h-px w-8 bg-primary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Everything You Need to{" "}
              <span className="relative">
                <span className="relative z-10">Close More Deals</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1" />
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              From lead capture to client conversion, Indus CRM provides all the tools your team needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-2 ${
                  featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '1px' }}>
                  <div className="absolute inset-[1px] bg-card rounded-xl" />
                </div>

                <CardContent className="relative p-6 z-10">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary/50">
                    <feature.icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-sm font-medium">Learn more</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30 py-20 md:py-28" ref={workflowRef.ref}>
        <div className="container mx-auto px-4">
          <div
            className={`mx-auto mb-16 max-w-2xl text-center transition-all duration-700 ${
              workflowRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 text-primary mb-4 text-sm font-medium">
              <div className="h-px w-8 bg-primary" />
              HOW IT WORKS
              <div className="h-px w-8 bg-primary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Simple Workflow, Powerful Results
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes and see results from day one.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-4">
            {/* Animated connecting line */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block">
              <div
                className={`h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 ease-out ${
                  workflowRef.isInView ? 'w-full' : 'w-0'
                }`}
              />
            </div>

            {[
              { icon: Users, title: "Capture Leads", desc: "Import or create leads from multiple sources" },
              { icon: Bell, title: "Set Reminders", desc: "Schedule follow-ups and never miss an opportunity" },
              { icon: MessageSquare, title: "Engage & Nurture", desc: "Use automated drips and chatbot for engagement" },
              { icon: TrendingUp, title: "Convert & Track", desc: "Close deals and analyze your success" },
            ].map((step, index) => (
              <div
                key={index}
                className={`relative text-center transition-all duration-700 ${
                  workflowRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Step number */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary text-xs font-bold flex items-center justify-center text-primary z-10">
                  {index + 1}
                </div>

                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all duration-500 hover:scale-110 hover:rotate-6 hover:shadow-xl hover:shadow-primary/30 group cursor-pointer">
                  <step.icon className="h-9 w-9 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 relative" ref={benefitsRef.ref}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div
              className={`transition-all duration-700 ${
                benefitsRef.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="inline-flex items-center gap-2 text-primary mb-4 text-sm font-medium">
                <div className="h-px w-8 bg-primary" />
                WHY CHOOSE US
                <div className="h-px w-8 bg-primary" />
              </div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                Why Teams Choose{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Indus CRM
                </span>
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Built for Indian businesses, Indus CRM combines powerful features with intuitive design
                to help your team work smarter, not harder.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className={`flex items-start gap-3 transition-all duration-500 hover:translate-x-2 ${
                      benefitsRef.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}
                    style={{ transitionDelay: `${index * 100 + 300}ms` }}
                  >
                    <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  size="lg"
                  asChild
                  className="group transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Link href="/login">
                    Try It Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className={`relative transition-all duration-700 delay-300 ${
                benefitsRef.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`}
            >
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-3xl transform rotate-3" />

              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: PieChart, value: "85%", label: "Lead Response Rate", delay: 0 },
                  { icon: Clock, value: "2hrs", label: "Avg Response Time", delay: 100, offset: true },
                  { icon: Target, value: "40%", label: "Higher Conversion", delay: 200 },
                  { icon: Shield, value: "100%", label: "Data Security", delay: 300, offset: true },
                ].map((card, index) => (
                  <Card
                    key={index}
                    className={`p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 hover:border-primary/50 group ${
                      card.offset ? 'mt-8' : ''
                    } ${
                      benefitsRef.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
                    style={{ transitionDelay: `${card.delay + 400}ms` }}
                  >
                    <card.icon className="mb-3 h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <div className="text-2xl font-bold group-hover:text-primary transition-colors">{card.value}</div>
                    <div className="text-sm text-muted-foreground">{card.label}</div>

                    {/* Animated underline */}
                    <div className="mt-3 h-0.5 w-0 bg-gradient-to-r from-primary to-blue-500 group-hover:w-full transition-all duration-500" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t overflow-hidden" ref={ctaRef.ref}>
        {/* Animated background */}
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-24 text-center">
          <div
            className={`transition-all duration-700 ${
              ctaRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Start Your Journey Today</span>
            </div>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground md:text-5xl">
              Ready to Transform Your Sales?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
              Join businesses that have already improved their customer relationships with Indus CRM.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base group transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href="/login">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/30 px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300 hover:scale-105 hover:border-primary-foreground"
                asChild
              >
                <Link href="/login">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2 group cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Indus CRM</span>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                The complete CRM solution for managing leads, clients, and growing your business efficiently.
              </p>

              {/* Social links placeholder */}
              <div className="mt-4 flex gap-3">
                {['twitter', 'linkedin', 'facebook'].map((social) => (
                  <div
                    key={social}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  >
                    <span className="text-xs font-medium uppercase">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['Features', 'Dashboard', 'Lead Management', 'Reports'].map((item) => (
                  <li key={item}>
                    <Link
                      href={item === 'Features' ? '#features' : '/login'}
                      className="hover:text-primary transition-colors duration-300 inline-flex items-center group"
                    >
                      <span className="w-0 h-px bg-primary mr-0 group-hover:w-2 group-hover:mr-2 transition-all duration-300" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="hover:text-primary transition-colors duration-300 inline-flex items-center group"
                    >
                      <span className="w-0 h-px bg-primary mr-0 group-hover:w-2 group-hover:mr-2 transition-all duration-300" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
            <p>&copy; {new Date().getFullYear()} Indus CRM. All rights reserved.</p>
            <p className="flex items-center gap-2">
              Made with <span className="text-red-500 animate-pulse">❤</span> for Indian businesses
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scrollDown {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.5; }
        }

        @keyframes slideInWord {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
