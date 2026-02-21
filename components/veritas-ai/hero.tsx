import { Button } from "@/components/ui/button";
import { LearnMoreModal } from "./learn-more-modal";
import { AnimatedCharacter } from "./animated-character";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden py-24 md:py-32 lg:py-40 xl:py-48">
      <div className="container relative px-4 md:px-6">
        <div className="mx-auto grid max-w-4xl place-items-center gap-6 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent">
                Veritas AI
              </span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Your AI-powered tool for detecting fake news. Uncover the truth in headlines and articles with advanced analysis.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button asChild size="lg" className="shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-shadow hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)]">
              <Link href="/analysis">Analyze Article</Link>
            </Button>
            <LearnMoreModal />
          </div>
        </div>
      </div>
    </section>
  );
}
