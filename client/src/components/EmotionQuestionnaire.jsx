import React, { useState, useMemo, useEffect } from 'react';
// The useNavigate import is no longer needed.
// import { useNavigate } from 'react-router-dom'; 
import wavesgif from "../assets/waves2.gif";
import { trackMood } from "../trackMood";
import nspell from "nspell";
import enDic from "../dictionaires/index.dic?raw";
import enAff from "../dictionaires/index.aff?raw";
import AnimatedButton from './AnimatedButton';

function EmotionQuestionnaire() {
  // We no longer need the navigate function.
  // const navigate = useNavigate();

  const questions = [
    "What was the highlight of your day?",
    "What's something that has been on your mind lately?",
    "How are you feeling physically right now?",
    "What are you looking forward to (or not looking forward to)?",
    "If you could describe your current mood in a few words, what would they be?",
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [typingIndex, setTypingIndex] = useState(null);

  const [spellChecker, setSpellChecker] = useState(null);
  const [hasSpellingErrors, setHasSpellingErrors] = useState(false);
  const [isSpellCheckerLoading, setIsSpellCheckerLoading] = useState(true);

  // --- MODIFICATION START ---
  // New state to hold the analysis result.
  const [analysisResult, setAnalysisResult] = useState(null);
  // --- MODIFICATION END ---

  const MIN_ANSWERS_REQUIRED = 3;

  const answeredQuestionsCount = useMemo(() => {
    return answers.filter(answer => answer.trim() !== '').length;
  }, [answers]);

  useEffect(() => {
    const loadSpellChecker = async () => {
      try {
        const spell = nspell({ aff: enAff, dic: enDic });
        setSpellChecker(spell);
      } catch (e) {
        console.error("Failed to load spell checker:", e);
      } finally {
        setIsSpellCheckerLoading(false);
      }
    };
    loadSpellChecker();
  }, []);

  useEffect(() => {
    if (!spellChecker || isSpellCheckerLoading || answers.every(a => a.trim() === '')) {
      setHasSpellingErrors(false);
      return;
    }

    const allText = answers.join(' ');
    const words = allText.match(/\b[a-zA-Z]{2,}\b/g) || [];
    
    let foundError = false;
    for (const word of words) {
      if (!spellChecker.correct(word)) {
        foundError = true;
        break;
      }
    }
    setHasSpellingErrors(foundError);
  }, [answers, spellChecker, isSpellCheckerLoading]);

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
    setTypingIndex(index);
    
    setTimeout(() => setTypingIndex(null), 300);
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handleSubmit = async () => {
    if (answeredQuestionsCount < MIN_ANSWERS_REQUIRED || hasSpellingErrors) return;

    const answeredResponses = answers.filter(ans => ans.trim() !== '');
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Analyzing your emotions with AI...');

    const apiUrl = 'http://127.0.0.1:5001/predict';
    const payload = { responses: answeredResponses };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.primary_emotion) {
        await trackMood(data.primary_emotion);
      }

      // --- MODIFICATION START ---
      // Instead of navigating, we set the result in state and stop loading.
      setAnalysisResult({
        emotion: data.primary_emotion,
        confidence: data.confidence
      });
      setIsLoading(false);
      // --- MODIFICATION END ---

    } catch (err) {
      console.error("Emotion analysis error:", err);
      setError(err.message || "Sorry, we couldn't analyze your emotions. Please try again.");
      setIsLoading(false);
    }
  };

  // --- MODIFICATION START ---
  // Update resetState to also clear the analysis result.
  const resetState = () => {
    setAnswers(Array(questions.length).fill(''));
    setError(null);
    setIsLoading(false);
    setFocusedIndex(null);
    setTypingIndex(null);
    setHasSpellingErrors(false);
    setAnalysisResult(null); // Clear the result to show the form again.
  };
  // --- MODIFICATION END ---

  const getTextareaClasses = (index) => {
    const baseClasses = "w-full p-2.5 bg-gradient-to-br from-white/8 to-white/4 rounded-lg text-gray-200 placeholder-gray-500 transition-all duration-500 ease-out transform border-0";
    if (focusedIndex === index) {
      return `${baseClasses} shadow-md shadow-blue-500/20 bg-gradient-to-br from-white/12 to-white/8 scale-[1.01] ring-1 ring-blue-400/30`;
    }
    if (answers[index].trim()) {
      return `${baseClasses} shadow-sm shadow-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-white/8`;
    }
    return `${baseClasses} hover:bg-gradient-to-br hover:from-white/10 hover:to-white/6`;
  };

  const getLabelClasses = (index) => {
    const baseClasses = "block mb-2 text-sm font-medium transition-all duration-300";
    if (focusedIndex === index) {
      return `${baseClasses} text-blue-300`;
    }
    if (answers[index].trim()) {
      return `${baseClasses} text-emerald-300`;
    }
    return `${baseClasses} text-gray-400 group-hover:text-gray-300`;
  };

  return (
    <div className="relative min-h-screen bg-[#0f0f1a] text-white pt-[120px] px-4 pb-8 flex justify-center items-start overflow-hidden">
      <img
        src={wavesgif}
        alt="Background waves"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
      />
      <div className="relative bg-[#1a1a2e] bg-opacity-60 backdrop-blur-md border border-purple-800/50 p-8 rounded-2xl shadow-2xl w-full max-w-4xl text-center">
        
        {/* --- MODIFICATION START: Updated rendering logic --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border border-blue-400 opacity-20"></div>
            </div>
            <h2 className="text-4xl font-semibold text-white animate-pulse mb-4">{loadingMessage}</h2>
            <p className="text-gray-400 animate-fadeIn text-lg">Harnessing AI to understand your unique emotional state.</p>
          </div>
        ) : error ? (
          <div className="text-red-500 flex flex-col items-center justify-center h-96 text-center">
            <div className="text-6xl mb-6 animate-bounce">😔</div>
            <h2 className="text-3xl font-bold mb-6 animate-fadeIn">Analysis Failed</h2>
            <p className="text-xl text-red-400 mb-10 max-w-lg animate-fadeIn" style={{animationDelay: '0.2s'}}>{error}</p>
            <button
              onClick={resetState}
              className="group py-4 px-10 rounded-2xl border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all duration-300 transform hover:scale-105 relative overflow-hidden text-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try Again <span className="group-hover:rotate-180 transition-transform duration-300">🔄</span>
              </span>
            </button>
          </div>
        ) : analysisResult ? (
          // This is the new block to display the result
          <div className="flex flex-col items-center justify-center h-96 text-center animate-fadeIn">
            <h2 className="text-2xl font-medium text-gray-300 mb-2">Analysis Complete</h2>
            <p className="text-gray-400 mb-4">The AI has identified your primary emotion as:</p>
            <h1 className="text-7xl font-bold capitalize bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 text-transparent bg-clip-text mb-4">
              {analysisResult.emotion}
            </h1>
            <div className="w-full max-w-md bg-white/5 p-4 rounded-lg mb-8">
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-gray-300 font-medium">Confidence Score</span>
                    <span className="text-blue-300 font-semibold">
                        {(analysisResult.confidence * 100).toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2.5">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" 
                        style={{ width: `${analysisResult.confidence * 100}%` }}
                    ></div>
                </div>
            </div>
            <AnimatedButton
              onClick={resetState}
            >
              <span className="relative z-10">Analyze Again</span>
            </AnimatedButton>
          </div>
        ) : (
          // This is the original questionnaire form
          <div className="relative z-10">
            <div className="mb-6">
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out transform origin-left shadow-lg relative"
                  style={{ width: `${(answeredQuestionsCount / questions.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-400">Progress</span>
                <span className={`font-medium transition-colors duration-300 ${
                  answeredQuestionsCount >= MIN_ANSWERS_REQUIRED ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {answeredQuestionsCount} / {questions.length}
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-br from-white to-gray-400 text-transparent bg-clip-text mb-2 animate-fadeIn">
              How Are You Feeling?
            </h1>
            <p className="text-gray-400 text-base mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
              Answer at least <strong className="text-blue-300">{MIN_ANSWERS_REQUIRED} questions</strong> for accurate analysis.
            </p>
            <div className="space-y-3 mb-5 text-left">
              {questions.map((q, idx) => (
                <div key={idx} className="group animate-slideUp" style={{animationDelay: `${0.1 * idx}s`}}>
                  <label htmlFor={`q-${idx}`} className={getLabelClasses(idx)}>
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        answers[idx].trim() ? 'bg-emerald-400' : 
                        focusedIndex === idx ? 'bg-blue-400' : 
                        'bg-gray-600'
                      }`}></span>
                      {q}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id={`q-${idx}`}
                      type="text"
                      value={answers[idx]}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      onFocus={() => handleFocus(idx)}
                      onBlur={handleBlur} 
                      className={getTextareaClasses(idx)}
                      placeholder={isSpellCheckerLoading ? "Loading dictionary..." : "Your response..."}
                      disabled={isLoading || isSpellCheckerLoading}
                    />
                    {typingIndex === idx && (
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                    {answers[idx].trim() && (
                      <div className="mt-1 text-xs text-emerald-400 animate-fadeIn flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{answers[idx].split(' ').filter(w => w).length} words</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={answeredQuestionsCount < MIN_ANSWERS_REQUIRED || isLoading || hasSpellingErrors}
              className={`group relative w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform overflow-hidden ${
                answeredQuestionsCount >= MIN_ANSWERS_REQUIRED && !hasSpellingErrors
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 hover:scale-105 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 ${
                answeredQuestionsCount >= MIN_ANSWERS_REQUIRED ? 'group-hover:animate-shimmer' : ''
              }`}></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                Analyze My Mood <span className="text-lg">🎵</span>
              </span>
            </button>
            {answeredQuestionsCount < MIN_ANSWERS_REQUIRED && (
              <p className="mt-3 text-sm text-yellow-400">
                Answer <strong>{MIN_ANSWERS_REQUIRED - answeredQuestionsCount}</strong> more to continue
              </p>
            )}
            {answeredQuestionsCount >= MIN_ANSWERS_REQUIRED && hasSpellingErrors && (
              <p className="mt-3 text-sm text-red-400">
                Please correct spelling mistakes before analyzing.
              </p>
            )}
          </div>
        )}
        {/* --- MODIFICATION END --- */}
      </div>
    </div>
  );
}

export default EmotionQuestionnaire;