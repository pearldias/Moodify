import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import GlowCard from "./components/GlowCard"; // Import the new card component
import Footer from "./components/Footer";
import AnimatedButton from "./components/AnimatedButton";
import { useNavigate } from "react-router-dom";


const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const steps = [
  {
    step: "01",
    title: "Record Your Emotions",
    description: "Choose between live video, uploaded clips, or a quick questionnaire",
  },
  {
    step: "02", 
    title: "Analyze Your Emotions",
    description: "Our algorithm will decode your mood with clarity and care.",
  },
  {
    step: "03",
    title: "Get Tailored Music", 
    description: "We'll instantly generate a personalized playlist that fits your detected mood.",
  },
  {
    step: "04",
    title: "Relax & Enjoy",
    description: "Sit back and enjoy the perfect music curated just for your current emotional state.",
  },
];

export default function HowItWorks() {
  
  const cardsRef = useRef(null);
  const isInView = useInView(cardsRef, { once: true, margin: "-100px" });
  const navigate = useNavigate();
  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] px-4 py-32 text-center relative overflow-hidden font-[Inter]">
      
      {/* Bubble background */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 opacity-40 blur-3xl animate-pulse z-0"></div>

      {/* Heading */}
      <div className="relative z-10 max-w-3xl mb-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-8 mx-auto text-center overflow-hidden">
          <span className="typing-effect bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            How It Works
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-snug text-center">
          <span className="block">Discover the magic behind Moodify in four beautifully simple steps</span>
        </p>
        
        <AnimatedButton className="bg-[#A855F7] text-white font-semibold px-8 py-3 rounded-full shadow-md hover:shadow-xl hover:bg-[#9333EA] transition duration-300"
        onClick={() => navigate("/choose")}>
          Try it now
        </AnimatedButton>
      </div>

      {/* Cards Grid */}
      <motion.div 
        ref={cardsRef}
        variants={staggerChildren}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10 max-w-7xl w-full px-4"
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            className="flex justify-center"
          >
            <GlowCard
              stepNumber={step.step}
              title={step.title}
              description={step.description}
            />
          </motion.div>
        ))}
      </motion.div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-20px) }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 12ch }
        }
        
        @keyframes blink {
          50% { border-color: transparent }
        }
        
        .typing-effect {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #C084FC;
          animation: typing 1s steps(10, end) forwards, blink 1s step-end infinite;
        }
      `}</style>

      {/* Footer */}
    </section>
  );
}