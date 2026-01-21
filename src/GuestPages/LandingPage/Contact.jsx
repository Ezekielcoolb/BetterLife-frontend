import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

const EMAIL_REGEX = /^(?=.*@)[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{9,15}$/;

const validateEmail = (value) => EMAIL_REGEX.test(value.trim());
const validatePhone = (value) => PHONE_REGEX.test(value.replace(/\s+/g, ""));

const inputClassName =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm shadow-sm transition focus:border-[#1a3a52] focus:outline-none focus:ring-2 focus:ring-[#1a3a52]/30";

const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!validateEmail(formData.email)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!validatePhone(formData.phone)) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (!formData.subject.trim()) {
      nextErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Message is required";
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    window.setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem("contactMessages") || "[]");
        existing.push({ ...formData, submittedAt: new Date().toISOString() });
        localStorage.setItem("contactMessages", JSON.stringify(existing));
        setFeedback({
          type: "success",
          message: "We've received your message and will get back to you soon.",
        });
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } catch (error) {
        setFeedback({ type: "error", message: "Could not send message. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    }, 1400);
  };

  return (
    <section id="contact" className="bg-white py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-[#1a3a52] md:text-4xl">Get in Touch</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Have questions? We're here to help you on your financial journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="rounded-xl border border-blue-100 bg-[#f0f9ff] p-6">
              <h3 className="mb-6 text-xl font-bold text-[#1a3a52]">Our Contact Details</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 text-[#7a9b8e] shadow-sm">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Us</h4>
                    <p className="text-gray-600">Our friendly team is here to help.</p>
                    <a
                      href="mailto:support@betterlifeloan.com"
                      className="font-medium text-[#1a3a52] hover:underline"
                    >
                      support@betterlifeloan.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 text-[#7a9b8e] shadow-sm">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone</h4>
                    <p className="text-gray-600">Give us a call.</p>
                    <a
                      href="tel:+2348030303224"
                      className="font-medium text-[#1a3a52] hover:underline"
                    >
                      +234 803 030 3224
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 text-[#7a9b8e] shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Visit Us</h4>
                    <p className="text-gray-600">Come say hello at our head office.</p>
                    <address className="not-italic font-medium text-[#1a3a52]">
                      261, Old Abeokuta Rd, Tabon Tabon, Agege, Lagos State, Nigeria
                    </address>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 text-[#7a9b8e] shadow-sm">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Our Website</h4>
                    <p className="text-gray-600">Learn more about BetterLife online.</p>
                    <a
                      href="https://betterlifeloan.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#1a3a52] hover:underline"
                    >
                      betterlifeloan.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg"
          >
            <h3 className="mb-6 text-xl font-bold text-[#1a3a52]">Send us a Message</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.name ? "border-rose-500" : ""}`}
                  />
                  {errors.name ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.email ? "border-rose-500" : ""}`}
                  />
                  {errors.email ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.phone ? "border-rose-500" : ""}`}
                  />
                  {errors.phone ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.subject ? "border-rose-500" : ""}`}
                  />
                  {errors.subject ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`${inputClassName} resize-none ${errors.message ? "border-rose-500" : ""}`}
                />
                {errors.message ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.message}</p>
                ) : null}
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-full bg-[#1a3a52] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a4a62] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>

              {feedback && (
                <p
                  className={`text-center text-sm font-medium ${
                    feedback.type === "success" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {feedback.message}
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
