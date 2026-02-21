'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function DetailedReasoning({ steps }: { steps: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <Accordion type="single" collapsible>
          <AccordionItem value="reasoning" className="border-none">
            <AccordionTrigger className="text-lg md:text-xl font-semibold hover:no-underline">
              🔍 Detailed Reasoning
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary">
                      {i + 1}
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground pt-2 leading-relaxed">{step}</p>
                  </motion.div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </motion.div>
  );
}
