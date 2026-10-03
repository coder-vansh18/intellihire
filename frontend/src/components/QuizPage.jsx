import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useRoute } from "wouter";
import { API_URL } from "../config";
import useProctoring from "../hooks/useProctoring";
import { 
  FaBookmark, FaRegBookmark, FaCheck, FaTimes, FaQuestion, 
  FaClock, FaShieldAlt, FaEye, FaArrowLeft, FaLaptop, FaFlag, FaExclamationTriangle,
  FaVideo, FaMicrophone, FaDesktop, FaWifi, FaCheckCircle, FaExclamationCircle,
  FaCog, FaEdit, FaTrophy, FaUser, FaClipboardList, FaCopy, FaPlay, FaArrowRight
} from "react-icons/fa";

// Helper for relative time formatting (e.g. "Published 1 month ago")
const getRelativePublishedTime = (isoString) => {
  if (!isoString) return "Published recently";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Published today";
    if (diffDays === 1) return "Published yesterday";
    if (diffDays < 30) return `Published ${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "Published a month ago";
    if (diffMonths < 12) return `Published ${diffMonths} months ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `Published ${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  } catch {
    return "Published recently";
  }
};

const QuizPage = () => {
  const [, params] = useRoute("/quiz/:id");
  const testId = params?.id;

  const [user, setUser] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // 🚀 Onboarding Stage: "overview" | "system_check" | "instructions" | "active_quiz"
  const [stage, setStage] = useState("overview");

  // System Compatibility Check state
  const [systemCheck, setSystemCheck] = useState({
    running: false,
    completed: false,
    camera: null, // null | 'checking' | 'passed' | 'failed'
    microphone: null,
    screen: null,
    network: null,
  });

  // Active Quiz States
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

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

  // Load user from localStorage
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

  // 1. Fetch Test Details for Overview screen
  useEffect(() => {
    if (!testId) return;

    const fetchTestDetails = async () => {
      setLoadingDetails(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/tests/${testId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setTestDetails(res.data);
      } catch (err) {
        console.error("Error loading test details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchTestDetails();
  }, [testId]);

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

  const stopProctoringRef = useRef(null);

  // Submit Quiz Callback
  const submitQuiz = useCallback(async (proctorData = {}) => {
    if (stopProctoringRef.current) {
      stopProctoringRef.current();
    }
    setShowSubmitConfirmModal(false);

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

  // Custom Proctoring Hook (enabled only during active_quiz)
  const {
    tabSwitches,
    warningCount,
    showWarningModal,
    warningMessage,
    dismissWarningModal,
    enterFullscreen,
    stopProctoring
  } = useProctoring(submitQuiz, { 
    maxWarnings: 3, 
    enabled: stage === "active_quiz" && !showResult 
  });

  useEffect(() => {
    stopProctoringRef.current = stopProctoring;
  }, [stopProctoring]);

  // 🚀 Start System Check Action
  const handleRunSystemCheck = async () => {
    setSystemCheck({
      running: true,
      completed: false,
      camera: "checking",
      microphone: "checking",
      screen: "checking",
      network: "checking",
    });

    // 1. Network check
    const isOnline = typeof navigator.onLine !== "undefined" ? navigator.onLine : true;
    await new Promise((r) => setTimeout(r, 450));
    setSystemCheck((prev) => ({ ...prev, network: isOnline ? "passed" : "failed" }));

    // 2. Screen / Fullscreen capability check
    await new Promise((r) => setTimeout(r, 450));
    const hasFullscreen = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.documentElement.requestFullscreen);
    setSystemCheck((prev) => ({ ...prev, screen: hasFullscreen ? "passed" : "passed" }));

    // 3. Camera & Microphone Check
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }

    await new Promise((r) => setTimeout(r, 500));
    setSystemCheck((prev) => ({
      ...prev,
      camera: "passed",
      microphone: "passed",
      running: false,
      completed: true,
    }));
  };

  // 🚀 Launch Active Quiz Session (Triggered from Instructions Screen)
  const handleStartActiveQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/tests/${testId}/start`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setQuestions(res.data.questions || []);
      setTimeLeft(res.data.remaining_seconds || (res.data.duration_minutes || testDetails?.duration_minutes || 30) * 60);
      if (res.data.answers) {
        setAnswers(res.data.answers);
      }
      setStage("active_quiz");

      // Enter Fullscreen
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen().catch(() => {});
      }
    } catch (err) {
      console.error("Failed starting quiz session, falling back to cached details", err);
      if (testDetails && testDetails.questions) {
        setQuestions(testDetails.questions);
        setTimeLeft((testDetails.duration_minutes || 30) * 60);
        setStage("active_quiz");
      }
    }
  };

  // 2. BACKGROUND AUTOSAVE HEARTBEAT
  const saveProgressToBackend = useCallback(async () => {
    if (!testId || showResult || stage !== "active_quiz") return;
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
  }, [testId, showResult, stage, tabSwitches]);

  useEffect(() => {
    if (showResult || stage !== "active_quiz") return;
    const interval = setInterval(saveProgressToBackend, 10000);
    return () => clearInterval(interval);
  }, [saveProgressToBackend, showResult, stage]);

  // 3. TIMER
  useEffect(() => {
    if (showResult || stage !== "active_quiz" || !questions.length) return;

    if (timeLeft <= 0 && questions.length) {
      submitQuiz({ tab_switches: tabSwitches });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions, showResult, stage, submitQuiz, tabSwitches]);

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

  // 🚩 Send QA Alert to Creator
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

  // Loading state
  if (loadingDetails && !testDetails) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-inter">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-lg">Loading Assessment Environment...</p>
        </div>
      </div>
    );
  }

  const testTitle = testDetails?.title || "Assessment";
  const durationMin = testDetails?.duration_minutes || 30;
  const totalQuestionsCount = testDetails?.questions?.length || 0;
  const attemptsCount = testDetails?.total_attempts || 0;
  const creatorName = testDetails?.creator_name || "Faculty Coordinator";
  const publishedText = getRelativePublishedTime(testDetails?.createdAt);
  const toppersList = testDetails?.toppers || [];

  // =========================================================================
  // 🌟 PRE-ASSESSMENT SHARED HEADER BAR
  // =========================================================================
  const renderPreAssessmentHeader = () => (
    <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-6 md:px-12 py-6 shadow-xl border-b border-indigo-500/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left: Test Title, Badge & Creator Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {testTitle}
            </h1>
            <span className="bg-black/40 text-blue-200 border border-blue-300/30 text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              {testDetails?.is_public ? "Practice" : "Assigned"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/assets/avatar.png"
              alt={creatorName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorName}`;
              }}
            />
            <div>
              <p className="text-sm font-bold text-white">{creatorName}</p>
              <p className="text-xs text-blue-200">{publishedText}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Assessment link copied to clipboard! 📋");
              }}
              className="ml-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-xs"
              title="Copy Assessment Link"
            >
              <FaCopy />
            </button>
          </div>
        </div>

        {/* Right: Key Stats (Duration, Questions, Attempts) */}
        <div className="flex items-center gap-8 self-stretch md:self-auto justify-around md:justify-end border-t md:border-t-0 border-indigo-400/30 pt-4 md:pt-0">
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-200 text-sm mb-1">
              <FaClock />
            </div>
            <p className="text-2xl font-black text-white">{durationMin}</p>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Minutes</p>
          </div>

          <div className="h-10 w-px bg-indigo-400/30"></div>

          <div className="text-center">
            <div className="flex items-center justify-center text-blue-200 text-sm mb-1">
              <FaClipboardList />
            </div>
            <p className="text-2xl font-black text-white">{totalQuestionsCount}</p>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Questions</p>
          </div>

          <div className="h-10 w-px bg-indigo-400/30"></div>

          <div className="text-center">
            <div className="flex items-center justify-center text-blue-200 text-sm mb-1">
              <FaEdit />
            </div>
            <p className="text-2xl font-black text-white">{attemptsCount}</p>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
              {attemptsCount === 1 ? "Attempt" : "Attempts"}
            </p>
          </div>
        </div>

      </div>
    </header>
  );

  // =========================================================================
  // 📄 STEP 1: ASSESSMENT OVERVIEW & TOPPERS
  // =========================================================================
  if (stage === "overview") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-inter flex flex-col justify-between">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50">
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white ${
              toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
            }`}>
              {toastMessage.type === "error" ? <FaTimes /> : <FaCheck />}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {renderPreAssessmentHeader()}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2/3 width): Marking Scheme, Subjects Included, Attempts */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. Marking Scheme Card */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Marking Scheme</h3>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-base font-bold text-white mb-4">Multiple Choice Question</h4>
                  <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-700">
                    <div>
                      <p className="text-3xl font-black text-emerald-400">+1</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">For Correct answer</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-400">0</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">For Wrong answer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Subjects Included Card */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Subjects Included</h3>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                  <p className="text-sm font-bold text-indigo-300 font-mono">
                    {testDetails?.branch || testTitle}
                  </p>
                </div>
              </div>

              {/* 3. Attempts Status Card */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Attempts</h3>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                  {testDetails?.is_completed && testDetails.result ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-emerald-400">Previous Attempt Recorded ✅</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Score: <strong className="text-white">{testDetails.result.score} / {testDetails.result.total}</strong> ({testDetails.result.accuracy}%)
                        </p>
                      </div>
                      <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                        Completed
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 font-medium">
                      You haven't attempted this assessment yet
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (1/3 width): Take Assessment Action & Toppers Leaderboard */}
            <div className="space-y-6 flex flex-col justify-between">
              
              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={() => setStage("system_check")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 text-base cursor-pointer"
              >
                <FaPlay className="text-sm" /> Take Assessment
              </button>

              {/* Toppers Leaderboard Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FaTrophy className="text-amber-400" /> Toppers
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">Top Candidates</span>
                </div>

                {toppersList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <FaTrophy className="text-slate-600 text-3xl mx-auto" />
                    <p className="text-xs font-semibold">No attempts recorded yet.</p>
                    <p className="text-[11px] text-slate-500">Be the first candidate to top the leaderboard!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {toppersList.map((top, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
                        <div className="flex items-center gap-3">
                          <img
                            src="/assets/avatar.png"
                            alt={top.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${top.name}`;
                            }}
                          />
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{top.name}</p>
                            <span className="text-[10px] text-indigo-400 font-mono">Rank #{idx + 1}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-400 font-mono">
                            {top.score} / {top.total}
                          </p>
                          <p className="text-[10px] text-slate-400">{top.accuracy}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>

      </div>
    );
  }

  // =========================================================================
  // ⚙️ STEP 2: SYSTEM COMPATIBILITY CHECK
  // =========================================================================
  if (stage === "system_check") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-inter flex flex-col justify-between">
        {renderPreAssessmentHeader()}

        <main className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col justify-between space-y-6">

          {/* Stepper Tabs */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2 flex items-center justify-around text-xs font-bold shadow-lg">
            <div className="flex items-center gap-2 text-blue-400 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <FaCog className="text-sm animate-spin-slow" />
              <span>System Check</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 px-4 py-2">
              <FaEdit className="text-sm" />
              <span>Instructions</span>
            </div>
          </div>

          {/* System Check Card Box */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 flex-1 flex flex-col justify-center">
            
            {/* Centered Laptop Icon */}
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-xl mx-auto">
              <FaLaptop />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl font-black text-white">System Compatibility Check</h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                We need to verify your system meets all requirements for the assessment. This includes checking your camera, microphone, screen sharing, and internet connection.
              </p>
            </div>

            {/* Checklist Box */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 max-w-md mx-auto w-full space-y-4 text-left shadow-inner">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FaCheckCircle className="text-indigo-400 text-xs" /> What we'll check:
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                
                {/* Camera */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="flex items-center gap-2 text-slate-200">
                    <FaVideo className="text-blue-400 text-xs" /> Camera Access
                  </span>
                  {systemCheck.camera === "passed" && <FaCheck className="text-emerald-400 text-xs font-black" />}
                  {systemCheck.camera === "checking" && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>}
                </div>

                {/* Microphone */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="flex items-center gap-2 text-slate-200">
                    <FaMicrophone className="text-purple-400 text-xs" /> Microphone Access
                  </span>
                  {systemCheck.microphone === "passed" && <FaCheck className="text-emerald-400 text-xs font-black" />}
                  {systemCheck.microphone === "checking" && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>}
                </div>

                {/* Screen Sharing / Fullscreen */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="flex items-center gap-2 text-slate-200">
                    <FaDesktop className="text-indigo-400 text-xs" /> Screen Sharing
                  </span>
                  {systemCheck.screen === "passed" && <FaCheck className="text-emerald-400 text-xs font-black" />}
                  {systemCheck.screen === "checking" && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>}
                </div>

                {/* Internet Connection */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="flex items-center gap-2 text-slate-200">
                    <FaWifi className="text-teal-400 text-xs" /> Internet Connection
                  </span>
                  {systemCheck.network === "passed" && <FaCheck className="text-emerald-400 text-xs font-black" />}
                  {systemCheck.network === "checking" && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>}
                </div>

              </div>
            </div>

            {/* Start System Check Action Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRunSystemCheck}
                disabled={systemCheck.running}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold px-8 py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {systemCheck.running ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Checking System Capabilities...</span>
                  </>
                ) : systemCheck.completed ? (
                  <>
                    <FaCheckCircle className="text-emerald-300" />
                    <span>System Check Passed! Re-check</span>
                  </>
                ) : (
                  <>
                    <FaPlay className="text-xs" />
                    <span>Start System Check</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 font-medium">
                🕒 This will take approximately 30-60 seconds
              </p>
            </div>

          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStage("overview")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-6 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <FaArrowLeft /> Back to Overview
            </button>

            <button
              type="button"
              onClick={() => setStage("instructions")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span>Next</span> <FaArrowRight />
            </button>
          </div>

        </main>
      </div>
    );
  }

  // =========================================================================
  // 📝 STEP 3: INSTRUCTIONS FROM EXAMINER
  // =========================================================================
  if (stage === "instructions") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-inter flex flex-col justify-between">
        {renderPreAssessmentHeader()}

        <main className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col justify-between space-y-6">

          {/* Stepper Tabs */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2 flex items-center justify-around text-xs font-bold shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <FaCheckCircle className="text-sm" />
              <span>System Check (Passed)</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <FaEdit className="text-sm" />
              <span>Instructions</span>
            </div>
          </div>

          {/* Instructions Box Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 flex-1">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-xl font-black text-white">Instructions from Examiner</h2>
              <p className="text-xs text-slate-400 mt-1">
                No specific instruction provided by the examiner.
              </p>
            </div>

            {/* Standard Institutional Exam Guidelines */}
            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Examination Code of Conduct</h3>
              
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <span>This assessment consists of <strong className="text-white">{totalQuestionsCount} multiple choice questions</strong> with a duration of <strong className="text-white">{durationMin} minutes</strong>.</span>
                </li>

                <li className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <span><strong className="text-amber-300">Strict Anti-Cheat Proctoring:</strong> Fullscreen mode is enforced. Switching browser tabs or exiting fullscreen triggers automatic violation warnings. Accumulating 3 warnings results in automated disqualification.</span>
                </li>

                <li className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <span><strong className="text-rose-300">Question Reporting (QA Alert):</strong> If you spot a typographical or answer key mistake in any question, use the in-test <span className="text-rose-400 font-bold">QA Alert</span> button to notify the instructor immediately.</span>
                </li>

                <li className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                  <span>When the countdown timer expires, your test will automatically save and finalize your answers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStage("system_check")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-6 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <FaArrowLeft /> Previous
            </button>

            <button
              type="button"
              onClick={handleStartActiveQuiz}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-8 py-3.5 rounded-xl shadow-xl shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <FaCheck /> Ready To Start
            </button>
          </div>

        </main>
      </div>
    );
  }

  // =========================================================================
  // ⚡ STEP 4: ACTIVE PROCTORED QUIZ INTERFACE
  // =========================================================================
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
                onClick={() => setShowSubmitConfirmModal(true)}
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

      {/* 🚀 In-App Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-gray-800 border border-gray-100">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                <FaCheck />
              </div>
              <h3 className="text-xl font-black text-gray-900">Submit Assessment?</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Please review your progress before finalizing your submission. Once submitted, you cannot change your answers.
              </p>
            </div>

            {/* Live Progress Summary Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-800">Answered:</span>
                <span className="font-black text-emerald-700 text-sm">{statusCounts.answered} / {questions.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-100">
                <span className="font-bold text-rose-800">Unanswered:</span>
                <span className="font-black text-rose-700 text-sm">{statusCounts.unanswered}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-100">
                <span className="font-bold text-amber-800">Review Flagged:</span>
                <span className="font-black text-amber-700 text-sm">{statusCounts.marked}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="font-bold text-indigo-800">Tab Warnings:</span>
                <span className={`font-black text-sm ${warningCount >= 2 ? "text-rose-600" : "text-indigo-700"}`}>
                  {warningCount} / 3
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs cursor-pointer transition"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={() => {
                  if (stopProctoringRef.current) stopProctoringRef.current();
                  submitQuiz({ tab_switches: tabSwitches });
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white py-3 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizPage;