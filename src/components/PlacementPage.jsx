import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaBriefcase } from 'react-icons/fa';
import { Link } from 'wouter';

const PlacementPage = () => {

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 min

  const questions = [
    {
      question: 'What is the primary responsibility of a software engineer?',
      options: ['Designing systems', 'Writing code', 'Testing software', 'All of the above'],
      correct: 3
    },
    {
      question: 'Which company is known for its search engine?',
      options: ['Amazon', 'Google', 'Microsoft', 'Apple'],
      correct: 1
    },
    {
      question: 'What is a system design pattern?',
      options: ['A coding style', 'A solution to common problems', 'A database type', 'A programming language'],
      correct: 1
    }
  ];

  // ⏱️ TIMER
  useEffect(() => {
    if (timeLeft <= 0) {
      setShowResult(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // save answer
  const handleAnswer = (index) => {
    setAnswers({ ...answers, [current]: index });
  };

  // navigation
  const next = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  // mark review
  const toggleMark = () => {
    setMarked({ ...marked, [current]: !marked[current] });
  };

  // submit
  const submitTest = () => {
    setShowResult(true);
  };

  // score
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) score++;
    });
    return score;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary to-secondary p-6 gap-6">

      {/* LEFT SIDE */}
      <div className="w-3/4 bg-white p-6 rounded-xl shadow-2xl">

        {!showResult ? (
          <>
            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FaBriefcase /> Placement Test
              </h1>

              <span className="text-red-500 font-semibold">
                ⏱ {Math.floor(timeLeft / 60)}:{timeLeft % 60}
              </span>
            </div>

            {/* QUESTION */}
            <h2 className="text-lg font-semibold mb-4">
              Q{current + 1}. {questions[current].question}
            </h2>

            {/* OPTIONS */}
            {questions[current].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full p-3 border rounded-lg my-2 text-left transition 
                ${answers[current] === i ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                {opt}
              </button>
            ))}

            {/* ACTION BUTTONS */}
            <div className="flex justify-between mt-4">
              <button onClick={prev} className="bg-gray-500 text-white px-4 py-2 rounded">
                Prev
              </button>

              <button onClick={toggleMark} className="bg-yellow-500 text-white px-4 py-2 rounded">
                {marked[current] ? "Unmark" : "Mark Review"}
              </button>

              <button onClick={next} className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded">
                Save & Next
              </button>
            </div>

            <button
              onClick={submitTest}
              className="mt-6 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full"
            >
              Submit Test
            </button>
          </>
        ) : (
          <div className="text-center">
            <FaBriefcase className="text-6xl text-primary mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-4">Test Completed</h2>

            <p className="text-xl mb-4">
              Score: {calculateScore()} / {questions.length}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full"
            >
              Retake Test
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE (PALETTE) */}
      <div className="w-1/4 bg-white p-4 rounded-xl shadow-2xl">

        <h3 className="font-bold mb-4">Questions</h3>

        <div className="grid grid-cols-4 gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-2 rounded 
              ${current === i
                ? "bg-primary text-white"
                : answers[i] !== undefined
                ? "bg-green-400"
                : marked[i]
                ? "bg-yellow-400"
                : "bg-gray-200"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <Link to="/placements">
          <button className="mt-6 w-full bg-gray-500 text-white py-2 rounded flex items-center justify-center gap-2">
            <FaArrowLeft /> Back
          </button>
        </Link>

      </div>

    </div>
  );
};

export default PlacementPage;