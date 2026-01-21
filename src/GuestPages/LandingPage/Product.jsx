import React from "react";
import { motion } from "framer-motion";

const products = [
  {
    name: "Daily Traders Loan",
    image:
      "https://horizons-cdn.hostinger.com/227f4d09-e3c7-46ef-bfc9-6f166ae534f7/f283c59c7a772349f01534a1a50ece83.png",
    alt: "Smiling Nigerian woman in a yellow shirt and gray apron holding a melon at a market stall.",
    description: "Get instant cash for daily expenses and emergencies.",
    features: [
      "Loan amount: ₦50,000 - ₦100,000",
      "Repayment period: 30-90 days",
      "Quick approval",
      "No collateral required",
    ],
  },
  {
    name: "Salary Advance Loan",
    image:
      "https://horizons-cdn.hostinger.com/227f4d09-e3c7-46ef-bfc9-6f166ae534f7/26a09ddfb5b71cbdb5bd08165511b6c0.png",
    alt: "Professional woman seated in an office environment, representing salary advance needs.",
    description: "Access your salary before payday for urgent needs.",
    features: [
      "Loan amount: Up to 50% of salary",
      "Automatic deduction on payday",
      "Low interest rates",
      "Quick disbursement",
    ],
  },
  {
    name: "POS Agent Funding",
    image: "https://images.unsplash.com/photo-1508938255445-041651dfe0c3",
    alt: "POS terminal with cash, representing funding support for POS agents.",
    description: "Grow your POS business with working capital.",
    features: [
      "Loan amount: ₦50,000 - ₦500,000",
      "Flexible repayment terms",
      "Business growth support",
      "Competitive interest rates",
    ],
  },
];

const Products = () => {
  return (
    <section id="products" className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-[#1a3a52] md:text-4xl">Our Products</h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Tailored financing options designed to support traders, salaried workers, and growing POS businesses across
            Nigeria.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {products.map((product, index) => (
            <motion.article
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="overflow-hidden rounded-xl border-t-4 border-[#7a9b8e] bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.alt}
                  className={`h-full w-full ${
                    product.name === "Daily Traders Loan" || product.name === "Salary Advance Loan"
                      ? "object-contain"
                      : "object-cover"
                  } transition-transform duration-300 hover:scale-105`}
                />
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#1a3a52]">{product.name}</h3>
                  <p className="mt-2 text-gray-600">{product.description}</p>
                </div>

                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#7a9b8e]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
