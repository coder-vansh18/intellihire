import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";

const InfiniteQuiz = ({ subject = "aptitude" }) => {
  // Quiz states
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [correct, setCorrect] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Game states
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [timer, setTimer] = useState(15);

  // Editor states
  const [showEditor, setShowEditor] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const editorRef = useRef(null);
  const timerRef = useRef(null);

  // Decode HTML entities
  const decodeHtml = useCallback((html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }, []);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `https://opentdb.com/api.php?amount=1&type=multiple`,
        { timeout: 8000 }
      );

      if (response.data.response_code === 0 && response.data.results?.[0]) {
        const q = response.data.results[0];
        
        const decodedQuestion = decodeHtml(q.question);
        const decodedCorrect = decodeHtml(q.correct_answer);
        const decodedIncorrect = q.incorrect_answers.map(decodeHtml);
        
        const allOptions = [...decodedIncorrect, decodedCorrect].sort(() => Math.random() - 0.5);

        setQuestion(decodedQuestion);
        setOptions(allOptions);
        setCorrect(decodedCorrect);
        setSelected(null);
        setTimer(15);
        setShowEditor(false);
        setEditorValue("");
      } else {
        throw new Error('No questions available');
      }
    } catch (err) {
      console.error('Quiz fetch error:', err);
      setError('Failed to load question. Using fallback...');
      // Fallback question
      setQuestion('What is 2 + 2?');
      setOptions(['3', '4', '5', '6']);
      setCorrect('4');
      setSelected(null);
      setTimer(15);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQuestion();
  }, []);

  // Timer effect
  useEffect(() => {
    if (loading || !question) return;

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          nextQuestion();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question, loading]);

  const checkAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    
    if (option === correct) {
      setScore(prev => prev + 1);
    }
    
    // Auto next after 1.5s
    setTimeout(nextQuestion, 1500);
  };

  const nextQuestion = () => {
    setQuestionCount(prev => prev + 1);
    setSelected(null);
    setShowEditor(false);
    setEditorValue("");
    fetchQuestion();
  };

  const handleEditorChange = (value) => {
    setEditorValue(value || '');
  };

  const handleEditorSubmit = () => {
    const userAnswer = editorValue.trim().toLowerCase();
    const correctLower = correct.toLowerCase();
    
    if (userAnswer === correctLower || editorValue.trim() === correct) {
      setScore(prev => prev + 1);
      setTimeout(nextQuestion, 1000);
    } else {
      alert(`Wrong! Correct answer: ${correct}`);
      setTimeout(nextQuestion, 1000);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Quiz...</h2>
          <p className="text-gray-600">Getting your questions ready</p>
        </div>
      </div>
    );
  }

  const progress = (timer / 15) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/30">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl text-lg font-bold shadow-xl">
            {subject.toUpperCase()}
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
            {score}
          </div>
        </div>

        {/* Progress & Timer */}
        <div className="flex justify-between items-center mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-red-600">{timer}</span>
          </div>
          <div className="w-64 bg-gray-200 rounded-2xl h-4 shadow-inner overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-2xl shadow-lg transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl mb-8 shadow-lg border-2 border-indigo-100">
          <h2 className="text-3xl font-bold text-gray-800 leading-tight mb-2">
            Q{questionCount}.
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed">{question}</p>
        </div>

        {/* Content Area */}
        <div className="space-y-4 mb-10">
          {showEditor ? (
            <>
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                <h3 className="text-xl font-semibold text-emerald-800">✏️ Type your answer:</h3>
                <button
                  onClick={handleEditorSubmit}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Submit Answer
                </button>
              </div>
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl">
                <Editor
                  height="180px"
                  defaultLanguage="plaintext"
                  value={editorValue}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 18,
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    glyphMargin: false,
                    folding: false
                  }}
                  theme="vs-light"
                />
              </div>
            </>
          ) : (
            options.map((option, index) => {
              const isCorrect = option === correct;
              const isSelected = option === selected;
              let buttonStyle = "group hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl";
              
              if (selected) {
                if (isCorrect) {
                  buttonStyle += " bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/25";
                } else if (isSelected) {
                  buttonStyle += " bg-red-500 border-red-500 text-white shadow-red-500/25";
                } else {
                  buttonStyle += " border-gray-300 bg-gray-50";
                }
              } else {
                buttonStyle += " border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-white";
              }

              return (
                <button
                  key={index}
                  onClick={() => checkAnswer(option)}
                  disabled={!!selected}
                  className={`w-full p-6 rounded-2xl font-semibold text-left text-lg ${buttonStyle} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  <span className="block">{option}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Controls */}
        {!showEditor && (
          <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl mb-6">
            <button
              onClick={() => setShowEditor(true)}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              ✏️ Type Answer Instead
            </button>
          </div>
        )}

        <div className="text-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-4">
            Question {questionCount} • {score} points
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteQuiz;