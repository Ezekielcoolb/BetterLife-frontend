import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "+17736643144";
const APPLY_MESSAGE = "Hello, I will like to apply for a loan";
const CONTACT_MESSAGE = "Hello, I would like to learn more about BetterLife Loans";

const buildWhatsAppLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const CallToAction = () => {
  const handleContactUs = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a3a52] to-[#2a4a62] py-20">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[#7a9b8e] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#7a9b8e] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="mb-10 text-xl text-gray-200">
            Join thousands of Nigerians who've accessed loans with BetterLife.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={buildWhatsAppLink(APPLY_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-lg bg-white px-10 py-4 text-lg font-semibold text-[#1a3a52] shadow-xl transition-all duration-300 hover:scale-105 hover:bg-slate-100 hover:shadow-2xl sm:w-auto"
            >
              Apply for a Loan
            </a>
            <button
              type="button"
              onClick={handleContactUs}
              className="w-full rounded-lg border-2 border-white px-10 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#1a3a52] sm:w-auto"
            >
              Contact Us
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-200">
            Prefer WhatsApp?
            <a
              href={buildWhatsAppLink(CONTACT_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center font-semibold text-white underline-offset-4 transition hover:underline"
            >
              Chat with us directly
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
