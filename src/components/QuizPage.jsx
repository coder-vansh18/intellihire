import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useRoute } from "wouter";

const QuizPage = (props) => {
  const [, params] = useRoute("/quiz/:id");
  const testId = params?.id;

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // 🔥 FETCH TEST FROM BACKEND
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/tests/${testId}`);
        setQuestions(res.data.questions);

        // dynamic timer (1 question = 1 min)
        setTimeLeft(res.data.questions.length * 60);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTest();
  }, [testId]);

  // ⏱ TIMER
  useEffect(() => {
    if (timeLeft <= 0 && questions.length) {
      setShowResult(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions]);

  // SAVE ANSWER
  const handleAnswer = (index) => {
    setAnswers({ ...answers, [current]: index });
  };

  // NAVIGATION
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

  const submitQuiz = async () => {
  const score = calculateScore();
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch("http://localhost:5000/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user._id,
        userName: user.name,
        testId: testId,
        score: score,
        total: questions.length
      })
    });

    const data = await res.json();
    console.log("Saved:", data);

  } catch (err) {
    console.error(err);
  }

  setShowResult(true);
};

  // ✅ SCORE CALCULATION
  const calculateScore = () => {
  let score = 0;

  questions.forEach((q, i) => {
    console.log("Q:", i, "Correct:", q.correct, "Answer:", answers[i]);

    if (Number(answers[i]) === Number(q.correct)) {
      score++;
    }
  });

  return score;
};

  if (!questions.length) return <p className="p-10">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary to-secondary p-6 gap-6">

      {/* LEFT SIDE */}
      <div className="w-3/4 bg-white p-6 rounded-xl shadow-2xl">

        {!showResult ? (
          <>
            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                Question {current + 1} / {questions.length}
              </h2>

              <span className="font-bold text-red-500">
                ⏱ {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>

            {/* QUESTION */}
            <p className="mb-6 font-medium">
              {questions[current].question}
            </p>

            {/* OPTIONS */}
            {questions[current].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`block border p-3 my-2 w-full text-left rounded-lg transition ${
                  answers[current] === i
                    ? "bg-blue-200 border-blue-500"
                    : "hover:bg-gray-100"
                }`}
              >
                {opt}
              </button>
            ))}

            {/* BUTTONS */}
            <div className="flex justify-between mt-6">

              <button
                onClick={prevQuestion}
                className="bg-gray-400 px-4 py-2 text-white rounded"
              >
                Prev
              </button>

              <button
                onClick={markReview}
                className="bg-yellow-500 px-4 py-2 text-white rounded"
              >
                {marked[current] ? "Unmark" : "Mark Review"}
              </button>

              <button
                onClick={nextQuestion}
                className="bg-blue-500 px-4 py-2 text-white rounded"
              >
                Save & Next
              </button>

            </div>

            <button
              onClick={submitQuiz}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded"
            >
              Submit Test
            </button>

          </>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Score: {calculateScore()} / {questions.length}
            </h2>

            <Link to="/quizzes">
              <button className="mt-4 bg-primary text-white px-6 py-2 rounded">
                Back to Tests
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* RIGHT SIDE (PALETTE) */}
      <div className="w-1/4 bg-white p-4 rounded-xl shadow-2xl">

        <h3 className="font-bold mb-4">Questions</h3>

        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-2 rounded font-semibold ${
                current === i
                  ? "bg-blue-600 text-white"
                  : answers[i] !== undefined
                  ? "bg-green-400"
                  : marked[i]
                  ? "bg-yellow-400"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-6 text-sm">
          <p>🟦 Current</p>
          <p>🟩 Answered</p>
          <p>🟨 Marked</p>
          <p>⬜ Not Attempted</p>
        </div>

      </div>
    </div>
  );
};

export default QuizPage;