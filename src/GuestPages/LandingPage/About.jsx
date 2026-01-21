import React from "react";
import { motion } from "framer-motion";
import { Shield, Users, Zap } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust",
      description:
        "We operate with transparency and integrity, building lasting relationships with our customers.",
    },
    {
      icon: Zap,
      title: "Speed",
      description:
        "Fast approval and disbursement means you get funds when you need them most.",
    },
    {
      icon: Users,
      title: "Accessibility",
      description:
        "Financial services for everyone, regardless of background or banking history.",
    },
  ];

  return (
    <section id="about" className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-[#1a3a52] md:text-4xl">
            About BetterLife Loans
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-700">
            We believe financial inclusion is the foundation of prosperity. We provide accessible loans to small
            businesses, artisans, salary earners, POS agents, okada riders, and the unbanked.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#7a9b8e]">
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="mb-4 text-center text-2xl font-bold text-[#1a3a52]">
                  {value.title}
                </h3>
                <p className="text-center text-gray-600">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
