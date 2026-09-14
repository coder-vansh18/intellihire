import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FaUserCircle, FaPlusCircle, FaClipboardList, FaChartBar, FaGraduationCap, FaShieldAlt } from "react-icons/fa";

const CompanyDashboard = () => {
  const [, setLocation] = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser || storedUser === "undefined") {
      setLocation("/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.role === "admin") {
        setLocation("/admin-dashboard");
      } else if (u.role === "student") {
        setLocation("/");
      }
    } catch (err) {
      console.error("Invalid user in CompanyDashboard:", err);
      setLocation("/login");
    }
  }, [setLocation]);

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
          <Link to="/company-dashboard">IntelliHire</Link>
        </div>

        <ul className="flex items-center space-x-6 list-none text-sm font-semibold text-slate-600">
          <li><Link to="/company-dashboard" className="text-primary font-bold">Dashboard</Link></li>
          <li><Link to="/create-test" className="hover:text-primary transition">+ Create Test</Link></li>
          <li><Link to="/my-tests" className="hover:text-primary transition">My Tests</Link></li>
          <li><Link to="/results" className="hover:text-primary transition">Student Results</Link></li>
        </ul>

        {/* User Menu */}
        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-primary focus:outline-none transition cursor-pointer"
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
              <button className="bg-primary hover:bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition cursor-pointer">
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
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-200 border border-slate-100 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-16 h-16 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition">
                <FaPlusCircle />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition">
                Create Assessment
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">
                Upload Excel question banks and set branch/year rules
              </p>
            </div>
          </Link>

          {/* Manage Tests */}
          <Link to="/my-tests">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-200 border border-slate-100 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition">
                <FaClipboardList />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">
                Manage Tests
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">
                View created assessments and manage batch assignments
              </p>
            </div>
          </Link>

          {/* Student Results */}
          <Link to="/results">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-200 border border-slate-100 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition">
                <FaChartBar />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition">
                Student Results & Logs
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">
                Deep performance analytics, accuracy & anti-cheat logs
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 🔹 FOOTER */}
      <footer className="text-center py-8 text-xs text-slate-400 border-t bg-white">
        © 2026 IntelliHire Assessment Engine. All rights reserved.
      </footer>
    </div>
  );
};

export default CompanyDashboard;