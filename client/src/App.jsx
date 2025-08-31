
import React ,{ useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import EmotionDetection from './EmotionDetection';
import EmotionQuestionnaire from './components/EmotionQuestionnaire';
import LandingPage from './LandingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Choose from './Choose';
import HowItWorks from './HowItWorks';
import AboutUs from './AboutUs';
import History from './History';
import SongsPage from './SongPage';
import SongList from './SongList';
import Signup from "./Signup";
import Signin from "./Signin";
import AccountChoice from "./AccountChoice";
import { Toaster } from "react-hot-toast";
import AccountTypeSelection from './AccountTypeSelection';
import SigninAdmin from './SigninAdmin';
import { initGuestSession } from "./historyLocal";
import FullscreenToggle from "./components/FullScreenToggle";
import FullScreenBackButton from "./components/FullScreenBackButton";
import MobileBackButton from "./components/MobileBackButton";



function AppContent() {
  const location = useLocation();

  const footerRoutes = ['/', '/how-it-works', '/about', '/songs','/account','/signin','/signup','/questionnaire', '/emotion-detection','/songlist', '/account-selection', '/signin-admin'];
  const showFooter = footerRoutes.includes(location.pathname);

  useEffect(() => {
    initGuestSession();
  }, []);

  return (
    <>
      <Navbar />
      
      <div className="">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/choose" element={<Choose />} />
          <Route path="/emotion-detection" element={<EmotionDetection />} />
          <Route path="/questionnaire" element={<EmotionQuestionnaire />} />       
          <Route path="/songlist" element={<SongList />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/history" element={<History />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/account" element={<AccountChoice />} />
          <Route path="/account-selection" element={<AccountTypeSelection />} />
          <Route path="/signin-admin" element={<SigninAdmin />} />
        </Routes>
      </div>
      
      <MobileBackButton />
      <FullScreenBackButton/>
      <FullscreenToggle />
      {showFooter && <Footer />}
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;