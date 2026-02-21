'use client';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { CheckCircle } from 'lucide-react';

export default function AboutPage() {
    return (
        <section className="relative w-full overflow-hidden py-24 md:py-32 lg:py-40">
            <AnimatedCharacter className="absolute -top-1/3 -right-1/4 w-2/3 h-auto opacity-10" animationDirection="reverse" />
            <div className="container relative px-4 md:px-6">
                <div className="mx-auto grid max-w-4xl gap-10">
                    <div className="space-y-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                            About{' '}
                            <span className="animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent">
                                Veritas AI
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground md:text-xl">
                            Our mission is to empower individuals with the tools to critically evaluate information and combat the spread of misinformation in the digital age.
                        </p>
                    </div>

                    <div className="grid gap-8 rounded-lg border border-primary/20 bg-card/80 p-8 backdrop-blur-xl glow-shadow-sm">
                        <h2 className="text-2xl font-bold text-center">How It Works</h2>
                        <div className="grid gap-6">
                          <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold">Advanced AI Analysis</h3>
                              <p className="text-sm text-muted-foreground">
                                Veritas AI leverages state-of-the-art language models to perform a deep analysis of your submitted text. It looks for common patterns found in misinformation.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold">Multi-Faceted Evaluation</h3>
                              <p className="text-sm text-muted-foreground">
                                The analysis isn't just about keywords. Our AI evaluates source reputation (if provided), linguistic style, emotional sentiment, and factual consistency.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold">Interactive Learning</h3>
                              <p className="text-sm text-muted-foreground">
                                Through our Quiz Mode and interactive results, we aim to not just give you an answer, but to teach you how to spot red flags on your own.
                              </p>
                            </div>
                          </div>
                        </div>
                    </div>
                    
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold">Our Commitment to Truth</h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto">
                            Veritas AI is a tool designed to assist, not replace, critical thinking. We are continuously improving our models and algorithms with the latest research in misinformation detection and user feedback. Our goal is to create a more informed and discerning online community.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
