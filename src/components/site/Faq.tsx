import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How do I deploy my app?", a: "Sign in with GitHub, pick a repository and branch, set your build and start commands, and Stella provisions an isolated container and goes live — usually in under a minute." },
  { q: "How many projects can I host?", a: "Every account gets up to 5 hosting slots. You can start, stop, rebuild and delete services freely within that limit." },
  { q: "Is my deployment isolated and secure?", a: "Yes. Each project runs in its own sandboxed container with strict resource and network egress limits. We automatically scan for malware, crypto miners, reverse shells and dangerous commands, and suspend anything malicious." },
  { q: "Do you support custom domains and SSL?", a: "Absolutely. Add your own domain with one-click DNS verification, and we issue and auto-renew free TLS certificates for you." },
  { q: "Which login methods are supported?", a: "Stella Hosting uses GitHub OAuth exclusively for secure, password-free sign in with cookie-based sessions and device tracking." },
  { q: "Can I work with a team?", a: "Yes — invite team members, share services and assign granular roles on the Stellar and Galaxy plans." },
];

export function Faq() {
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Questions, <span className="text-gradient">answered</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass rounded-2xl border-0 px-5"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
