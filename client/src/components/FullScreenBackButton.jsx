//FullScreenBackButton.jsx 

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FullScreenBackButton = () => {
  const [visible, setVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const location = useLocation();
  const navigate = useNavigate();

  // Track window resize for desktop/mobile
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show button only when hovering top-left corner (desktop only)
  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e) => {
      if (e.clientY < 80 && e.clientX < 120) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDesktop]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // Hide on landing page or mobile
  if (location.pathname === "/" || !isDesktop) return null;

  return (
    <button
      onClick={handleGoBack}
      className={`fixed top-6 left-6 z-50 p-2 rounded-lg border border-indigo-400
                  bg-transparent shadow-md transition-opacity duration-300
                  ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <ArrowLeft size={20} className="text-indigo-400" />
    </button>
  );
};

export default FullScreenBackButton;