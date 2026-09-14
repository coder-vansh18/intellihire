import React, { useEffect, useState } from 'react';
import { 
  FaEdit, FaSave, FaUserGraduate, FaIdCard, FaBuilding, 
  FaCalendarAlt, FaLayerGroup, FaChalkboardTeacher, FaLaptop, 
  FaPlusCircle, FaListAlt, FaChartBar, FaCheck, FaTimes, FaSignOutAlt, FaShieldAlt 
} from 'react-icons/fa';
import { Link, useLocation } from 'wouter';
import { API_URL } from '../config';

const ProfilePage = () => {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored && stored !== "undefined") {
        const u = JSON.parse(stored);
        return {
          name: u.name || '',
          email: u.email || '',
          role: u.role || 'student',
          branch: u.branch || '',
          year: u.year || '',
          section: u.section || '',
          roll_number: u.roll_number || '',
          bio: u.bio || ''
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: '',
      email: '',
      role: 'student',
      branch: '',
      year: '',
      section: '',
      roll_number: '',
      bio: ''
    };
  });

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSuperAdmin = profile.role === 'super_admin';
  const isAdmin = profile.role === 'admin';
  const isProfessor = profile.role === 'company' || profile.role === 'professor';

  // Fetch current user details on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProfile({
              name: data.name || '',
              email: data.email || '',
              role: data.role || storedUser.role || 'student',
              branch: data.branch || '',
              year: data.year || '',
              section: data.section || '',
              roll_number: data.roll_number || '',
              bio: data.bio || ''
            });
            localStorage.setItem("user", JSON.stringify(data));
          }
        } catch (err) {
          console.error("Failed to load user profile", err);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          name: profile.name,
          branch: profile.branch,
          year: profile.year,
          section: profile.section,
          roll_number: profile.roll_number,
          bio: profile.bio
        })
      });

      const updatedData = await res.json();
      if (res.ok) {
        setProfile({
          name: updatedData.name || '',
          email: updatedData.email || '',
          role: updatedData.role || profile.role,
          branch: updatedData.branch || '',
          year: updatedData.year || '',
          section: updatedData.section || '',
          roll_number: updatedData.roll_number || '',
          bio: updatedData.bio || ''
        });
        localStorage.setItem("user", JSON.stringify({ ...updatedData, role: updatedData.role || profile.role }));
        showToast('Profile details updated successfully! 🚀', 'success');
        setIsEditing(false);
      } else {
        showToast(updatedData.detail || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while saving profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter flex flex-col justify-between">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}>
            {toastMessage.type === 'error' ? <FaTimes /> : <FaCheck />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Role-Specific Dynamic Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-20 border-b border-gray-100">
        <div className="text-2xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          <Link to={isSuperAdmin ? "/super-admin-dashboard" : isAdmin ? "/admin-dashboard" : isProfessor ? "/company-dashboard" : "/"}>IntelliHire</Link>
        </div>

        {/* Dynamic Navigation Menu by Role */}
        {isSuperAdmin ? (
          <ul className="hidden md:flex space-x-6 list-none font-medium text-sm text-gray-600">
            <li><Link to="/super-admin-dashboard" className="hover:text-primary transition font-bold">Institutions & Orgs</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition font-bold text-primary">Super Admin Profile</Link></li>
          </ul>
        ) : isAdmin ? (
          <ul className="hidden md:flex space-x-6 list-none font-medium text-sm text-gray-600">
            <li><Link to="/admin-dashboard" className="hover:text-primary transition font-bold">Admin Dashboard</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition font-bold text-primary">Admin Profile</Link></li>
          </ul>
        ) : isProfessor ? (
          <ul className="hidden md:flex space-x-6 list-none font-medium text-sm text-gray-600">
            <li><Link to="/company-dashboard" className="hover:text-primary transition">Dashboard</Link></li>
            <li><Link to="/create-test" className="hover:text-primary transition">+ Create Test</Link></li>
            <li><Link to="/my-tests" className="hover:text-primary transition">Manage Tests</Link></li>
            <li><Link to="/results" className="hover:text-primary transition">Results</Link></li>
          </ul>
        ) : (
          /* Student Navigation Menu */
          <ul className="hidden md:flex space-x-6 list-none font-medium text-sm text-gray-600">
            <li><Link to="/" className="hover:text-primary transition">Home</Link></li>
            <li><Link to="/quizzes" className="hover:text-primary transition">Quizzes</Link></li>
            <li><Link to="/placements" className="hover:text-primary transition">Placements</Link></li>
            <li><Link to="/resources" className="hover:text-primary transition">Resources</Link></li>
          </ul>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <FaSignOutAlt className="text-xs" /> Logout
          </button>
        </div>
      </nav>

      {/* Profile Container */}
      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-6 flex-1">

        {/* Profile Card Summary Banner */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <img
              src="/assets/avatar.png"
              alt="Profile Avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-primary shadow-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=user";
              }}
            />
            <div>
              <h2 className="text-2xl font-black text-gray-900">{profile.name || (isSuperAdmin ? "Super Admin" : isProfessor ? "Professor Name" : "Student Name")}</h2>
              <p className="text-sm text-gray-500 font-medium">{profile.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${
                  isSuperAdmin
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : isAdmin
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : isProfessor 
                    ? "bg-purple-100 text-purple-800 border border-purple-200" 
                    : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                }`}>
                  {isSuperAdmin ? <FaShieldAlt className="text-amber-600" /> : isAdmin ? <FaShieldAlt /> : isProfessor ? <FaChalkboardTeacher /> : <FaUserGraduate />}
                  <span>{isSuperAdmin ? "Platform Super Administrator" : isAdmin ? "Organization Administrator" : isProfessor ? "Professor / Recruiter" : "Student"}</span>
                </span>

                {profile.branch && (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-200">
                    <FaBuilding className="text-[10px]" /> {profile.branch}
                  </span>
                )}

                {profile.year && (
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                    <FaCalendarAlt className="text-[10px]" /> {profile.year}
                  </span>
                )}

                {profile.section && (
                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1 border border-blue-200">
                    <FaLayerGroup className="text-[10px]" /> {profile.section}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Pill Button */}
          <Link to={isSuperAdmin ? "/super-admin-dashboard" : isAdmin ? "/admin-dashboard" : isProfessor ? "/company-dashboard" : "/dashboard"}>
            <button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer">
              <FaLaptop /> {isSuperAdmin ? "Super Admin Portal" : isAdmin ? "Admin Dashboard" : isProfessor ? "Professor Dashboard" : "Student Dashboard"}
            </button>
          </Link>
        </div>

        {/* Editable Form Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {isProfessor ? "Faculty & Instructor Settings" : "Student Academic Details"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isProfessor 
                  ? "Manage your faculty profile, department name, and evaluation credentials." 
                  : "Keep your branch, year, and section updated to receive customized test assignments."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md transition cursor-pointer"
            >
              {isEditing ? <FaSave /> : <FaEdit />}
              {isEditing ? (loading ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                />
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900">
                  {profile.name || "Not set"}
                </p>
              )}
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address (Registered)</label>
              <p className="p-3 bg-slate-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                {profile.email}
              </p>
            </div>

            {/* Department / Branch */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isProfessor ? "Department / Organization" : "Academic Branch / Major"}
              </label>
              {isEditing ? (
                <select
                  name="branch"
                  value={profile.branch}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                >
                  <option value="">-- Select Department / Branch --</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900">
                  {profile.branch || "Not specified"}
                </p>
              )}
            </div>

            {/* Year / Role Designation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isProfessor ? "Faculty Designation / Cell" : "Academic Year"}
              </label>
              {isEditing ? (
                isProfessor ? (
                  <input
                    type="text"
                    name="year"
                    value={profile.year}
                    onChange={handleChange}
                    placeholder="e.g. Associate Professor / Placement Cell Lead"
                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                  />
                ) : (
                  <select
                    name="year"
                    value={profile.year}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                  >
                    <option value="">-- Select Academic Year --</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                )
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900">
                  {profile.year || "Not specified"}
                </p>
              )}
            </div>

            {/* Section / Team */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isProfessor ? "Faculty Team / Section Lead" : "Class Section"}
              </label>
              {isEditing ? (
                isProfessor ? (
                  <input
                    type="text"
                    name="section"
                    value={profile.section}
                    onChange={handleChange}
                    placeholder="e.g. Assessment Committee"
                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                  />
                ) : (
                  <select
                    name="section"
                    value={profile.section}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                  >
                    <option value="">-- Select Section --</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                  </select>
                )
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900">
                  {profile.section || "Not specified"}
                </p>
              )}
            </div>

            {/* Roll Number / Staff ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isProfessor ? "Faculty / Staff ID" : "College Roll Number"}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="roll_number"
                  value={profile.roll_number}
                  onChange={handleChange}
                  placeholder={isProfessor ? "e.g. FAC-2026-CS01" : "e.g. 2026CS101"}
                  className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                />
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900">
                  {profile.roll_number || "Not specified"}
                </p>
              )}
            </div>

            {/* Bio / Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isProfessor ? "Faculty Bio & Evaluation Focus" : "Student Bio & Career Goals"}
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Share a brief overview..."
                  className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                ></textarea>
              ) : (
                <p className="p-3 bg-slate-50 border border-gray-100 rounded-xl text-sm text-gray-700 leading-relaxed">
                  {profile.bio || (isProfessor ? "Assessment and evaluation faculty lead." : "Aspiring software engineer.")}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Quick Portal Navigation Links */}
        <div className="bg-white/95 p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-indigo-50 text-primary text-xl">
              {isProfessor ? <FaChalkboardTeacher /> : <FaUserGraduate />}
            </span>
            <div>
              <p className="text-sm font-black text-gray-900">
                {isProfessor ? "Professor & Recruiter Portal" : "Student Learning Portal"}
              </p>
              <p className="text-xs text-gray-500">
                {isProfessor 
                  ? "Access test creation, deadline management, and candidate proctor logs." 
                  : "Access active assessments, view your completed scorecard and practice tests."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isProfessor ? (
              <>
                <Link to="/create-test">
                  <button className="bg-primary hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
                    <FaPlusCircle /> Create Test
                  </button>
                </Link>
                <Link to="/my-tests">
                  <button className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
                    <FaListAlt /> Manage Tests
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/quizzes">
                  <button className="bg-primary hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
                    <FaListAlt /> Available Tests
                  </button>
                </Link>
                <Link to="/dashboard">
                  <button className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
                    <FaChartBar /> My Dashboard
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-white/80 text-xs font-medium">
        © 2026 IntelliHire AI Proctored Assessment Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default ProfilePage;