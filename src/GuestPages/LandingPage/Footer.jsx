import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const quickLinks = [
  { label: "Home", id: "hero" },
  { label: "About", id: "about" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Products", id: "products" },
  { label: "Contact", id: "contact" },
];

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="footer" className="bg-[#1a3a52] py-12 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://horizons-cdn.hostinger.com/227f4d09-e3c7-46ef-bfc9-6f166ae534f7/5a73f2077959e8ed8969f06261963a66.png"
                alt="BetterLife Loans Logo"
                className="h-9 w-auto"
              />
              {/* <span className="text-xl font-bold">BetterLife Loans</span> */}
            </div>
            <p className="text-sm text-gray-300">Financial inclusion for every Nigerian.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="mb-4 block text-lg font-semibold">Quick Links</span>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm text-gray-300 transition-colors hover:text-[#7a9b8e]"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="mb-4 block text-lg font-semibold">Contact Us</span>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:info@betterlifeloans.ng" className="transition hover:text-white">
                  info@betterlifeloans.ng
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+2348001234567" className="transition hover:text-white">
                  +234 800 123 4567
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1" />
                <span>123 Financial District, Lagos, Nigeria</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="mb-4 block text-lg font-semibold">Follow Us</span>
            <div className="flex gap-4">
              {["Facebook", "Twitter", "Instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a9b8e] transition-colors hover:bg-[#6a8b7e]"
                >
                  {social === "Facebook" && <Facebook size={20} />}
                  {social === "Twitter" && <Twitter size={20} />}
                  {social === "Instagram" && <Instagram size={20} />}
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-600 pt-6 text-center"
        >
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BetterLife Loans. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
