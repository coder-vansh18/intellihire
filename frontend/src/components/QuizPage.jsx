import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useRoute } from "wouter";
import { API_URL } from "../config";
import useProctoring from "../hooks/useProctoring";
import { FaBookmark, FaRegBookmark, FaCheck, FaTimes, FaQuestion, FaClock, FaShieldAlt } from "react-icons/fa";

const QuizPage = () => {
  const [, params] = useRoute("/quiz/:id");
  const testId = params?.id;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [disqualified, setDisqualified] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Track visited question when current changes
  useEffect(() => {
    setVisited((prev) => ({ ...prev, [current]: true }));
  }, [current]);

  const calculateLocalScore = useCallback(() => {
    let score = 0;
    questions.forEach((q, i) => {
      const ansIdx = answersRef.current[i];
      if (ansIdx !== undefined && q.correct !== undefined) {
        if (Number(ansIdx) === Number(q.correct)) {
          score++;
        }
      }
    });
    return score;
  }, [questions]);

  // Submit Quiz Callback
  const submitQuiz = useCallback(async (proctorData = {}) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    const finalTabSwitches = proctorData.tab_switches !== undefined ? proctorData.tab_switches : 0;

    try {
      const res = await fetch(`${API_URL}/api/tests/${testId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          userName: user.name,
          testId: testId,
          answers: answersRef.current,
          tab_switches: finalTabSwitches,
          tab_switch_count: finalTabSwitches,
          fullscreen_exit_count: proctorData.fullscreen_exit_count || 0,
          paste_count: proctorData.paste_count || 0,
          disqualified: proctorData.disqualified || false,
        }),
      });

      const data = await res.json();
      if (data.score !== undefined) {
        setFinalScore(data.score);
      } else {
        setFinalScore(calculateLocalScore());
      }
      setDisqualified(!!data.disqualified || !!proctorData.disqualified);
    } catch (err) {
      console.error("Submit error", err);
      setFinalScore(calculateLocalScore());
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowResult(true);
  }, [testId, calculateLocalScore]);

  // Custom Proctoring Hook with 3-Warning Limit
  const {
    tabSwitches,
    warningCount,
    showWarningModal,
    warningMessage,
    dismissWarningModal,
    enterFullscreen
  } = useProctoring(submitQuiz, { maxWarnings: 3, enabled: !showResult });

  // 1. FETCH / START TEST SESSION
  useEffect(() => {
    const initQuizSession = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${API_URL}/api/tests/${testId}/start`,
          {},
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        setQuestions(res.data.questions || []);
        setTimeLeft(res.data.remaining_seconds || (res.data.duration_minutes || 30) * 60);
        if (res.data.answers) {
          setAnswers(res.data.answers);
        }

        enterFullscreen();
      } catch (err) {
        console.error("Failed starting quiz session, falling back to basic fetch", err);
        try {
          const res = await axios.get(`${API_URL}/api/tests/${testId}`);
          setQuestions(res.data.questions || []);
          setTimeLeft((res.data.questions || []).length * 60);
        } catch (error) {
          console.error("Error fetching test details", error);
        }
      }
    };

    if (testId) {
      initQuizSession();
    }
  }, [testId]);

  // 2. BACKGROUND AUTOSAVE HEARTBEAT
  const saveProgressToBackend = useCallback(async () => {
    if (!testId || showResult) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/tests/${testId}/progress`,
        {
          answers: answersRef.current,
          tab_switch_count: tabSwitches,
          tab_switches: tabSwitches,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (err) {
      console.warn("Autosave heartbeat failed", err);
    }
  }, [testId, showResult, tabSwitches]);

  useEffect(() => {
    const interval = setInterval(saveProgressToBackend, 10000);
    return () => clearInterval(interval);
  }, [saveProgressToBackend]);

  // 3. TIMER
  useEffect(() => {
    if (timeLeft <= 0 && questions.length && !showResult) {
      submitQuiz({ tab_switches: tabSwitches });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions, showResult, submitQuiz, tabSwitches]);

  // Answer handler
  const handleAnswer = (index) => {
    const q = questions[current];
    const qId = q?.id;
    const selectedOptionText = q?.options?.[index];

    setAnswers((prev) => ({
      ...prev,
      [current]: index,
      ...(qId
        ? {
            [qId]: index,
            [`${qId}_text`]: selectedOptionText,
            [`${current}_text`]: selectedOptionText
          }
        : {})
    }));
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (current > 0) {
      setCurrent((prev) => prev - 1);
    }
  };

  // Toggle Mark for Review
  const toggleMarkReview = () => {
    setMarked((prev) => ({
      ...prev,
      [current]: !prev[current]
    }));
  };

  // Compute live question category counts
  const statusCounts = useMemo(() => {
    let answered = 0;
    let markedCount = 0;
    let unanswered = 0;
    let notAttempted = 0;

    questions.forEach((_, i) => {
      const isAnswered = answers[i] !== undefined;
      const isMarked = !!marked[i];
      const isVisited = !!visited[i];

      if (isMarked) {
        markedCount++;
      } else if (isAnswered) {
        answered++;
      } else if (isVisited) {
        unanswered++;
      } else {
        notAttempted++;
      }
    });

    return {
      answered,
      unanswered,
      marked: markedCount,
      notAttempted,
      total: questions.length
    };
  }, [questions, answers, marked, visited]);

  if (!questions.length) return <p className="p-10 text-white font-semibold">Loading assessment...</p>;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-primary to-secondary p-4 md:p-6 gap-6 select-none font-inter">
      
      {/* Strict Proctor Warning Modal */}
      {showWarningModal && !showResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md shadow-2xl border border-red-500">
            <h3 className="text-2xl font-bold mb-4 text-red-400">Proctoring Violation Warning</h3>
            <p className="mb-6 text-gray-200 leading-relaxed">
              {warningMessage}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={enterFullscreen}
                className="bg-primary hover:bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition text-sm"
              >
                Re-enter Fullscreen
              </button>
              <button
                onClick={dismissWarningModal}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow transition text-sm"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 LEFT SIDE: QUESTION AREA */}
      <div className="lg:w-3/4 bg-white p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col justify-between">
        {!showResult ? (
          <>
            <div>
              {/* Question Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg">
                    Question {current + 1} of {questions.length}
                  </span>
                  {marked[current] && (
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <FaBookmark className="text-[10px]" /> Marked for Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    warningCount >= 2 ? "bg-red-100 text-red-800 animate-pulse" : warningCount === 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    Tab Warnings: {warningCount}/3
                  </span>

                  <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-xl text-sm flex items-center gap-1.5 border border-red-100">
                    <FaClock className="text-red-500" />
                    {Math.floor(Math.max(0, timeLeft) / 60)}:
                    {String(Math.max(0, timeLeft) % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="mb-6 font-semibold text-lg md:text-xl text-gray-900 leading-relaxed">
                {questions[current].question}
              </h3>

              {/* Options List */}
              <div className="space-y-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`block w-full text-left p-4 rounded-xl border-2 transition duration-200 text-gray-800 font-medium ${
                      answers[current] === i
                        ? "bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-sm ring-2 ring-indigo-200"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        answers[current] === i ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 pt-4 border-t space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={prevQuestion}
                  disabled={current === 0}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                    current === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  ← Previous
                </button>

                {/* Mark for Review Toggle Button */}
                <button
                  onClick={toggleMarkReview}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm ${
                    marked[current]
                      ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {marked[current] ? (
                    <>
                      <FaBookmark /> Marked for Review (Unmark)
                    </>
                  ) : (
                    <>
                      <FaRegBookmark /> Mark for Review
                    </>
                  )}
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={current === questions.length - 1}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition ${
                    current === questions.length - 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  }`}
                >
                  Save & Next →
                </button>
              </div>

              {/* Final Submit Button */}
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to submit your assessment?")) {
                    submitQuiz({ tab_switches: tabSwitches });
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition text-base"
              >
                Submit Assessment
              </button>
            </div>
          </>
        ) : (
          /* Result Summary Screen */
          <div className="text-center py-12 space-y-6">
            {disqualified ? (
              <div className="bg-red-50 p-6 rounded-2xl mb-6 inline-block border border-red-200">
                <h2 className="text-3xl font-bold text-red-600 mb-2">Assessment Disqualified ❌</h2>
                <p className="text-gray-700 font-medium">Multiple tab-switching violations (3/3) were recorded during this session.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Assessment Completed</p>
                <h2 className="text-5xl font-black text-gray-900">
                  Score: {finalScore} / {questions.length}
                </h2>
                <p className="text-gray-500 text-sm">
                  Accuracy: {questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0}%
                </p>
              </div>
            )}

            <div>
              <Link to="/quizzes">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition">
                  Back to Tests
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 RIGHT SIDE: PALETTE & LIVE STATUS COUNTERS */}
      <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b text-base">Questions Overview</h3>

          {/* 4-Box Category Status Counters */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-800">Answered</p>
                <p className="text-lg font-black text-emerald-700">{statusCounts.answered}</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-800">Unanswered</p>
                <p className="text-lg font-black text-rose-700">{statusCounts.unanswered}</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500"></span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-800">Mark Review</p>
                <p className="text-lg font-black text-amber-700">{statusCounts.marked}</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
            </div>

            <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-700">Not Visited</p>
                <p className="text-lg font-black text-slate-800">{statusCounts.notAttempted}</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-slate-300"></span>
            </div>
          </div>

          {/* Interactive Question Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1 pb-2">
            {questions.map((_, i) => {
              const isCurrent = current === i;
              const isAnswered = answers[i] !== undefined;
              const isMarked = !!marked[i];
              const isVisited = !!visited[i];

              let buttonColor = "bg-slate-100 text-slate-600 hover:bg-slate-200"; // Default: Not Visited

              if (isMarked) {
                buttonColor = "bg-amber-400 text-amber-950 font-bold border border-amber-500";
              } else if (isAnswered) {
                buttonColor = "bg-emerald-500 text-white font-bold";
              } else if (isVisited) {
                buttonColor = "bg-rose-500 text-white font-bold";
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`p-2.5 rounded-xl font-bold text-xs transition duration-150 relative ${buttonColor} ${
                    isCurrent ? "ring-4 ring-indigo-500 scale-105 shadow-md z-10" : ""
                  }`}
                >
                  {i + 1}
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full border border-white"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend Guide */}
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span>Mark for Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 inline-block border"></span>
              <span>Not Attempted</span>
            </div>
          </div>
        </div>

        {/* Proctoring Status Pill */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <FaShieldAlt className="text-indigo-600" /> Proctor Engine
          </span>
          <span className={`font-bold ${tabSwitches >= 2 ? "text-red-600" : "text-gray-700"}`}>
            {tabSwitches}/3 Violations
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;