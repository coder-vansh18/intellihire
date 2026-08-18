import React, { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { API_URL } from "../config";
import {
  FaSearch,
  FaFilter,
  FaFileDownload,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaChartLine,
  FaUsers,
  FaClipboardList,
  FaArrowLeft,
  FaEye,
  FaClock
} from "react-icons/fa";

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/results`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch results", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Unique Tests & Branches for Filter Dropdowns
  const uniqueTests = useMemo(() => {
    const testMap = new Map();
    results.forEach((r) => {
      if (r.testId?._id && r.testId?.title) {
        testMap.set(r.testId._id, r.testId.title);
      }
    });
    return Array.from(testMap.entries());
  }, [results]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (r.userName || "").toLowerCase().includes(searchLower);
      const rollMatch = (r.userRollNumber || "").toLowerCase().includes(searchLower);
      const emailMatch = (r.userEmail || "").toLowerCase().includes(searchLower);
      const testMatch = (r.testId?.title || "").toLowerCase().includes(searchLower);
      const matchesSearch = !searchTerm || nameMatch || rollMatch || emailMatch || testMatch;

      // Dropdown filters
      const matchesTest = selectedTest === "all" || r.testId?._id === selectedTest;
      const matchesBranch = selectedBranch === "all" || (r.userBranch || "").toLowerCase() === selectedBranch.toLowerCase();
      const matchesYear = selectedYear === "all" || (r.userYear || "").toLowerCase() === selectedYear.toLowerCase();
      const matchesSection = selectedSection === "all" || (r.userSection || "").toLowerCase() === selectedSection.toLowerCase();
      
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "passed" && !r.disqualified) ||
        (selectedStatus === "disqualified" && r.disqualified) ||
        (selectedStatus === "warnings" && (r.tab_switch_count || 0) > 0 && !r.disqualified);

      return matchesSearch && matchesTest && matchesBranch && matchesYear && matchesSection && matchesStatus;
    });
  }, [results, searchTerm, selectedTest, selectedBranch, selectedYear, selectedSection, selectedStatus]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) return { total: 0, avgAccuracy: 0, passed: 0, disqualified: 0 };

    let totalAccuracy = 0;
    let passedCount = 0;
    let disqualifiedCount = 0;

    filteredResults.forEach((r) => {
      const acc = r.total > 0 ? (r.score / r.total) * 100 : 0;
      totalAccuracy += acc;
      if (r.disqualified) disqualifiedCount++;
      else passedCount++;
    });

    return {
      total,
      avgAccuracy: Math.round(totalAccuracy / total),
      passed: passedCount,
      disqualified: disqualifiedCount
    };
  }, [filteredResults]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredResults.length) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Roll Number",
      "Branch",
      "Year",
      "Section",
      "Test Title",
      "Score",
      "Total Marks",
      "Accuracy (%)",
      "Tab Switches",
      "Fullscreen Exits",
      "Paste Events",
      "Disqualified",
      "Submission Date"
    ];

    const rows = filteredResults.map((r) => [
      `"${r.userName || ""}"`,
      `"${r.userEmail || ""}"`,
      `"${r.userRollNumber || "N/A"}"`,
      `"${r.userBranch || "N/A"}"`,
      `"${r.userYear || "N/A"}"`,
      `"${r.userSection || "N/A"}"`,
      `"${r.testId?.title || "Test"}"`,
      r.score,
      r.total,
      r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
      r.tab_switch_count || 0,
      r.fullscreen_exit_count || 0,
      r.paste_count || 0,
      r.disqualified ? "YES" : "NO",
      `"${new Date(r.createdAt).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IntelliHire_Student_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800 pb-16">
      {/* 🔹 Top Header Bar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/company-dashboard">
              <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition">
                <FaArrowLeft />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <FaGraduationCap className="text-primary" /> Professor Assessment Portal
              </h1>
              <p className="text-xs text-slate-500">Student score analytics, branch rankings & proctor audit logs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              <FaFileDownload /> Export CSV Marksheet
            </button>
            <Link to="/create-test">
              <button className="bg-primary hover:bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
                + Create Assessment
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* 🔹 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              <FaUsers />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submissions</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              <FaChartLine />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Accuracy</p>
              <h3 className="text-2xl font-black text-blue-600">{stats.avgAccuracy}%</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <FaCheckCircle />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed / Verified</p>
              <h3 className="text-2xl font-black text-emerald-600">{stats.passed}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
              <FaTimesCircle />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disqualified</p>
              <h3 className="text-2xl font-black text-rose-600">{stats.disqualified}</h3>
            </div>
          </div>
        </div>

        {/* 🔹 Filter & Search Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search by student name, roll number, email, or assessment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition font-medium"
              />
            </div>

            {/* Test Selector */}
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
            >
              <option value="all">All Assessments</option>
              {uniqueTests.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
            >
              <option value="all">All Branches</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="AI & Data Science">AI & Data Science</option>
              <option value="Electronics & Comm.">Electronics & Comm.</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
            >
              <option value="all">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
            >
              <option value="all">All Sections</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
              <option value="Section D">Section D</option>
            </select>

            {/* Proctor Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
            >
              <option value="all">All Proctor Status</option>
              <option value="passed">Verified / Clean</option>
              <option value="warnings">Warnings Recorded</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>

        {/* 🔹 Main Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-semibold">
              Loading student results...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FaClipboardList className="text-5xl text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">No Assessment Results Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No students match the current filters. Clear the search filters or assign tests to your class.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Student Information</th>
                    <th className="py-3.5 px-4">Academic Details</th>
                    <th className="py-3.5 px-4">Assessment</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Proctoring Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredResults.map((r, i) => {
                    const accuracy = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                    return (
                      <tr key={r.id || i} className="hover:bg-slate-50/60 transition">
                        {/* Student Info */}
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{r.userName || "Student"}</p>
                          <p className="text-xs text-slate-400">{r.userEmail || "No email"}</p>
                        </td>

                        {/* Academic Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-xs text-slate-700">
                              {r.userRollNumber ? `Roll: ${r.userRollNumber}` : "Roll: N/A"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {[r.userBranch, r.userYear, r.userSection].filter(Boolean).join(" • ") || "General"}
                            </span>
                          </div>
                        </td>

                        {/* Assessment */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{r.testId?.title || "Assessment"}</span>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 text-base">
                            {r.score} <span className="text-xs font-normal text-slate-400">/ {r.total}</span>
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-xs ${accuracy >= 70 ? "text-emerald-600" : accuracy >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                              {accuracy}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${accuracy >= 70 ? "bg-emerald-500" : accuracy >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Proctoring */}
                        <td className="py-3.5 px-4">
                          {r.disqualified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <FaTimesCircle /> Disqualified (3+ Tabs)
                            </span>
                          ) : (r.tab_switch_count || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <FaExclamationTriangle /> {r.tab_switch_count} Tab Switches
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <FaShieldAlt /> Clean Proctor
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setSelectedAnalytics(r)}
                            className="inline-flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                          >
                            <FaEye /> Deep Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Deep Analytics Audit Modal */}
      {selectedAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Student Audit Report
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{selectedAnalytics.userName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedAnalytics.userEmail} • Roll: {selectedAnalytics.userRollNumber || "N/A"} •{" "}
                  {[selectedAnalytics.userBranch, selectedAnalytics.userYear, selectedAnalytics.userSection].filter(Boolean).join(" - ") || "General"}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Score & Timing Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-center">
                <p className="text-xs font-bold text-indigo-600 uppercase">Assessment Score</p>
                <p className="text-3xl font-black text-indigo-900 mt-1">
                  {selectedAnalytics.score} <span className="text-sm font-normal text-indigo-600">/ {selectedAnalytics.total}</span>
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">Accuracy Rate</p>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {selectedAnalytics.total > 0 ? Math.round((selectedAnalytics.score / selectedAnalytics.total) * 100) : 0}%
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">Time Spent</p>
                <p className="text-3xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
                  <FaClock className="text-sm text-slate-400" />
                  {Math.floor((selectedAnalytics.duration_seconds || 0) / 60)}m {(selectedAnalytics.duration_seconds || 0) % 60}s
                </p>
              </div>
            </div>

            {/* Proctoring Log */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaShieldAlt className="text-primary" /> Anti-Cheat Proctoring Log
                </h4>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedAnalytics.disqualified ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {selectedAnalytics.disqualified ? "Disqualified" : "Integrity Verified"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">Tab Switches</p>
                  <p className={`text-lg font-bold ${(selectedAnalytics.tab_switch_count || 0) >= 3 ? "text-rose-600" : "text-slate-800"}`}>
                    {selectedAnalytics.tab_switch_count || 0} / 3 max
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">Fullscreen Exits</p>
                  <p className="text-lg font-bold text-slate-800">{selectedAnalytics.fullscreen_exit_count || 0}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">Paste Events</p>
                  <p className="text-lg font-bold text-slate-800">{selectedAnalytics.paste_count || 0}</p>
                </div>
              </div>
            </div>

            {/* Per-Question Answer Breakdown */}
            {selectedAnalytics.metrics && selectedAnalytics.metrics.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Question-by-Question Response Audit</h4>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-2">
                  {selectedAnalytics.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center gap-4 ${
                        m.is_correct ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"
                      }`}
                    >
                      <div className="flex-1 truncate">
                        <span className="font-bold text-slate-800">Q{idx + 1}:</span>{" "}
                        <span className="text-slate-700">{m.question_text || `Question ${idx + 1}`}</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded ${m.is_correct ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
                        {m.is_correct ? "Correct ✓" : "Incorrect ✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;