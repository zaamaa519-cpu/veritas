'use client';

import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { ArrowRight, Search, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

function HeroSection() {
  return (
    <div className="min-h-screen dark:bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950 relative overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-float-slow opacity-50"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-float-medium opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float-fast opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float-slow opacity-50"></div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-pulse"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400"
        >
          Veritas AI
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-xl md:text-2xl mb-8 text-foreground/80 max-w-2xl"
        >
          Your <span className="text-cyan-300 font-semibold">AI-powered guardian</span> against misinformation
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <Link href="/analysis" passHref>
            <button className="group relative bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25">
              <span className="relative z-10">Analyze Article</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
            </button>
          </Link>
          
          <Link href="/quiz" passHref>
            <button className="group relative border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/10 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
              <span className="relative z-10">Start Quiz Challenge</span>
            </button>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl text-foreground"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-300 mb-2">10K+</div>
            <div className="text-foreground/70">Articles Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-300 mb-2">98%</div>
            <div className="text-foreground/70">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-2">5M+</div>
            <div className="text-foreground/70">Fake News Detected</div>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-cyan-300"
      >
        ↓
      </motion.div>
    </div>
  );
}

function FeaturesSection() {
    const features = [
        {
            icon: <Search className="w-8 h-8 text-white" />,
            title: "Deep Analysis",
            description: "Our AI scans multiple credibility indicators including source reliability, bias detection, and factual consistency."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-white" />,
            title: "Source Verification",
            description: "Cross-references claims with a vast database of trusted news outlets to ensure information is corroborated."
        },
        {
            icon: <Zap className="w-8 h-8 text-white" />,
            title: "Real-Time Results",
            description: "Get instant feedback on articles with a detailed breakdown of potential red flags and credibility scores."
        }
    ];

  return (
    <div className="py-20 dark:bg-gradient-to-b from-blue-950 to-purple-950 relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:40px_40px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4"
        >
          How Veritas AI Works
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true, amount: 0.8 }}
          className="text-xl text-foreground/70 text-center mb-16 max-w-3xl mx-auto"
        >
          Advanced AI technology combined with human expertise to deliver reliable fact-checking.
        </motion.p>
        
        <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
                <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1, transition: { delay: i * 0.1 } }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    viewport={{ once: true, amount: 0.5 }}
                    className="group dark:bg-white/10 bg-card backdrop-blur-lg rounded-2xl p-8 border dark:border-white/20 border-border hover:border-cyan-400/50 transition-all duration-300"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                    <p className="text-foreground/70 mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors cursor-pointer">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DemoSection() {
    return (
        <div className="py-20 dark:bg-gradient-to-b from-purple-950 to-gray-900 relative bg-background">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        className="dark:bg-gray-900/50 bg-card backdrop-blur-lg rounded-3xl p-8 border dark:border-white/10 border-border"
                    >
                        <div className="flex space-x-2 mb-6">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>

                        <TypeAnimation
                            sequence={[
                                'Breaking: Scientists discover revolutionary energy source that powers entire cities for years!',
                                2000,
                                'Analyzing claim...',
                                500,
                                'Verifying sources against trusted databases...',
                                1000,
                                'Result: 87% Credible. Multiple Tier-1 sources confirm research.',
                                3000
                            ]}
                            wrapper="div"
                            speed={60}
                            repeat={Infinity}
                            className="text-lg text-foreground font-mono min-h-[100px]"
                        />

                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-foreground/70 mb-2">
                                <span>Low Credibility</span>
                                <span>High Credibility</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-3">
                                <motion.div
                                    animate={{ width: ['0%', '87%', '87%', '0%'] }}
                                    transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
                                    className="bg-gradient-to-r from-green-400 to-cyan-400 h-3 rounded-full"
                                ></motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            See Truth in <span className="text-cyan-400">Real-Time</span>
                        </h2>
                        <p className="text-xl text-foreground/70 mb-8">
                            Watch as Veritas AI analyzes claims, checks sources, and provides instant credibility scores with detailed breakdowns.
                        </p>
                         <Link href="/analysis" passHref>
                            <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors">
                                Try Live Demo
                            </button>
                         </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}


export function AnimatedHomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <DemoSection />
    </>
  );
}
