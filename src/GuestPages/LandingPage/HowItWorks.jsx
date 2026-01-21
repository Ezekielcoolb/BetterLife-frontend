import React from "react";
import { motion } from "framer-motion";
import { Banknote, CheckCircle, FileText, Search } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: FileText,
      title: "Apply Online",
      description: "Fill out our simple application form with basic information.",
    },
    {
      number: 2,
      icon: Search,
      title: "Quick Verification",
      description: "We verify your details quickly and securely.",
    },
    {
      number: 3,
      icon: CheckCircle,
      title: "Get Approved",
      description: "Receive a fast decision on your loan application.",
    },
    {
      number: 4,
      icon: Banknote,
      title: "Receive Funds",
      description: "Money is transferred directly to your account.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-[#1a3a52] md:text-4xl">How It Works</h2>
        </motion.div>

        <div className="hidden gap-8 md:grid md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#7a9b8e]">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a3a52]">
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[#1a3a52]">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-10 h-1 w-full -z-0 bg-[#7a9b8e]/30" />
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-8 md:hidden">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#7a9b8e]">
                    <span className="text-xl font-bold text-white">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && <div className="mt-2 w-1 flex-1 bg-[#7a9b8e]/30" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a52]">
                    <Icon className="text-white" size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#1a3a52]">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
