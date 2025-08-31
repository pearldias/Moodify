//MobileBackButton.jsx 
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileButtonArrow from "../assets/MobileBackArrow.png"; 

const MobileBackButton = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleTouch = (e) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      if (touchX < 40 && touchY > 60 && touchY < 120) {
        setVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, 2500);
      }
    };

    if (isMobile) {
      window.addEventListener("touchstart", handleTouch);
    }

    return () => {
      window.removeEventListener("touchstart", handleTouch);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isMobile]);

  const handleGoBack = () => {
    setVisible(false); 
    navigate(-1);
  };

  if (location.pathname === "/" || !isMobile) return null;

  return (
    visible && (
      <button
        onClick={handleGoBack}
        className="fixed top-[84px] left-0 z-40 w-15 h-10 flex items-center justify-center 
                    bg-transparent rounded-lg active:scale-95 transition"
      >
        <img src={MobileButtonArrow} alt="Back" className="w-7 h-7" />
      </button>
    )
  );
};

export default MobileBackButton;