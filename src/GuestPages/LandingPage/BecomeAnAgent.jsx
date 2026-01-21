import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Loader2, Network, TrendingUp } from "lucide-react";

const EMAIL_REGEX = /^(?=.*@)[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{9,15}$/;

const validateEmail = (value) => EMAIL_REGEX.test(value.trim());
const validatePhone = (value) => PHONE_REGEX.test(value.replace(/\s+/g, ""));

const inputBaseClass =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm shadow-sm transition focus:border-[#1a3a52] focus:outline-none focus:ring-2 focus:ring-[#1a3a52]/30";

const BecomeAnAgent = () => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experienceLevel: "None",
    preferredLocation: "",
    availability: "Full-time",
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);

  const benefits = useMemo(
    () => [
      {
        icon: Clock,
        title: "Flexible Hours",
        description: "Work at your own pace and set your own schedule.",
      },
      {
        icon: TrendingUp,
        title: "Competitive Commission",
        description: "Earn attractive commissions on every successful loan.",
      },
      {
        icon: BookOpen,
        title: "Training & Support",
        description: "Get comprehensive onboarding and continuous mentorship.",
      },
      {
        icon: Network,
        title: "Growing Network",
        description: "Join a thriving community of BetterLife agents across Nigeria.",
      },
    ],
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    if (!validateEmail(formData.email)) {
      nextErrors.email = "Please enter a valid email";
    }

    if (!validatePhone(formData.phone)) {
      nextErrors.phone = "Enter a phone number with 9-15 digits";
    }

    if (!formData.preferredLocation.trim()) {
      nextErrors.preferredLocation = "Location is required";
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
        const applications = JSON.parse(localStorage.getItem("agentApplications") || "[]");
        applications.push({ ...formData, submittedAt: new Date().toISOString() });
        localStorage.setItem("agentApplications", JSON.stringify(applications));
        setFeedback({
          type: "success",
          title: "Application Received!",
          message: "Thank you for applying. Our team will get in touch shortly.",
        });
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          experienceLevel: "None",
          preferredLocation: "",
          availability: "Full-time",
        });
        setShowForm(false);
      } catch (error) {
        setFeedback({
          type: "error",
          title: "Something went wrong",
          message: "We could not save your application. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 1400);
  };

  return (
    <section
      id="become-agent"
      className="bg-gradient-to-br from-[#7a9b8e]/10 to-[#7a9b8e]/5 py-16"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-[#1a3a52] md:text-4xl">
            Become a BetterLife Agent
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700">
            Earn extra income by connecting your community with flexible financing solutions.
          </p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.article
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-xl bg-white p-6 text-center shadow-md transition-all duration-300 hover:shadow-xl"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7a9b8e]">
                  <Icon className="text-white" size={26} />
                </div>
                <h3 className="text-xl font-semibold text-[#1a3a52]">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{benefit.description}</p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl"
        >
          {!showForm ? (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#1a3a52]">
                Ready to grow with BetterLife?
              </h3>
              <p className="mt-3 text-gray-600">
                Join thousands of agents empowering small businesses and households nationwide.
              </p>

              {/* <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1a3a52] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2a4a62]"
              >
                Apply to Become an Agent
              </button> */}
               <button
                type="button"
            
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1a3a52] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2a4a62]"
              >
                Apply to Become an Agent
              </button>

              {feedback?.type === "success" && (
                <p className="mt-4 text-sm font-medium text-emerald-600">{feedback.message}</p>
              )}
              {feedback?.type === "error" && (
                <p className="mt-4 text-sm font-medium text-rose-600">{feedback.message}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#1a3a52]">Agent Application</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in your details and we will reach out within 48 hours.
                </p>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${errors.fullName ? "border-rose-500" : ""}`}
                  placeholder="Adaobi Emmanuel"
                />
                {errors.fullName ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputBaseClass} ${errors.email ? "border-rose-500" : ""}`}
                    placeholder="agent@betterlife.com"
                  />
                  {errors.email ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${inputBaseClass} ${errors.phone ? "border-rose-500" : ""}`}
                    placeholder="08012345678"
                  />
                  {errors.phone ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="preferredLocation" className="block text-sm font-medium text-slate-700">
                    Preferred Location
                  </label>
                  <input
                    id="preferredLocation"
                    name="preferredLocation"
                    value={formData.preferredLocation}
                    onChange={handleChange}
                    className={`${inputBaseClass} ${errors.preferredLocation ? "border-rose-500" : ""}`}
                    placeholder="Ikeja, Lagos"
                  />
                  {errors.preferredLocation ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.preferredLocation}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-slate-700">
                    Availability
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className={`${inputBaseClass} appearance-none`}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Weekends">Weekends Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-slate-700">
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className={`${inputBaseClass} appearance-none`}
                >
                  <option value="None">No Experience</option>
                  <option value="Beginner">0 - 1 year</option>
                  <option value="Intermediate">2 - 3 years</option>
                  <option value="Expert">4+ years</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[#1a3a52] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a4a62] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>

              {feedback?.type === "error" && (
                <p className="text-center text-sm font-medium text-rose-600">{feedback.message}</p>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default BecomeAnAgent;
