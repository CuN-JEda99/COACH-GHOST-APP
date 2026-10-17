import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import IaRecommender from './components/IaRecommender';
import ContactForm from './components/ContactForm';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlan, setSelectedPlan] = useState('Plan Jugador');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = '#admin';
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    window.location.hash = '#inicio';
    setCurrentView('home');
  };

  const handleSelectPlan = (planName) => {
    setSelectedPlan(planName);
    const contactElem = document.getElementById('contacto');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
      <Navbar
        isAdminView={currentView === 'admin'}
        onNavigateAdmin={navigateToAdmin}
        onNavigateHome={navigateToHome}
      />

      <main style={{ flexGrow: 1 }}>
        {currentView === 'admin' ? (
          <AdminPanel onClose={navigateToHome} />
        ) : (
          <>
            <Hero
              onStartIA={() => {
                const el = document.getElementById('ia-recomendar');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExplorePlans={() => {
                const el = document.getElementById('catalogo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <HowItWorks />
            <Pricing onSelectPlan={handleSelectPlan} />
            <IaRecommender />
            <ContactForm selectedPlan={selectedPlan} />
          </>
        )}
      </main>

      <Footer onNavigateAdmin={navigateToAdmin} />
    </div>
  );
}
