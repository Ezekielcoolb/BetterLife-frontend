const WHATSAPP_NUMBER = "+17736643144";
const APPLY_MESSAGE = "Hello, I will like to apply for a loan";
const AGENT_MESSAGE = "Hello, I will like to become an agent";

const buildWhatsAppLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export default function Landing() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-slate-900 py-24 text-white md:min-h-[90vh] mt-14"
      style={{
        backgroundImage: "url('/images/landing.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-slate-900/45" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Financial Freedom for Every Nigerian
        </h1>
        <p className="text-lg font-medium text-slate-100 sm:text-xl">
          Quick loans for small businesses, salary earners, and entrepreneurs.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={buildWhatsAppLink(APPLY_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#1a3a52] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#174061]"
          >
            Apply Now
          </a>
          <a
            href={buildWhatsAppLink(AGENT_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#7a9b8e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6a8c7f]"
          >
            Become an Agent
          </a>
        </div>
      </div>
    </section>
  );
}
