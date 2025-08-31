//FullscreenToggle.jsx


import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const FullscreenToggle = () => {
  const [visible, setVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) return;

    const handleMouseMove = (e) => {
      if (e.clientY < 80 && e.clientX > window.innerWidth - 120) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  if (window.innerWidth <= 768) return null;

  return (
    <button
      onClick={toggleFullscreen}
      className={`fixed top-6 right-6 z-50 p-2 rounded-lg border border-indigo-400
                  bg-transparent shadow-md transition-opacity duration-300
                  ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {isFullscreen ? (
        <Minimize2 size={20} className="text-indigo-400" />
      ) : (
        <Maximize2 size={20} className="text-indigo-400" />
      )}
    </button>
  );
};

export default FullscreenToggle;