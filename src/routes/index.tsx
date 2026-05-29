import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { StatusSection } from "@/components/site/StatusSection";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stella Hosting — Deploy from GitHub in seconds" },
      {
        name: "description",
        content:
          "Premium cloud hosting that deploys directly from GitHub into secure, isolated containers with real-time logs, custom domains, SSL and built-in security.",
      },
      { property: "og:title", content: "Stella Hosting — Premium Cloud Hosting" },
      {
        property: "og:description",
        content: "Deploy from GitHub, scale instantly, and monitor everything from one beautiful dashboard.",
      },
    ],
  }),
  component: Index,
});

function CtaBand() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="glass glow-ring relative overflow-hidden rounded-3xl bg-primary/[0.06] p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl md:text-5xl">
              Your next deploy is one <span className="text-gradient">git push</span> away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of developers shipping faster on Stella Hosting. Free to start, no credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/dashboard">
                  <Github className="size-5" /> Continue with GitHub
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <a href="#pricing">
                  View pricing <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <StatusSection />
        <Faq />
        <CtaBand />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
