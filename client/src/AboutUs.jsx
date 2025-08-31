import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import moodifyLogo from "./assets/Moodify_logo3i.png";
import Footer from "./components/Footer";
import AnimatedButton from "./components/AnimatedButton";
import TeamCard from "./components/TeamCard";
import { useNavigate } from "react-router-dom";

const team = [
  {
    name: "Pearl",
    initials: "P",
    role: "Emotion Detection & Frontend",
    desc: "Built the emotion detection model.",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    socials: [{type: 'linkedin', href: '#'}, {type: 'github', href: '#'}]
  },
  {
    name: "Sanket",
    initials: "S",
    role: "Questionnaire Developer",
    desc: "Designed the emotion questionnaire.",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    socials: [{type: 'linkedin', href: '#'}, {type: 'github', href: '#'}]
  },
  {
    name: "Deepak",
    initials: "D",
    role: "Frontend & Responsiveness",
    desc: "Ensured beautiful UI across all devices.",
    gradient: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    socials: [{type: 'linkedin', href: '#'}, {type: 'github', href: '#'}]
  },
  {
    name: "Soniya",
    initials: "S",
    role: "Music Playback Backend",
    desc: "Engineered the backend to serve music.",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    socials: [{type: 'linkedin', href: '#'}, {type: 'github', href: '#'}]
  },
  {
    name: "Vancy",
    initials: "V",
    role: "Music Frontend",
    desc: "Developed the music discovery interface.",
    gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    socials: [{type: 'linkedin', href: '#'}, {type: 'github', href: '#'}]
  },
];

const Bubble = ({ className }) => <div className={`absolute rounded-full blur-3xl animate-pulse ${className}`} />;

// Maps prop 
const Hero = ({ navigate }) => (
    <div className="relative z-10 max-w-4xl mx-auto text-center mb-12 mt-8">
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-10">
        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          <TypeAnimation sequence={["About Moodify", 1000]} speed={20} wrapper="span" repeat={0} />
        </span>
      </h1>
      <p className="text-lg sm:text-xl text-gray-300 mb-10">
        We’re a team of dreamers, technologists, and music lovers dedicated to making every beat match your emotions.
      </p>
      <div className="flex justify-center">
          <AnimatedButton onClick={() => navigate("/Choose")}>
              Experience Moodify
          </AnimatedButton>
      </div>
    </div>
  );

  const Journey = () => (
    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-6xl mx-auto mb-24">
      <div className="rounded-3xl bg-slate-900/20 backdrop-blur-lg border border-slate-100/10 p-10 md:p-16 relative overflow-hidden">
        <Bubble className="top-10 left-10 w-24 h-24 bg-purple-400/20" />
        <Bubble className="bottom-10 right-10 w-32 h-32 bg-pink-400/25" />
        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-lg text-gray-300">
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Our Journey</h2>
            <p>Moodify began with a simple belief — that music should understand you. What started as a late-night experiment soon evolved into a passion: crafting soundtracks that mirror the rhythm of your heart and mind.</p>
            <p>Today, Moodify blends emotion detection AI with the magic of music to turn feelings into melodies — because your emotions deserve more than silence.</p>
            <AnimatedButton onClick={() => console.log("Journey Clicked!")}>
              Join Our Journey
            </AnimatedButton>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-white/5 p-8 rounded-2xl shadow-lg backdrop-blur-lg text-center">
            <img src={moodifyLogo} alt="Moodify Logo" className="mx-auto w-32 h-32 object-contain mb-6 rounded-full" />
            <p className="italic text-gray-200">“Music isn’t just something we hear, it’s something we feel — and at Moodify, we make sure it feels right.”</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

const Team = () => (
    <div className="max-w-fit mx-auto mb-8 text-center">
        <h2 className="text-4xl  md:text-5xl font-bold pb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Meet Our Team
        </h2>
        <motion.div
            initial="hidden"
            whileInView="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="flex flex-wrap justify-center gap-8"
        >
            {team.map((member) => (
                <motion.div
                    key={member.name}
                    variants={{
                        hidden: { opacity: 0, y: 40 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.6 }}
                >
                    <TeamCard 
                      name={member.name}
                      role={member.role}
                      desc={member.desc}
                      initials={member.initials}
                      socials={member.socials}
                      gradient={member.gradient}
                    />
                </motion.div>
            ))}
        </motion.div>
    </div>
);


export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] text-white font-[Inter]">
      <main className="flex-grow px-4 py-24 relative overflow-hidden">
        <Bubble className="top-20 left-10 w-32 h-32 bg-purple-400/10" />
        <Bubble className="bottom-32 right-16 w-40 h-40 bg-pink-400/15" />
        <Bubble className="top-1/2 left-1/2 w-96 h-96 bg-purple-300/10 -translate-x-1/2 -translate-y-1/2" />
        <Hero navigate={navigate} />
        <Journey />
        <Team />
      </main>
    </div>
  );
}