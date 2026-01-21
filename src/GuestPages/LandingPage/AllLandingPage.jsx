import Landing from "./Landing";
import About from "./About";
import HowItWorks from "./HowItWorks";
import Products from "./Product";
import BecomeAnAgent from "./BecomeAnAgent";
import ContactSection from "./Contact";
import CallToAction from "./CallToAction";
import Footer from "./Footer";

export default function AllLandingPage() {
  return (
    <div className="space-y-20">
      <Landing />
      <About />
      <HowItWorks />
      <Products />
      <BecomeAnAgent />
      <ContactSection />
      <div className="space-y-0">
        <CallToAction />
        <Footer />
      </div>
    </div>
  );
}
