import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { API_URL } from "../config";
import { 
  FaUserPlus, FaBuilding, FaCalendarAlt, FaLayerGroup, 
  FaGlobe, FaLock, FaTrashAlt, FaEye, FaSyncAlt, FaClock, FaCheckCircle, FaTimes, FaFlag, FaExclamationCircle, FaCheck 
} from "react-icons/fa";

// Helper to convert ISO UTC date to local datetime-local format (YYYY-MM-DDTHH:mm)
const formatToDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Target Modal States
  const [assignModalTest, setAssignModalTest] = useState(null);
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Edit Expiry Modal States
  const [expiryModalTest, setExpiryModalTest] = useState(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [savingExpiry, setSavingExpiry] = useState(false);

  // 🚩 QA Alerts Modal States
  const [qaModalTest, setQaModalTest] = useState(null);
  const [qaAlertsList, setQaAlertsList] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/my-tests`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/tests/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setTests(tests.filter((t) => (t._id || t.id) !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to delete test");
      }
    } catch (err) {
      console.error("Error deleting test", err);
    }
  };

  const handleOpenAssignModal = (test) => {
    setAssignModalTest(test);
    setTargetBranch("");
    setTargetYear("");
    setTargetSection("");
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!targetBranch && !targetYear && !targetSection) {
      alert("Please select at least one criteria (Branch, Year, or Section).");
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const tId = assignModalTest._id || assignModalTest.id;
      const res = await fetch(`${API_URL}/api/tests/${tId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          branch: targetBranch || null,
          year: targetYear || null,
          section: targetSection || null,
        }),
      });

      if (res.ok) {
        alert("Target criteria assigned successfully!");
        setAssignModalTest(null);
        fetchTests();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to assign target criteria");
      }
    } catch (err) {
      console.error("Error assigning test target", err);
      alert("Error occurred while saving assignment.");
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenExpiryModal = (test) => {
    setExpiryModalTest(test);
    setEditExpiry(formatToDatetimeLocal(test.expires_at));
  };

  const handleSaveExpiry = async (e) => {
    e.preventDefault();
    setSavingExpiry(true);
    try {
      const token = localStorage.getItem("token");
      const tId = expiryModalTest._id || expiryModalTest.id;

      let utcExpiryString = null;
      if (editExpiry) {
        const localDate = new Date(editExpiry);
        if (!isNaN(localDate.getTime())) {
          utcExpiryString = localDate.toISOString();
        }
      }

      const res = await fetch(`${API_URL}/api/tests/${tId}/expiry`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          expires_at: utcExpiryString,
        }),
      });

      if (res.ok) {
        alert("Assessment deadline updated successfully!");
        setExpiryModalTest(null);
        fetchTests();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to update deadline");
      }
    } catch (err) {
      console.error("Error updating deadline", err);
      alert("Error occurred while saving deadline.");
    } finally {
      setSavingExpiry(false);
    }
  };

  // 🚩 Fetch QA Alerts for a test
  const handleOpenQaModal = async (test) => {
    setQaModalTest(test);
    setLoadingAlerts(true);
    try {
      const token = localStorage.getItem("token");
      const tId = test._id || test.id;
      const res = await fetch(`${API_URL}/api/tests/${tId}/qa-alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setQaAlertsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching QA alerts", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleUpdateAlertStatus = async (alertId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/qa-alerts/${alertId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setQaAlertsList((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-6 font-inter text-gray-800">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Created Assessments 📋</h1>
          <p className="text-white text-opacity-90 text-sm mt-1">
            Manage your created tests, update deadlines, view student QA mistake alerts, and assign target branches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/create-test">
            <button className="bg-white text-primary font-bold px-5 py-2.5 rounded-full shadow hover:bg-opacity-90 transition duration-150 text-sm">
              + Create New Test
            </button>
          </Link>
          <Link to="/company-dashboard">
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-full backdrop-blur-sm transition text-sm">
              Dashboard
            </button>
          </Link>
          <Link to="/profile">
            <button 
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-white focus:outline-none transition"
              title="Profile"
            >
              <img
                src="/assets/avatar.png"
                alt="Profile Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md hover:scale-105 transition duration-150"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=user";
                }}
              />
            </button>
          </Link>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-500 font-semibold">
            Loading assessments...
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-600">
            <p className="text-lg font-bold mb-2">No tests created yet 📋</p>
            <p className="text-sm text-gray-500 mb-6">Create tests and assign them to specific branches, years, or sections.</p>
            <Link to="/create-test" className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold shadow hover:opacity-95 transition">
              Create Test Now
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const tId = test._id || test.id;
              const hasAlerts = (test.qa_alerts_count || 0) > 0;
              return (
                <div key={tId} className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between hover:shadow-xl transition">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">{test.title}</h2>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          test.is_public ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          {test.is_public ? <><FaGlobe className="text-[10px]"/> Public</> : <><FaLock className="text-[10px]"/> Private</>}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                      <p>📋 Questions: <span className="font-semibold text-gray-800">{test.questions ? test.questions.length : 0}</span></p>
                      <p>⏱ Duration: <span className="font-semibold text-gray-800">{test.duration_minutes || 60} mins</span></p>
                      {test.expires_at ? (
                        <p className={`text-xs font-semibold flex items-center gap-1 ${test.is_expired ? "text-red-600" : "text-amber-700"}`}>
                          <span>{test.is_expired ? "🔴 Expired:" : "⏳ Deadline:"}</span> 
                          <span>{new Date(test.expires_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">♾️ No Expiry Deadline</p>
                      )}
                      <p className="text-xs text-gray-400">Created: {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>

                    {/* Active Assignment Badges */}
                    {test.assignments && test.assignments.length > 0 && (
                      <div className="mb-3 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                        <p className="text-[11px] font-bold text-indigo-900 mb-1">Assigned Targets:</p>
                        <div className="flex flex-wrap gap-1">
                          {test.assignments.map((a, aIdx) => (
                            <span key={aIdx} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                              {[a.branch, a.year, a.section].filter(Boolean).join(" • ") || "Assigned"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🚩 QA Alert Status Banner */}
                    {hasAlerts && (
                      <div className="mb-4 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                          <FaFlag className="text-rose-600 text-xs" />
                          <span>{test.qa_alerts_count} Question Alert{test.qa_alerts_count > 1 ? "s" : ""} Reported</span>
                        </div>
                        <button
                          onClick={() => handleOpenQaModal(test)}
                          className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded shadow-sm cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/quiz/${tId}`} className="flex-1">
                        <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-primary border border-indigo-200 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition">
                          <FaEye className="text-xs" /> Preview
                        </button>
                      </Link>
                      
                      <button
                        onClick={() => handleOpenExpiryModal(test)}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        title="Update Expiry Deadline"
                      >
                        <FaClock className="text-xs" /> Deadline
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAssignModal(test)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <FaUserPlus className="text-xs" /> Assign
                      </button>

                      <button
                        onClick={() => handleOpenQaModal(test)}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="View Student QA Mistake Alerts"
                      >
                        <FaFlag className="text-xs text-rose-500" /> QA Alerts ({test.qa_alerts_count || 0})
                      </button>

                      <button
                        onClick={() => handleDelete(tId)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition"
                        title="Delete Test"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚩 QA ALERTS MODAL */}
      {qaModalTest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <FaFlag className="text-rose-600" /> Question QA Mistake Alerts
                </h3>
                <p className="text-xs text-gray-500 font-medium">{qaModalTest.title}</p>
              </div>
              <button
                onClick={() => setQaModalTest(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingAlerts ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading alerts...</div>
              ) : qaAlertsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-gray-100">
                  <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-2" />
                  <p className="font-bold text-gray-700 text-sm">No mistake alerts reported yet!</p>
                  <p className="text-xs text-gray-400 mt-1">When students click "QA Alert" during tests, reported mistakes will appear here.</p>
                </div>
              ) : (
                qaAlertsList.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-xl border transition ${
                      alert.status === "resolved" 
                        ? "bg-slate-50 border-gray-200 opacity-75" 
                        : "bg-rose-50/50 border-rose-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                          Question #{alert.question_number}
                        </span>
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          {alert.issue_type}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        alert.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {alert.status}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-100 mb-2 text-xs text-gray-700 font-mono">
                      <span className="text-gray-400 text-[10px] block mb-0.5">Question Text:</span>
                      "{alert.question_text}"
                    </div>

                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/60 mb-2">
                      <p className="text-xs font-bold text-amber-950">
                        {alert.formatted_message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Reported by: <strong>{alert.student_name}</strong> • {new Date(alert.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      
                      <div className="flex items-center gap-2">
                        {alert.status !== "resolved" ? (
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, "resolved")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <FaCheck className="text-[10px]" /> Mark Resolved
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, "pending")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            Re-open
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setQaModalTest(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🕒 UPDATE DEADLINE MODAL */}
      {expiryModalTest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaClock className="text-amber-500" /> Update Assessment Deadline
                </h3>
                <p className="text-xs text-gray-500 font-medium">{expiryModalTest.title}</p>
              </div>
              <button
                onClick={() => setExpiryModalTest(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveExpiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Expiry Date & Time (Local Time)
                </label>
                <input
                  type="datetime-local"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Students will not be able to attempt this assessment after the specified time.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setHours(d.getHours() + 24);
                    setEditExpiry(formatToDatetimeLocal(d.toISOString()));
                  }}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold py-1.5 rounded-lg border border-amber-200"
                >
                  +24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setEditExpiry(formatToDatetimeLocal(d.toISOString()));
                  }}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold py-1.5 rounded-lg border border-amber-200"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setEditExpiry("")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold py-1.5 rounded-lg border"
                >
                  Clear (No Expiry)
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpiryModalTest(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpiry}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs shadow"
                >
                  {savingExpiry ? "Saving..." : "Save Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎯 ASSIGN TARGET MODAL */}
      {assignModalTest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaUserPlus className="text-primary" /> Assign Assessment Target
                </h3>
                <p className="text-xs text-gray-500 font-medium">{assignModalTest.title}</p>
              </div>
              <button
                onClick={() => setAssignModalTest(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FaBuilding className="text-gray-400" /> Target Branch
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- All Branches --</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-gray-400" /> Academic Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- All Years --</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FaLayerGroup className="text-gray-400" /> Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- All Sections --</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalTest(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 bg-primary hover:bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs shadow"
                >
                  {assigning ? "Assigning..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyTests;