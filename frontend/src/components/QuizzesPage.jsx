import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlay, FaFilter, FaUser, FaLaptop, FaCheckCircle, 
  FaTimesCircle, FaClock, FaCalendarAlt, FaLock, FaShieldAlt, 
  FaTrophy, FaListAlt, FaHistory, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { Link } from 'wouter';
import axios from 'axios';
import { API_URL } from "../config";

const QuizzesPage = () => {
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'completed'
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Fetch tests with Authorization header
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/tests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setTests(res.data);
      } catch (err) {
        console.error("Error fetching tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Split into Available (Active) & Completed Tests
  const { availableTests, completedTests } = useMemo(() => {
    const available = [];
    const completed = [];

    tests.forEach((t) => {
      if (t.is_completed) {
        completed.push(t);
      } else {
        available.push(t);
      }
    });

    return { availableTests: available, completedTests: completed };
  }, [tests]);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-inter flex flex-col justify-between">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="text-2xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          <Link to={user?.role === "admin" ? "/admin-dashboard" : user && (user.role === "company" || user.role === "professor") ? "/company-dashboard" : "/"}>IntelliHire</Link>
        </div>

        <ul className="hidden md:flex space-x-8 list-none font-medium text-sm text-gray-600">
          <li><Link to={user?.role === "admin" ? "/admin-dashboard" : user && (user.role === "company" || user.role === "professor") ? "/company-dashboard" : "/"} className="hover:text-primary transition">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary transition font-bold text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary transition">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary transition">Resources</Link></li>
        </ul>

        {user ? (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-primary focus:outline-none transition"
              title={user.name || "Profile"}
            >
              <img
                src="/assets/avatar.png"
                alt="Profile Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm hover:scale-105 transition duration-150"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=user";
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                </div>

                <Link to="/profile">
                  <div className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaUser className="text-gray-400 text-xs" /> Profile
                  </div>
                </Link>

                <Link to={user?.role === "admin" ? "/admin-dashboard" : (user?.role === "company" || user?.role === "professor") ? "/company-dashboard" : "/dashboard"}>
                  <div className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaLaptop className="text-gray-400 text-xs" /> Dashboard
                  </div>
                </Link>

                <div
                  onClick={handleLogout}
                  className="px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-semibold cursor-pointer border-t border-gray-100"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-md transition">
              Login / Signup
            </button>
          </Link>
        )}
      </nav>

      {/* Header Banner */}
      <header className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-primary text-white py-14 px-6 text-center shadow-md">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="bg-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Proctored Assessment Hub
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Academic Tests & Practice Quizzes
          </h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-xl mx-auto">
            Take branch-assigned tests with live anti-cheat monitoring or review your past marks and performance breakdowns.
          </p>
        </div>
      </header>

      {/* 🔹 MAIN CONTENT AREA WITH TABS */}
      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        
        {/* Navigation Tabs (Available vs Completed) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
          <div className="flex gap-2 p-1.5 bg-gray-200/80 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition duration-150 ${
                activeTab === 'available'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaListAlt className="text-xs" />
              <span>Available Tests</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'available' ? 'bg-indigo-100 text-primary' : 'bg-gray-300 text-gray-700'
              }`}>
                {availableTests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition duration-150 ${
                activeTab === 'completed'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaHistory className="text-xs" />
              <span>Completed Tests</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-300 text-gray-700'
              }`}>
                {completedTests.length}
              </span>
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
            <span>Filtering:</span>
            <span className="bg-white border px-3 py-1.5 rounded-lg text-gray-800 shadow-sm font-medium">
              {activeTab === 'available' ? 'Pending Assessments' : 'Submitted Assessments'}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 font-semibold text-sm">Loading your assessments...</p>
          </div>
        ) : (
          <>
            {/* 1. AVAILABLE TESTS TAB */}
            {activeTab === 'available' && (
              <div className="space-y-6">
                {availableTests.length === 0 ? (
                  <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center text-2xl mx-auto mb-4">
                      <FaCheckCircle />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">All Caught Up!</h3>
                    <p className="text-sm text-gray-500">
                      You have no pending assessments to attempt. Completed tests can be viewed in the Completed tab.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTests.map((test) => {
                      const tId = test._id || test.id;
                      const isExpired = !!test.is_expired;

                      return (
                        <div
                          key={tId}
                          className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition duration-200 shadow-sm ${
                            isExpired
                              ? "border-red-200 bg-red-50/20 opacity-90"
                              : "border-gray-200 hover:border-indigo-300 hover:shadow-xl"
                          }`}
                        >
                          <div>
                            {/* Header Tags */}
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                                {test.title}
                              </h3>
                              
                              {isExpired ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 shrink-0">
                                  <FaLock className="text-[10px]" /> Expired
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Open
                                </span>
                              )}
                            </div>

                            {/* Test Meta Info */}
                            <div className="space-y-2 text-sm text-gray-600 mb-6 bg-slate-50 p-3.5 rounded-xl border border-gray-100">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Questions:</span>
                                <span className="font-bold text-gray-800">{test.questions ? test.questions.length : 0} MCQs</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Duration:</span>
                                <span className="font-bold text-gray-800">{test.duration_minutes || 60} mins</span>
                              </div>
                              
                              {/* Expiry Deadline Display */}
                              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <FaClock className="text-[10px]" /> Deadline:
                                </span>
                                {test.expires_at ? (
                                  <span className={`font-bold ${isExpired ? "text-red-600" : "text-amber-700"}`}>
                                    {new Date(test.expires_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-semibold">No Expiry Limit</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {isExpired ? (
                              <button
                                disabled
                                className="w-full bg-gray-200 text-gray-500 font-bold py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                              >
                                <FaLock className="text-xs" /> Assessment Expired
                              </button>
                            ) : (
                              <Link to={`/quiz/${tId}`}>
                                <button className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm">
                                  <FaPlay className="text-xs" /> Start Assessment
                                </button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. COMPLETED TESTS TAB */}
            {activeTab === 'completed' && (
              <div className="space-y-6">
                {completedTests.length === 0 ? (
                  <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4">
                      <FaHistory />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">No Completed Tests Yet</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Once you finish and submit an assessment, your score, accuracy, and proctoring audit log will appear here.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-full shadow hover:opacity-95 transition"
                    >
                      Browse Available Tests
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTests.map((test) => {
                      const tId = test._id || test.id;
                      const res = test.result || {};
                      const isDisqualified = !!res.disqualified;

                      return (
                        <div
                          key={tId}
                          className="bg-white rounded-2xl border border-emerald-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition duration-200"
                        >
                          <div>
                            {/* Header Tags */}
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                                {test.title}
                              </h3>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                                <FaCheck className="text-[10px]" /> Completed
                              </span>
                            </div>

                            {/* Result KPI Card */}
                            <div className="bg-gradient-to-br from-indigo-50/70 to-emerald-50/70 p-4 rounded-xl border border-indigo-100 mb-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Your Score</span>
                                <div className="text-right">
                                  <span className="text-2xl font-black text-indigo-900">{res.score || 0}</span>
                                  <span className="text-xs text-gray-500"> / {res.total || (test.questions ? test.questions.length : 0)}</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${res.accuracy !== undefined ? res.accuracy : (res.total ? Math.round((res.score / res.total) * 100) : 0)}%`
                                  }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                                <span>Accuracy:</span>
                                <span className="font-bold text-emerald-700">
                                  {res.accuracy !== undefined ? res.accuracy : (res.total ? Math.round((res.score / res.total) * 100) : 0)}%
                                </span>
                              </div>
                            </div>

                            {/* Proctoring & Timestamp */}
                            <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                              <div className="flex items-center justify-between">
                                <span>Proctor Audit:</span>
                                {isDisqualified ? (
                                  <span className="text-red-600 font-bold flex items-center gap-1">
                                    <FaExclamationTriangle className="text-[10px]" /> Disqualified
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <FaShieldAlt className="text-[10px]" /> Clean Attempt
                                  </span>
                                )}
                              </div>
                              {res.submitted_at && (
                                <p className="text-gray-400">
                                  Submitted on: {new Date(res.submitted_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Completed Button */}
                          <button
                            disabled
                            className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-default"
                          >
                            <FaCheckCircle /> Submitted Successfully
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

    </div>
  );
};

export default QuizzesPage;