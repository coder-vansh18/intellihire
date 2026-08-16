import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useRoute } from "wouter";
import { API_URL } from "../config";
import useProctoring from "../hooks/useProctoring";

const QuizPage = () => {
  const [, params] = useRoute("/quiz/:id");
  const testId = params?.id;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [disqualified, setDisqualified] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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
  }, [testId]);

  // Requirement 1: Custom Proctoring Hook with 3-Warning Limit
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
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );

        setQuestions(res.data.questions);
        setTimeLeft(res.data.remaining_seconds || res.data.duration_minutes * 60);
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
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
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

  const handleAnswer = (index) => {
    const qId = questions[current]?.id;
    setAnswers({
      ...answers,
      [current]: index,
      ...(qId ? { [qId]: index } : {})
    });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const prevQuestion = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const markReview = () => {
    setMarked({ ...marked, [current]: !marked[current] });
  };

  const calculateLocalScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (q.correct !== undefined && Number(answers[i]) === Number(q.correct)) {
        score++;
      }
    });
    return score;
  };

  if (!questions.length) return <p className="p-10 text-white font-semibold">Loading assessment...</p>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary to-secondary p-6 gap-6 select-none">
      
      {/* Strict Proctor Warning Modal (Requirement 1) */}
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

      {/* LEFT SIDE */}
      <div className="w-3/4 bg-white p-6 rounded-xl shadow-2xl flex flex-col justify-between">
        {!showResult ? (
          <>
            <div>
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h2 className="text-xl font-bold">
                  Question {current + 1} / {questions.length}
                </h2>

                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    warningCount >= 2 ? "bg-red-100 text-red-800 animate-pulse" : warningCount === 1 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                  }`}>
                    Tab Switch Warnings: {warningCount}/3
                  </span>

                  <span className="font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg">
                    ⏱ {Math.floor(Math.max(0, timeLeft) / 60)}:
                    {String(Math.max(0, timeLeft) % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* QUESTION */}
              <p className="mb-6 font-medium text-lg text-gray-900 leading-relaxed">
                {questions[current].question}
              </p>

              {/* OPTIONS */}
              {questions[current].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`block border p-4 my-2.5 w-full text-left rounded-lg transition duration-200 text-gray-800 font-medium ${
                    answers[current] === i
                      ? "bg-blue-100 border-blue-500 text-blue-900 shadow-sm"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* BUTTONS */}
            <div>
              <div className="flex justify-between mt-6 pt-4 border-t">
                <button
                  onClick={prevQuestion}
                  disabled={current === 0}
                  className={`px-5 py-2 text-white rounded font-medium transition ${
                    current === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  Prev
                </button>

                <button
                  onClick={markReview}
                  className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 text-white rounded font-medium transition"
                >
                  {marked[current] ? "Unmark" : "Mark Review"}
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={current === questions.length - 1}
                  className={`px-5 py-2 text-white rounded font-medium transition ${
                    current === questions.length - 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Save & Next
                </button>
              </div>

              <button
                onClick={() => submitQuiz({ tab_switches: tabSwitches })}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition"
              >
                Submit Assessment
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            {disqualified ? (
              <div className="bg-red-50 p-6 rounded-2xl mb-6 inline-block border border-red-200">
                <h2 className="text-3xl font-bold text-red-600 mb-2">Assessment Disqualified ❌</h2>
                <p className="text-gray-700 font-medium">Multiple tab-switching violations (3/3) were recorded during this session.</p>
              </div>
            ) : (
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Score: {finalScore} / {questions.length}
              </h2>
            )}

            <div className="mt-6">
              <Link to="/quizzes">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition">
                  Back to Tests
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE (PALETTE) */}
      <div className="w-1/4 bg-white p-6 rounded-xl shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b">Questions Overview</h3>

          <div className="grid grid-cols-5 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`p-2.5 rounded font-semibold text-sm transition ${
                  current === i
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : answers[i] !== undefined
                    ? "bg-green-500 text-white"
                    : marked[i]
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block"></span>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-green-500 inline-block"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-yellow-400 inline-block"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border inline-block"></span>
              <span>Not Attempted</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>🔒 IntelliHire Proctoring</span>
          <span className="font-bold text-gray-700">{tabSwitches}/3 Violations</span>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;