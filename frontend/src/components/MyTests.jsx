import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { API_URL } from "../config";
import { FaUserPlus, FaBuilding, FaCalendarAlt, FaLayerGroup, FaGlobe, FaLock, FaTrashAlt, FaEye, FaSyncAlt } from "react-icons/fa";

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal States
  const [assignModalTest, setAssignModalTest] = useState(null);
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [assigning, setAssigning] = useState(false);

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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setTests((prev) => prev.filter((test) => (test._id || test.id) !== id));
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to delete test");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting test");
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalTest) return;

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const tId = assignModalTest._id || assignModalTest.id;

      const res = await fetch(`${API_URL}/api/tests/${tId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          branch: targetBranch || null,
          year: targetYear || null,
          section: targetSection || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Test assigned successfully 🚀");
        setAssignModalTest(null);
        fetchTests();
      } else {
        alert(data.detail || "Failed to assign test");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning test");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-primary to-secondary font-inter">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white">My Created Assessments</h1>
          <p className="text-sm text-indigo-100 mt-1">Manage, assign, and track branch-wise & section-wise tests</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTests}
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition shadow"
            title="Refresh Tests"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
          <Link to="/create-test">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-full shadow transition text-sm">
              + Create New Test
            </button>
          </Link>
          <Link to="/company-dashboard">
            <button className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow hover:shadow-lg transition text-sm">
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
              return (
                <div key={tId} className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between hover:shadow-xl transition">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">{test.title}</h2>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        test.is_public ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {test.is_public ? <><FaGlobe className="text-[10px]"/> Public</> : <><FaLock className="text-[10px]"/> Private</>}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                      <p>📋 Questions: <span className="font-semibold text-gray-800">{test.questions ? test.questions.length : 0}</span></p>
                      <p>⏱ Duration: <span className="font-semibold text-gray-800">{test.duration_minutes || 60} mins</span></p>
                      <p className="text-xs text-gray-400">Created: {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>

                    {/* Active Assignment Badges */}
                    {test.assignments && test.assignments.length > 0 && (
                      <div className="mb-4 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
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
                  </div>

                  <div className="pt-4 border-t flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      <Link to={`/quiz/${tId}`}>
                        <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1">
                          <FaEye /> Preview
                        </button>
                      </Link>

                      <button
                        onClick={() => {
                          setAssignModalTest(test);
                          setTargetBranch("");
                          setTargetYear("");
                          setTargetSection("");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1 shadow-sm"
                      >
                        <FaUserPlus /> Assign Target
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(tId)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded transition text-xs"
                      title="Delete Test"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target Assignment Modal */}
      {assignModalTest && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Assign Assessment</h2>
            <p className="text-xs text-gray-500 mb-4">
              Select branch, year, or section target for <span className="font-bold text-indigo-600">"{assignModalTest.title}"</span>
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaBuilding className="text-indigo-500" /> Target Branch
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Branches</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Comm.">Electronics & Comm. (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaCalendarAlt className="text-indigo-500" /> Target Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FaLayerGroup className="text-indigo-500" /> Target Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="">All Sections</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAssignModalTest(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition disabled:opacity-60"
                >
                  {assigning ? "Assigning..." : "Confirm Assignment"}
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