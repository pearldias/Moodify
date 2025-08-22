import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import AnimatedButton from "./components/AnimatedButton"; // --- 1. IMPORT ADDED ---

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

// --- DATA & CONFIGURATION ---

const moodIcons = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
  shocked: "😲",
};

// --- REUSABLE UI COMPONENTS ---

// Animated background bubble component
const Bubble = ({ className }) => (
  <div className={`absolute rounded-full filter blur-3xl animate-pulse ${className}`} />
);

// Glassmorphism card component for consistent styling
const Card = ({ children, className }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ type: "spring", stiffness: 100, damping: 10 }}
    className={`p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

// --- PAGE SECTIONS ---

const Hero = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className="relative z-10 max-w-4xl mx-auto text-center mb-8 mt-16"
  >
    <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight">
      <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
        <TypeAnimation sequence={["Mood History", 1500, "Your Emotional Journey", 1500]} speed={30} wrapper="span" repeat={Infinity} />
      </span>
    </h1>
    <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
      Explore the patterns of your emotions. Here's a visualization of your last 10 recorded moods.
    </p>
  </motion.div>
);

const MoodCharts = ({ moodHistory }) => {
  if (!moodHistory.length) return null;

  // Process data for charts
  const moodCounts = moodHistory.reduce((acc, mood) => {
    acc[mood.emotion] = (acc[mood.emotion] || 0) + 1;
    return acc;
  }, {});

  const moodLabels = Object.keys(moodCounts);
  const moodData = Object.values(moodCounts);

  const trendLabels = moodHistory.map((m) =>
    new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const trendData = moodHistory.map((m) => m.emotion);

  const moodMap = { happy: 3, sad: 1, angry: 0, neutral: 2, excited: 4 };
  const trendValues = trendData.map((m) => moodMap[m.toLowerCase()] || 2);
  
  // Custom Chart.js plugin to render emojis on line chart points
  const pointEmojiPlugin = {
    id: "pointEmojiPlugin",
    afterDatasetsDraw: (chart) => {
      const { ctx, data } = chart;
      ctx.save();
      data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((point, index) => {
          const emoji = moodIcons[trendData[index].toLowerCase()] || "😐";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Hide original point
          chart.getDatasetMeta(i).data[index].options.radius = 0;
          ctx.fillText(emoji, point.x, point.y);
        });
      });
      ctx.restore();
    },
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.2 },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="max-w-5xl mx-auto mb-16"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <Card>
          <h3 className="text-xl font-bold mb-4 text-center text-gray-200">Mood Frequency</h3>
          <Bar
            data={{
              labels: moodLabels,
              datasets: [
                {
                  label: "Count",
                  data: moodData,
                  backgroundColor: 'rgba(139, 92, 246, 0.6)',
                  borderColor: 'rgba(167, 139, 250, 1)',
                  borderWidth: 2,
                  borderRadius: 8,
                  hoverBackgroundColor: 'rgba(139, 92, 246, 0.8)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#d1d5db', stepSize: 1 } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#d1d5db' } }
              }
            }}
          />
        </Card>

        {/* Line Chart */}
        <Card>
          <h3 className="text-xl font-bold mb-4 text-center text-gray-200">Mood Trend</h3>
          <Line
            plugins={[pointEmojiPlugin]}
            data={{
              labels: trendLabels,
              datasets: [
                {
                  label: "Mood over Time",
                  data: trendValues,
                  fill: true,
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  borderColor: "#818CF8",
                  tension: 0.4,
                  pointRadius: 10,
                  pointHoverRadius: 12,
                  pointBackgroundColor: 'transparent',
                  pointBorderColor: 'transparent'
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => {
                      const emoji = moodIcons[trendData[tooltipItem.dataIndex].toLowerCase()] || "😐";
                      return `${emoji} ${trendData[tooltipItem.dataIndex]}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: {
                    color: '#d1d5db',
                    stepSize: 1,
                    callback: (val) => {
                      const moodReverseMap = { 0: "Angry", 1: "Sad", 2: "Neutral", 3: "Happy", 4: "Excited" };
                      return moodReverseMap[val] || '';
                    },
                  },
                },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#d1d5db' } }
              },
            }}
          />
        </Card>
      </div>
    </motion.div>
  );
};

// Most Prevalent Mood Section
const MostPrevalentMood = ({ moodHistory }) => {
  if (!moodHistory.length) return null;

  // Helper to normalize mood names (for counting + display)
  const normalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Count moods (case-insensitive)
  const counts = moodHistory.reduce((acc, mood) => {
    const normalized = normalize(mood.emotion);
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});

  // Find most prevalent mood
  const mostPrevalent = Object.keys(counts).reduce((a, b) =>
    counts[a] > counts[b] ? a : b
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.2 }}
      className="max-w-2xl mx-auto text-center mb-8"
    >
      <Card className="!bg-white/10">
        <p className="text-xl sm:text-2xl mb-4 text-gray-300">
          Your most prevalent mood is
        </p>
        <p className="text-xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          {mostPrevalent}
        </p>
        <a href={`/songs/${mostPrevalent.toLowerCase()}`} className="inline-block mt-6">
          <AnimatedButton>
            Explore '{mostPrevalent}' Playlist
          </AnimatedButton>
        </a>
      </Card>
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function History() {
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    // In a real app, you might fetch this from an API
    // For now, we use localStorage
    const history = JSON.parse(localStorage.getItem("moodHistory")) || [];
    setMoodHistory(history.slice(-10)); // Get the last 10 entries
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] text-white font-sans overflow-x-hidden">
      <main className="flex-grow px-4 py-16 relative">
        {/* Background Bubbles */}
        <Bubble className="top-10 left-5 w-48 h-48 bg-purple-600/20" />
        <Bubble className="top-1/3 -right-16 w-64 h-64 bg-blue-500/20" />
        <Bubble className="bottom-20 -left-10 w-56 h-56 bg-indigo-600/25" />
        <Bubble className="bottom-48 right-1/4 w-32 h-32 bg-purple-400/15" />

        <Hero />
        
        {moodHistory.length > 0 ? (
          <>
            <MoodCharts moodHistory={moodHistory} />
            <MostPrevalentMood moodHistory={moodHistory} />
          </>
        ) : (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center text-gray-400 mt-16">
            <p className="text-2xl mb-2">No mood history found.</p>
            <p>Start tracking your mood to see your emotional journey!</p>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}