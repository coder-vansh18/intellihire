import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useRoute } from "wouter";
import { API_URL } from "../config";
import useProctoring from "../hooks/useProctoring";
import { 
  FaBookmark, FaRegBookmark, FaCheck, FaTimes, FaQuestion, 
  FaClock, FaShieldAlt, FaEye, FaArrowLeft, FaLaptop, FaFlag, FaExclamationTriangle 
} from "react-icons/fa";

const QuizPage = () => {
  const [, params] = useRoute("/quiz/:id");
  const testId = params?.id;

  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 🚩 QA Alert Modal States
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaIssueType, setQaIssueType] = useState("Spelling Mistake");
  const [qaMistakeText, setQaMistakeText] = useState("");
  const [sendingQa, setSendingQa] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load user
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored && stored !== "undefined") {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isProfessor = user?.role === "company" || user?.role === "professor";

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
      const ansIdx = answersRef.current[i] !== undefined ? answersRef.current[i] : answersRef.current[String(i)];
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
    const rawUser = JSON.parse(localStorage.getItem("user") || "{}");
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
          userId: rawUser._id || rawUser.id,
          userName: rawUser.name,
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

    // Exit Fullscreen cleanly upon submission
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      }
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
  } = useProctoring(submitQuiz, { 
    maxWarnings: 3, 
    enabled: !showResult 
  });

  // 1. FETCH / START TEST SESSION (Runs ONCE per testId)
  useEffect(() => {
    if (!testId || initialized) return;

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
        setInitialized(true);

        // Enter Fullscreen on Start
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen().catch(() => {});
        }
      } catch (err) {
        console.error("Failed starting quiz session, falling back to basic fetch", err);
        try {
          const res = await axios.get(`${API_URL}/api/tests/${testId}`);
          setQuestions(res.data.questions || []);
          setTimeLeft((res.data.questions || []).length * 60);
          setInitialized(true);
        } catch (error) {
          console.error("Error fetching test details", error);
        }
      }
    };

    initQuizSession();
  }, [testId, initialized]);

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
    if (showResult) return;
    const interval = setInterval(saveProgressToBackend, 10000);
    return () => clearInterval(interval);
  }, [saveProgressToBackend, showResult]);

  // 3. TIMER
  useEffect(() => {
    if (showResult || !questions.length) return;

    if (timeLeft <= 0 && questions.length) {
      submitQuiz({ tab_switches: tabSwitches });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions, showResult, submitQuiz, tabSwitches]);

  // Answer selection handler
  const handleAnswer = (index) => {
    const q = questions[current];
    const qId = q?.id;
    const selectedOptionText = q?.options?.[index];

    setAnswers((prev) => {
      const updated = { ...prev };
      updated[current] = index;
      updated[String(current)] = index;
      if (qId) {
        updated[qId] = index;
        updated[`${qId}_text`] = selectedOptionText;
      }
      return updated;
    });
  };

  const isOptionSelected = (index) => {
    const q = questions[current];
    const qId = q?.id;
    if (answers[current] !== undefined && Number(answers[current]) === index) return true;
    if (answers[String(current)] !== undefined && Number(answers[String(current)]) === index) return true;
    if (qId && answers[qId] !== undefined && Number(answers[qId]) === index) return true;
    return false;
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

  // 🚩 Send QA Alert to Creator (Non-blocking)
  const handleSendQaAlert = async () => {
    if (!qaMistakeText.trim()) {
      showToast("Please describe the mistake in the question.", "error");
      return;
    }

    setSendingQa(true);
    try {
      const token = localStorage.getItem("token");
      const q = questions[current];

      const res = await fetch(`${API_URL}/api/tests/${testId}/qa-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          question_id: q?.id || null,
          question_number: current + 1,
          question_text: q?.question || `Question ${current + 1}`,
          issue_type: qaIssueType,
          mistake_description: qaMistakeText.trim()
        })
      });

      if (res.ok) {
        setQaModalOpen(false);
        setQaMistakeText("");
        showToast("QA Alert sent to test creator! 🚀", "success");
      } else {
        const data = await res.json();
        showToast(data.detail || "Failed to send QA alert", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error sending QA alert. Please try again.", "error");
    } finally {
      setSendingQa(false);
    }
  };

  // Compute live question category counts
  const statusCounts = useMemo(() => {
    let answered = 0;
    let markedCount = 0;
    let unanswered = 0;
    let notAttempted = 0;

    questions.forEach((q, i) => {
      const qId = q?.id;
      const isAnswered = 
        (answers[i] !== undefined && typeof answers[i] === 'number') || 
        (answers[String(i)] !== undefined && typeof answers[String(i)] === 'number') ||
        (qId && answers[qId] !== undefined && typeof answers[qId] === 'number');
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

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-inter">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-lg">Initializing Proctored Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-primary to-secondary p-4 md:p-6 gap-6 select-none font-inter">
      
      {/* 🚀 Non-blocking Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0">
          <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold border backdrop-blur-md ${
            toastMessage.type === "error"
              ? "bg-rose-600/95 text-white border-rose-400/30"
              : "bg-emerald-600/95 text-white border-emerald-400/30"
          }`}>
            {toastMessage.type === "error" ? <FaTimes className="text-base" /> : <FaCheck className="text-base" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Strict Proctor Warning Modal */}
      {showWarningModal && !showResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md shadow-2xl border border-red-500">
            <h3 className="text-2xl font-bold mb-4 text-red-400">Proctoring Violation Warning</h3>
            <p className="mb-6 text-gray-200 leading-relaxed text-sm">
              {warningMessage}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={enterFullscreen}
                className="bg-primary hover:bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition text-sm cursor-pointer"
              >
                Re-enter Fullscreen
              </button>
              <button
                type="button"
                onClick={dismissWarningModal}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow transition text-sm cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚩 QA Mistake Alert Modal */}
      {qaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaFlag className="text-rose-500" /> Question QA Mistake Alert
              </h3>
              <button
                type="button"
                onClick={() => setQaModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700">
              <p className="font-bold text-indigo-900 mb-1">
                Question {current + 1}:
              </p>
              <p className="italic text-gray-800 line-clamp-3">
                "{questions[current]?.question}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mistake Type / Category
              </label>
              <select
                value={qaIssueType}
                onChange={(e) => setQaIssueType(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-rose-500 outline-none font-medium"
              >
                <option value="Spelling Mistake">Spelling / Typographical Mistake</option>
                <option value="Incorrect Options">Incorrect or Missing Options</option>
                <option value="Wrong Answer Marked">Wrong Answer Evaluation</option>
                <option value="Ambiguous Question">Ambiguous or Incomplete Question</option>
                <option value="Other Mistake">Other Mistake</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Describe the Mistake:
              </label>
              <textarea
                rows={3}
                value={qaMistakeText}
                onChange={(e) => setQaMistakeText(e.target.value)}
                placeholder="e.g. spelling mistake in option B, or equation missing subscript..."
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800"
              ></textarea>
              
              {qaMistakeText.trim() && (
                <div className="mt-2.5 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                  <p className="font-bold text-[11px] text-rose-800 uppercase tracking-wider mb-1">
                    Alert Message to Creator:
                  </p>
                  <p className="italic">
                    "The question contains <strong>{qaMistakeText.trim()}</strong> and needs to be assisted for evaluation"
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQaModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendQaAlert}
                disabled={sendingQa || !qaMistakeText.trim()}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {sendingQa ? "Sending Alert..." : "Send QA Alert 🚀"}
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
              {/* Professor Preview Banner */}
              {isProfessor && (
                <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                    <FaEye className="text-amber-600" />
                    <span>Professor Assessment Preview Mode</span>
                  </div>
                  <Link to="/my-tests">
                    <button type="button" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer">
                      <FaArrowLeft className="text-[10px]" /> Exit Preview
                    </button>
                  </Link>
                </div>
              )}

              {/* Question Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg">
                    Question {current + 1} of {questions.length}
                  </span>
                  
                  {/* 🚩 QA Alert Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setQaModalOpen(true);
                      setQaMistakeText("");
                      setQaIssueType("Spelling Mistake");
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Report question or spelling mistake to test creator"
                  >
                    <FaFlag className="text-rose-500 text-[10px]" />
                    <span>QA Alert</span>
                  </button>

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
                {questions[current].options.map((opt, i) => {
                  const selected = isOptionSelected(i);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between ${
                        selected
                          ? "bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-md ring-2 ring-indigo-200"
                          : "bg-white hover:bg-slate-50 border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          selected ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-700"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 font-medium text-sm leading-relaxed">{opt}</span>
                      </div>
                      {selected && (
                        <FaCheck className="text-indigo-600 text-sm shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 pt-4 border-t space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prevQuestion}
                  disabled={current === 0}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                    current === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                  }`}
                >
                  ← Previous
                </button>

                {/* Mark for Review Toggle Button */}
                <button
                  type="button"
                  onClick={toggleMarkReview}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm cursor-pointer ${
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
                  type="button"
                  onClick={nextQuestion}
                  disabled={current === questions.length - 1}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition ${
                    current === questions.length - 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
                  }`}
                >
                  Save & Next →
                </button>
              </div>

              {/* Final Submit Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to submit your assessment?")) {
                    submitQuiz({ tab_switches: tabSwitches });
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition text-base cursor-pointer"
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
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                  {isProfessor ? "Preview Completed" : "Assessment Completed"}
                </p>
                <h2 className="text-5xl font-black text-gray-900">
                  Score: {finalScore} / {questions.length}
                </h2>
                <p className="text-gray-500 text-sm">
                  Accuracy: {questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0}%
                </p>
              </div>
            )}

            {/* Role-Specific Redirection Action Buttons */}
            {isProfessor ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/company-dashboard">
                  <button type="button" className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold px-7 py-3 rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <FaLaptop /> Back to Professor Dashboard
                  </button>
                </Link>
                <Link to="/my-tests">
                  <button type="button" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-7 py-3 rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <FaArrowLeft /> Back to Manage Tests
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/quizzes">
                  <button type="button" className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition text-sm cursor-pointer">
                    Back to Available Assessments
                  </button>
                </Link>
                <Link to="/dashboard">
                  <button type="button" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition text-sm cursor-pointer">
                    Go to Student Dashboard
                  </button>
                </Link>
              </div>
            )}
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
                <p className="text-lg font-black text-slate-700">{statusCounts.notAttempted}</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-slate-300"></span>
            </div>
          </div>

          {/* Question Numbers Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-1">
            {questions.map((q, index) => {
              const qId = q?.id;
              const isAnswered = 
                (answers[index] !== undefined && typeof answers[index] === 'number') || 
                (answers[String(index)] !== undefined && typeof answers[String(index)] === 'number') ||
                (qId && answers[qId] !== undefined && typeof answers[qId] === 'number');
              const isMarked = !!marked[index];
              const isVisited = !!visited[index];
              const isCurrent = current === index;

              let btnClass = "bg-slate-100 text-slate-700 hover:bg-slate-200"; // Not Attempted
              if (isMarked) {
                btnClass = "bg-amber-400 text-amber-950 font-black";
              } else if (isAnswered) {
                btnClass = "bg-emerald-500 text-white font-bold";
              } else if (isVisited) {
                btnClass = "bg-rose-500 text-white font-bold";
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`w-9 h-9 rounded-xl text-xs transition duration-150 relative cursor-pointer ${btnClass} ${
                    isCurrent ? "ring-4 ring-indigo-500 scale-105 shadow-md z-10" : ""
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-600 space-y-1.5 mt-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unanswered
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Mark for Review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Not Attempted
            </span>
          </div>
          <div className="pt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <FaShieldAlt className="text-primary text-xs" />
            <span>{isProfessor ? "Professor View" : "Proctor Engine Active"}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default QuizPage;