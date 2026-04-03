import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import GymSection from '../components/landing/GymSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <GymSection />
      <CTASection />
      <Footer />
    </div>
  );
}
