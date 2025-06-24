import React, { useState } from 'react';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { LandingPage } from './components/LandingPage';
import { AnalysisSection } from './components/AnalysisSection';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();
  const [showApp, setShowApp] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showApp) {
      return <AuthForm />;
    }
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Media Analysis Center
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Upload images, videos, or audio to detect AI-generated deepfake content using advanced machine learning models.
          </p>
        </div>
        <AnalysisSection />
      </main>
    </div>
  );
}

export default App;