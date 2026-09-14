import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { API_URL } from "../config";
import {
  FaShieldAlt, FaUserGraduate, FaChalkboardTeacher, FaUsers, 
  FaClipboardList, FaChartLine, FaCheckCircle, FaExclamationTriangle,
  FaSearch, FaFilter, FaPlus, FaTrashAlt, FaEdit, FaFileAlt, 
  FaTimes, FaSave, FaSignOutAlt, FaBuilding, FaCalendarAlt, 
  FaLayerGroup, FaIdCard, FaClock, FaCheck, FaTimesCircle, FaFlag
} from "react-icons/fa";

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("users"); // "users" | "tests" | "qa-alerts"
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [qaAlerts, setQaAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Form State for Add / Edit User
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    branch: "",
    year: "",
    section: "",
    roll_number: "",
    bio: ""
  });

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    };
  };

  const handleAuthError = () => {
    showToast("Admin session expired. Please log in again.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => {
      setLocation("/login");
    }, 1200);
  };

  // 1. Fetch Dashboard Analytics & Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [analyticsRes, usersRes, testsRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/analytics`, { headers }),
        fetch(`${API_URL}/api/admin/users`, { headers }),
        fetch(`${API_URL}/api/admin/tests`, { headers }),
        fetch(`${API_URL}/api/qa-alerts`, { headers })
      ]);

      if (analyticsRes.status === 401 || usersRes.status === 401 || testsRes.status === 401) {
        handleAuthError();
        return;
      }

      if (analyticsRes.status === 403) {
        showToast("Access denied: Organization Admin role required", "error");
        setLocation("/");
        return;
      }

      const [analyticsData, usersData, testsData, alertsData] = await Promise.all([
        analyticsRes.json(),
        usersRes.json(),
        testsRes.json(),
        alertsRes.json()
      ]);

      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTests(Array.isArray(testsData) ? testsData : []);
      setQaAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      showToast("Error loading organization data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser || storedUser === "undefined") {
      setLocation("/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      if (u.role === "company" || u.role === "professor") {
        setLocation("/company-dashboard");
        return;
      } else if (u.role === "student") {
        setLocation("/");
        return;
      }
    } catch {
      setLocation("/login");
      return;
    }

    fetchDashboardData();
  }, [setLocation]);

  // 2. User CRUD Actions
  const handleOpenAddUser = () => {
    setUserFormData({
      name: "",
      email: "",
      password: "password123",
      role: "student",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      section: "Section A",
      roll_number: "",
      bio: ""
    });
    setShowAddUserModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      showToast("Name, email, and password are required", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userFormData)
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        showToast(`User ${data.name} added successfully! 🚀`);
        setShowAddUserModal(false);
        fetchDashboardData();
      } else {
        showToast(data.detail || "Failed to create user", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error creating user", "error");
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "student",
      branch: user.branch || "",
      year: user.year || "",
      section: user.section || "",
      roll_number: user.roll_number || "",
      bio: user.bio || ""
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = { ...userFormData };
      if (!payload.password) delete payload.password; // Don't overwrite if blank

      const res = await fetch(`${API_URL}/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        showToast(`User ${data.name} updated successfully! ✅`);
        setEditingUser(null);
        fetchDashboardData();
      } else {
        showToast(data.detail || "Failed to update user", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating user", "error");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name} (${user.email})? This will delete all associated test results and progress.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        showToast("User deleted successfully 🗑️");
        fetchDashboardData();
      } else {
        showToast(data.detail || "Failed to delete user", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting user", "error");
    }
  };

  // 3. View Individual Performance Dossier
  const handleViewIndividualReport = async (userId) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/report`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        handleAuthError();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSelectedStudentReport(data);
      } else {
        showToast(data.detail || "Could not load candidate report", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading candidate report", "error");
    } finally {
      setLoadingReport(false);
    }
  };

  // 4. Delete Assessment (Global Admin)
  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Delete assessment "${testTitle}" across the entire organization?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/tests/${testId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        handleAuthError();
        return;
      }
      if (res.ok) {
        showToast(`Assessment "${testTitle}" deleted 🗑️`);
        fetchDashboardData();
      } else {
        showToast("Failed to delete assessment", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting assessment", "error");
    }
  };

  // 5. Update QA Alert Status
  const handleUpdateAlertStatus = async (alertId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/qa-alerts/${alertId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.status === 401) {
        handleAuthError();
        return;
      }
      if (res.ok) {
        setQaAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
        );
        showToast(`QA alert marked as ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/login");
  };

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "student" && u.role === "student") ||
      (roleFilter === "professor" && (u.role === "company" || u.role === "professor")) ||
      (roleFilter === "admin" && u.role === "admin");

    const matchesBranch = branchFilter === "all" || u.branch === branchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-inter flex flex-col justify-between">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white ${
            toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}>
            {toastMessage.type === "error" ? <FaTimes /> : <FaCheck />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-slate-950/80 backdrop-blur-md shadow-xl sticky top-0 z-20 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <FaShieldAlt className="text-xl" />
          </div>
          <Link to="/admin-dashboard">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent cursor-pointer">
              IntelliHire Admin
            </span>
          </Link>
          <span className="ml-2 text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
            Master Oversight
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile">
            <button className="text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700">
              <FaShieldAlt className="text-indigo-400" /> Admin Profile
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">

        {/* Organization Information Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-6 rounded-3xl border border-indigo-700/50 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-0.5 rounded-full">
                Institutional Administrative Portal
              </span>
              {analytics?.organization_code && (
                <span className="text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  Code: {analytics.organization_code}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {analytics?.organization_name || "Institutional Assessment Portal"}
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              Authorized Institutional Domain: <strong className="font-mono text-white">@{analytics?.organization_domain || "skit.ac.in"}</strong> • All provisioned accounts are strictly scoped to this institution.
            </p>
          </div>
          <button
            onClick={handleOpenAddUser}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FaPlus /> + Provision New Account
          </button>
        </div>
        
        {/* KPI Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="flex justify-between items-center text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
              <FaUserGraduate className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{analytics?.total_students ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Registered Candidate Profiles</p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="flex justify-between items-center text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Faculty & Instructors</span>
              <FaChalkboardTeacher className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{analytics?.total_professors ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Assessment Creators</p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="flex justify-between items-center text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Submissions</span>
              <FaClipboardList className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{analytics?.total_submissions ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Avg Accuracy: {analytics?.average_organization_accuracy ?? 0}%</p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="flex justify-between items-center text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Flagged Sessions</span>
              <FaExclamationTriangle className="text-xl" />
            </div>
            <p className="text-3xl font-black text-white">{analytics?.total_flagged_sessions ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">QA Alerts: {analytics?.total_qa_alerts ?? 0}</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/80 space-x-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 text-sm font-bold rounded-t-2xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-slate-800 text-indigo-400 border-t-2 border-indigo-500 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaUsers /> User Management ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("tests")}
            className={`px-5 py-3 text-sm font-bold rounded-t-2xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "tests"
                ? "bg-slate-800 text-indigo-400 border-t-2 border-indigo-500 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaClipboardList /> Assessment Oversight ({tests.length})
          </button>

          <button
            onClick={() => setActiveTab("qa-alerts")}
            className={`px-5 py-3 text-sm font-bold rounded-t-2xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "qa-alerts"
                ? "bg-slate-800 text-indigo-400 border-t-2 border-indigo-500 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaFlag className="text-rose-400" /> Question QA Alerts ({qaAlerts.length})
          </button>
        </div>

        {/* ---------------- TAB 1: USER MANAGEMENT ---------------- */}
        {activeTab === "users" && (
          <section className="space-y-6">
            
            {/* Control Bar (Search, Filters & Add User Button) */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-lg">
              
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, roll number..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="professor">Professors / Faculty</option>
                  <option value="admin">Administrators</option>
                </select>

                {/* Branch Filter */}
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Branches</option>
                  <option value="Computer Science & Engineering">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Comm.</option>
                  <option value="Electrical Engineering">Electrical Eng.</option>
                  <option value="Mechanical Engineering">Mechanical Eng.</option>
                  <option value="Civil Engineering">Civil Eng.</option>
                </select>
              </div>

              {/* Add User Button */}
              <button
                onClick={handleOpenAddUser}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <FaPlus /> + Add New User
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Branch / Academic Info</th>
                      <th className="py-3.5 px-4">Activity & Stats</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400">Loading organization users...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400">No users found matching current filters.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isStudent = u.role === "student";
                        const isProf = u.role === "company" || u.role === "professor";
                        return (
                          <tr key={u.id} className="hover:bg-slate-750/50 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src="/assets/avatar.png"
                                  alt="Avatar"
                                  className="w-9 h-9 rounded-full object-cover border border-slate-600 shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=" + u.name;
                                  }}
                                />
                                <div>
                                  <p className="font-bold text-white text-sm">{u.name}</p>
                                  <p className="text-[11px] text-slate-400">{u.email}</p>
                                  {u.roll_number && (
                                    <p className="text-[10px] text-indigo-400 font-mono">ID: {u.roll_number}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                u.role === "admin"
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                  : isProf
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                              }`}>
                                {u.role === "company" ? "Professor" : u.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5 text-[11px]">
                                <p className="text-slate-200 font-semibold">{u.branch || "General / None"}</p>
                                {isStudent && (u.year || u.section) && (
                                  <p className="text-slate-400">{[u.year, u.section].filter(Boolean).join(" • ")}</p>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isStudent ? (
                                <div>
                                  <p className="font-bold text-slate-200">{u.tests_attempted} Tests Attempted</p>
                                  <p className="text-[11px] text-emerald-400 font-semibold">Avg: {u.average_score_percent}%</p>
                                </div>
                              ) : isProf ? (
                                <div>
                                  <p className="font-bold text-slate-200">{u.tests_created} Created Tests</p>
                                  <p className="text-[11px] text-purple-400">Faculty Lead</p>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Super Admin</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isStudent && (
                                  <button
                                    onClick={() => handleViewIndividualReport(u.id)}
                                    className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                                    title="View Individual Candidate Performance Dossier"
                                  >
                                    <FaFileAlt /> Report
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-2 rounded-lg transition cursor-pointer"
                                  title="Edit User"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="bg-rose-900/40 hover:bg-rose-600 text-rose-300 hover:text-white p-2 rounded-lg transition cursor-pointer"
                                  title="Delete User"
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- TAB 2: ASSESSMENT OVERSIGHT ---------------- */}
        {activeTab === "tests" && (
          <section className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((t) => (
                <div key={t.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-base leading-snug">{t.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        t.is_public ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {t.is_public ? "Public" : "Private"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 mb-4">
                      <p>👤 Created by: <span className="text-slate-200 font-semibold">{t.creator_name}</span></p>
                      <p>📋 Questions: <span className="text-slate-200 font-semibold">{t.total_questions}</span></p>
                      <p>⏱ Duration: <span className="text-slate-200 font-semibold">{t.duration_minutes} mins</span></p>
                      <p>📊 Submissions: <span className="text-emerald-400 font-bold">{t.total_submissions}</span></p>
                      {t.expires_at ? (
                        <p className={`font-semibold ${t.is_expired ? "text-rose-400" : "text-amber-400"}`}>
                          {t.is_expired ? "🔴 Expired: " : "⏳ Deadline: "}
                          {new Date(t.expires_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      ) : (
                        <p className="text-slate-500">♾️ No Expiry</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                    <Link to={`/quiz/${t.id}`}>
                      <button className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer">
                        Preview
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteTest(t.id, t.title)}
                      className="bg-rose-900/40 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaTrashAlt /> Delete Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- TAB 3: QA ALERTS OVERSIGHT ---------------- */}
        {activeTab === "qa-alerts" && (
          <section className="space-y-4">
            {qaAlerts.length === 0 ? (
              <div className="bg-slate-800/80 p-12 rounded-2xl border border-slate-700/60 text-center text-slate-400">
                <FaCheckCircle className="text-emerald-400 text-4xl mx-auto mb-3" />
                <p className="font-bold text-white text-base">No active QA alerts reported!</p>
                <p className="text-xs text-slate-400 mt-1">All question evaluations across all tests are clean.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {qaAlerts.map((a) => (
                  <div key={a.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          {a.test_title} • Question #{a.question_number}
                        </span>
                        <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-2 py-0.5 rounded-md">
                          {a.issue_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          a.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {a.status}
                        </span>
                      </div>

                      <p className="text-xs italic text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                        "{a.question_text}"
                      </p>

                      <p className="text-xs font-bold text-amber-300">
                        {a.formatted_message}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Reported by: <strong>{a.student_name}</strong> • {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.status !== "resolved" ? (
                        <button
                          onClick={() => handleUpdateAlertStatus(a.id, "resolved")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FaCheck /> Mark Resolved
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateAlertStatus(a.id, "pending")}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          Re-open
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* ---------------- MODAL 1: ADD USER MODAL ---------------- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaPlus className="text-indigo-400" /> Provision Account for {analytics?.organization_name || "Organization"}
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white p-1">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-[11px]">
                🔒 <strong>Enforced Domain Policy:</strong> Accounts must use the official institutional domain <strong className="text-white font-mono">@{analytics?.organization_domain || "skit.ac.in"}</strong>.
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g. Priyanshu Verma"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Institutional Email Address * <span className="text-indigo-400 font-mono">(@{analytics?.organization_domain || "domain"})</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder={`e.g. b241187@${analytics?.organization_domain || "skit.ac.in"}`}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Initial Temporary Password *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="e.g. Skit@2026"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Shared initial password. Candidate will change on first login.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Role *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="company">Professor / Faculty</option>
                    <option value="admin">Organization Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Branch / Department</label>
                  <select
                    value={userFormData.branch}
                    onChange={(e) => setUserFormData({ ...userFormData, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Academic Year</label>
                  <select
                    value={userFormData.year}
                    onChange={(e) => setUserFormData({ ...userFormData, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Faculty">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Section</label>
                  <select
                    value={userFormData.section}
                    onChange={(e) => setUserFormData({ ...userFormData, section: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Roll / Staff ID</label>
                  <input
                    type="text"
                    value={userFormData.roll_number}
                    onChange={(e) => setUserFormData({ ...userFormData, roll_number: e.target.value })}
                    placeholder="e.g. 2026CS501"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: EDIT USER MODAL ---------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaEdit className="text-indigo-400" /> Edit User: {editingUser.name}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white p-1">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Reset Password (Optional)</label>
                  <input
                    type="text"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="company">Professor / Faculty</option>
                    <option value="admin">Organization Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Branch / Department</label>
                  <select
                    value={userFormData.branch}
                    onChange={(e) => setUserFormData({ ...userFormData, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={userFormData.year}
                    onChange={(e) => setUserFormData({ ...userFormData, year: e.target.value })}
                    placeholder="e.g. 3rd Year"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Section</label>
                  <input
                    type="text"
                    value={userFormData.section}
                    onChange={(e) => setUserFormData({ ...userFormData, section: e.target.value })}
                    placeholder="e.g. Section A"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Roll / Staff ID</label>
                  <input
                    type="text"
                    value={userFormData.roll_number}
                    onChange={(e) => setUserFormData({ ...userFormData, roll_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: INDIVIDUAL STUDENT REPORT CARD DOSSIER ---------------- */}
      {selectedStudentReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  Candidate Evaluation Dossier
                </span>
                <h2 className="text-2xl font-black text-white mt-1">{selectedStudentReport.user.name}</h2>
                <p className="text-xs text-slate-400">{selectedStudentReport.user.email} • ID: {selectedStudentReport.user.roll_number || "N/A"}</p>
              </div>
              <button
                onClick={() => setSelectedStudentReport(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-700/50"
              >
                <FaTimes />
              </button>
            </div>

            {/* Candidate Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tests Taken</p>
                <p className="text-2xl font-black text-white mt-0.5">{selectedStudentReport.total_tests_attempted}</p>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Accuracy</p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{selectedStudentReport.average_score_percent}%</p>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Clean Attempts</p>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">{selectedStudentReport.total_clean_attempts}</p>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Flagged / DQ</p>
                <p className="text-2xl font-black text-rose-400 mt-0.5">{selectedStudentReport.total_disqualified_attempts}</p>
              </div>
            </div>

            {/* Test Attempts Breakdown Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Attempt History & Proctoring Audit Trail</h3>
              {selectedStudentReport.attempts.length === 0 ? (
                <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-700 text-center text-slate-400 text-xs">
                  This candidate has not attempted any assessments yet.
                </div>
              ) : (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Assessment Title</th>
                        <th className="py-3 px-4">Score & %</th>
                        <th className="py-3 px-4">Proctor Audit</th>
                        <th className="py-3 px-4">Time Taken</th>
                        <th className="py-3 px-4 text-right">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedStudentReport.attempts.map((att) => (
                        <tr key={att.result_id} className="hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-bold text-white">{att.test_title}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-400">{att.score} / {att.total}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5">({att.accuracy}%)</span>
                          </td>
                          <td className="py-3 px-4">
                            {att.disqualified ? (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                <FaTimesCircle /> Disqualified (Tab Switches: {att.tab_switch_count})
                              </span>
                            ) : att.tab_switch_count > 0 ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                <FaExclamationTriangle /> {att.tab_switch_count} Tab Warning{att.tab_switch_count > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                <FaCheckCircle /> Clean Session
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {Math.floor(att.duration_seconds / 60)}m {att.duration_seconds % 60}s
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400">
                            {new Date(att.submitted_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedStudentReport(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-5 text-slate-500 text-xs border-t border-slate-800">
        © 2026 IntelliHire AI Proctored Assessment Platform • Master Administrative Oversight
      </footer>
    </div>
  );
};

export default AdminDashboard;
