
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import happyImg from './assets/happy.png';
import sadImg from './assets/sad.png';
import angryImg from './assets/angry.png';
import neutralImg from './assets/neutral.png';
import surpriseImg from './assets/surprise.png';
import { API_BASE_URL } from "./config";
import wavesgif from "./assets/waves2.gif";
import AnimatedButton from './components/AnimatedButton';
import { trackMood } from "./trackMood";

const EmotionDetection = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [playbackURL, setPlaybackURL] = useState(null);

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
  if (result?.emotion) {
    trackMood(result.emotion);
  }
}, [result]);

  const normalizeEmotion = (emotion) => {
    if (!emotion) return "unknown";
    const lower = emotion.trim().toLowerCase();
    if (lower === "surprise") return "surprised";
    return lower;
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Reset old state
    setResult(null);
    setShowButton(false);
    setIsApproved(false);

    const url = URL.createObjectURL(file);
    setPlaybackURL(url);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      videoRef.current.controls = true;
      videoRef.current.autoplay = true;
    }
    analyzeVideo(file);
  }
};


  const analyzeVideo = async (videoBlob) => {
    setLoading(true);
    setResult(null);
    setShowButton(false);
    setIsApproved(false);

    const formData = new FormData();
    formData.append('video', new File([videoBlob], 'recorded.webm', { type: 'video/webm' }));

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResult({
          emotion: normalizeEmotion(data.emotion),
          confidence: data.confidence,
          songs: data.songs || []
        });
        setShowButton(true);
      } else {
        setResult({ error: data.error || "Unknown server error" });
      }
    } catch (err) {
      setResult({ error: 'Failed to connect to backend.' });
    }

    setLoading(false);
  };

  const startRecording = async () => {
  // Reset old state
  setResult(null);
  setShowButton(false);
  setIsApproved(false);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    if (videoRef.current) {
      videoRef.current.srcObject = stream; // Live preview
      videoRef.current.controls = false;
      videoRef.current.muted = true;
      videoRef.current.play();
    }

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPlaybackURL(url);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
        videoRef.current.autoplay = true;
        videoRef.current.play();
      }

      analyzeVideo(blob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);

    setTimeout(() => {
      if (mediaRecorder.state === "recording") mediaRecorder.stop();
      setIsRecording(false);
    }, 10000);
  } catch (error) {
    console.error("Error accessing media devices.", error);
    setResult({ error: "Could not access camera/microphone. Please check permissions." });
  }
};

  const handleSuggestions = () => {
    if (!result?.emotion) return;
    navigate('/songlist', {
      state: {
        emotion: result.emotion.toLowerCase(),
        songs: result.songs || []
      }
    });
  };

  const handleUploadClick = () => fileInputRef.current.click();

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] px-6 py-16 flex items-center justify-center text-white font-sans overflow-hidden">
      {/* Animated background */}
      <img
        src={wavesgif}
        alt="Background waves"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
      />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 opacity-30 blur-3xl animate-pulse z-0"></div>

      {/* Card */}
      <div className="mt-16 w-full max-w-2xl text-center z-10 rounded-3xl p-8 bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-lg shadow-lg ">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 drop-shadow-lg">
          Emotion Detection
        </h1>
        <p className="text-sm text-gray-300 mb-8">Upload or record a video to detect your emotion</p>

        <div className="flex justify-center gap-4 flex-wrap mb-2">
          <AnimatedButton onClick={handleUploadClick} disabled={isRecording || loading}>Upload Video</AnimatedButton>
          <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <AnimatedButton onClick={startRecording} disabled={isRecording || loading}>
            {isRecording ? 'Recording...' : 'Record Live (10s)'}
          </AnimatedButton>
        </div>

        <div className="text-center space-y-2 min-h-[24px]">
          {loading && <p className="text-purple-300 animate-pulse">Analyzing video...</p>}
          {result?.error && <p className="text-red-400 font-medium">Error: {result.error}</p>}
        </div>

        <div className="relative w-full rounded-xl mb-2 border-white shadow-lg bg-gray-900 flex items-center justify-center overflow-hidden max-h-72 min-h-[180px]">
  {(!playbackURL && !isRecording) && (
    <div className="flex flex-col items-center justify-center text-4xl animate-bounce text-white/50">
      🎬
      
    </div>
  )}
  <video
    ref={videoRef}
    autoPlay
    muted={!isApproved}  // Mute live preview
    controls={isApproved} // Show controls only after approval
    className={`w-full h-full object-cover ${(!playbackURL && !isRecording) ? "hidden" : "block"}`}
  />
</div>

{/* Submit button for playback */}
{!isApproved && playbackURL && result?.emotion && !loading && (
  <AnimatedButton onClick={() => setIsApproved(true)}>Submit</AnimatedButton>
)}


       
{isApproved && result?.emotion && (
  <div className="text-center space-y-4 mt-6">
    <div className="flex justify-center mb-4">
      <div className="relative w-48 h-48 object-cover flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full blur-md opacity-60 z-0 ${
          result.emotion === 'happy'
            ? 'bg-gradient-to-br from-yellow-400 via-yellow-100 to-yellow-500'
            : result.emotion === 'sad'
            ? 'bg-gradient-to-br from-blue-300 via-blue-100 to-blue-400'
            : result.emotion === 'angry'
            ? 'bg-gradient-to-br from-red-300 via-red-100 to-red-400'
            : result.emotion === 'neutral'
            ? 'bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400'
            : result.emotion === 'surprised'
            ? 'bg-gradient-to-br from-purple-300 via-purple-100 to-purple-400'
            : ''
        }`}></div>
        <img
          src={
            result.emotion === 'happy' ? happyImg
            : result.emotion === 'sad' ? sadImg
            : result.emotion === 'angry' ? angryImg
            : result.emotion === 'neutral' ? neutralImg
            : result.emotion === 'surprised' ? surpriseImg
            : null
          }
          alt={result.emotion}
          className="relative z-10 w-full h-full object-contain shadow-md"
        />
      </div>
    </div>
    <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-pink-400 to-blue-800 text-xl font-semibold capitalize animate-fadeIn drop-shadow-md">
      {"You Seem " + result.emotion}
    </p>
    <p className="text-sm text-gray-300">Confidence: {result.confidence.toFixed(1)}%</p>
    {showButton && <AnimatedButton onClick={handleSuggestions}>Song Suggestions</AnimatedButton>}
  </div>
)}

           
      </div>
    </div>
  );
};

export default EmotionDetection;
