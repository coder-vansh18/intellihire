import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FaUserCircle, FaPlusCircle, FaClipboardList, FaChartBar, FaGraduationCap, FaShieldAlt } from "react-icons/fa";

const CompanyDashboard = () => {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter">
      {/* 🔹 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="text-2xl font-black text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex items-center space-x-6 list-none text-sm font-semibold text-slate-600">
          <li><Link to="/company-dashboard" className="text-primary">Dashboard</Link></li>
          <li><Link to="/my-tests" className="hover:text-primary">My Tests</Link></li>
          <li><Link to="/results" className="hover:text-primary">Student Results</Link></li>
        </ul>

        {/* User Menu */}
        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full text-slate-800 font-semibold text-sm transition"
              >
                <FaUserCircle className="text-lg text-primary" />
                <span>{user.name}</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white shadow-xl rounded-xl p-2 border border-slate-100 z-50">
                  <Link to="/profile">
                    <p className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">Profile</p>
                  </Link>
                  <p
                    onClick={handleLogout}
                    className="p-2 hover:bg-rose-50 rounded-lg cursor-pointer text-rose-600 text-sm font-medium"
                  >
                    Logout
                  </p>
                </div>
              )}
            </>
          ) : (
            <Link to="/login">
              <button className="bg-primary hover:bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition">
                Login / Signup
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* 🔹 HEADER */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-14 px-8 text-center shadow-md">
        <div className="max-w-4xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <FaGraduationCap /> Professor & Recruiter Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-black">
            Welcome back, {user?.name || "Professor"} 👋
          </h1>
          <p className="text-sm md:text-base text-indigo-100 max-w-xl mx-auto">
            Create AI-proctored assessments, assign tests branch-wise, and monitor student performance analytics.
          </p>
        </div>
      </header>

      {/* 🔹 DASHBOARD CARDS */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Test */}
          <Link to="/create-test">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer text-center group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition">
                <FaPlusCircle />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Create Assessment</h2>
              <p className="text-xs text-slate-500">Upload Excel question banks and set branch/year rules</p>
            </div>
          </Link>

          {/* My Tests */}
          <Link to="/my-tests">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer text-center group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition">
                <FaClipboardList />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Manage Tests</h2>
              <p className="text-xs text-slate-500">View created assessments and manage batch assignments</p>
            </div>
          </Link>

          {/* Student Results */}
          <Link to="/results">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer text-center group border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition">
                <FaChartBar />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Student Results & Logs</h2>
              <p className="text-xs text-slate-500">Deep performance analytics, accuracy & anti-cheat logs</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 🔹 FOOTER */}
      <footer className="bg-white border-t py-6 text-center text-xs text-slate-500">
        <p>© 2026 IntelliHire Assessment Engine. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CompanyDashboard;