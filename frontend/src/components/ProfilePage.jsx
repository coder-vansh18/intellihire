import React, { useEffect, useState } from 'react';
import { FaEdit, FaSave, FaUserGraduate, FaIdCard, FaBuilding, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';
import { Link } from 'wouter';
import { API_URL } from '../config';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'Student',
    branch: '',
    year: '',
    section: '',
    roll_number: '',
    bio: ''
  });

  // Fetch current user details on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (storedUser) {
        setProfile({
          name: storedUser.name || '',
          email: storedUser.email || '',
          role: storedUser.role || 'Student',
          branch: storedUser.branch || '',
          year: storedUser.year || '',
          section: storedUser.section || '',
          roll_number: storedUser.roll_number || '',
          bio: storedUser.bio || 'Aspiring software developer'
        });
      }

      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProfile({
              name: data.name || '',
              email: data.email || '',
              role: data.role || 'Student',
              branch: data.branch || '',
              year: data.year || '',
              section: data.section || '',
              roll_number: data.roll_number || '',
              bio: data.bio || 'Aspiring software developer'
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
          role: updatedData.role || 'Student',
          branch: updatedData.branch || '',
          year: updatedData.year || '',
          section: updatedData.section || '',
          roll_number: updatedData.roll_number || '',
          bio: updatedData.bio || ''
        });
        localStorage.setItem("user", JSON.stringify(updatedData));
        alert('Profile updated successfully 🚀');
        setIsEditing(false);
      } else {
        alert(updatedData.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Server error while saving profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "IH";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>
        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary">Resources</Link></li>
        </ul>
        <Link to="/login">
          <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
            Logout
          </button>
        </Link>
      </nav>

      {/* Header */}
      <header className="text-center p-12 bg-white shadow-sm">
        <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-500">Manage academic details for targeted branch & section test assignments</p>
      </header>

      <section className="p-8 md:p-12 bg-gray-100 space-y-8">

        {/* Profile Header Summary Card */}
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary text-white flex items-center justify-center rounded-full text-2xl font-bold shadow-md">
              {getInitials(profile.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name || "Student Name"}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full capitalize">
                  {profile.role}
                </span>
                {profile.branch && (
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <FaBuilding className="text-[10px]" /> {profile.branch}
                  </span>
                )}
                {profile.year && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <FaCalendarAlt className="text-[10px]" /> {profile.year}
                  </span>
                )}
                {profile.section && (
                  <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <FaLayerGroup className="text-[10px]" /> {profile.section}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.roll_number && (
            <div className="bg-gray-50 px-4 py-2 rounded-lg border text-right">
              <p className="text-xs text-gray-400 font-semibold uppercase">Roll / ID Number</p>
              <p className="text-sm font-bold text-gray-800">{profile.roll_number}</p>
            </div>
          )}
        </div>

        {/* Edit Profile Form Container */}
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-8 pb-3 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Academic Profile</h2>
              <p className="text-xs text-gray-500">Provide branch, year, and section details for custom test routing.</p>
            </div>

            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full flex items-center gap-2 font-semibold shadow-md transition"
            >
              {isEditing ? <FaSave /> : <FaEdit />}
              {isEditing ? (loading ? 'Saving...' : 'Save') : 'Edit'}
            </button>
          </div>

          <div className="space-y-6">

            {/* Full Name */}
            <div className="relative">
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Full Name"
                className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                Full Name
              </label>
            </div>

            {/* Email */}
            <div className="relative">
              <input
                name="email"
                value={profile.email}
                disabled
                className="w-full p-3.5 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed outline-none font-medium"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-400 font-medium">
                Email Address
              </label>
            </div>

            {/* Roll Number / Student ID */}
            <div className="relative">
              <input
                name="roll_number"
                value={profile.roll_number}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. 2026CS101"
                className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                Roll Number / Student ID
              </label>
            </div>

            {/* Branch & Year Row */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Branch Selection */}
              <div className="relative">
                <select
                  name="branch"
                  value={profile.branch}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Comm.">Electronics & Communication (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
                <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                  Branch / Department
                </label>
              </div>

              {/* Year Selection */}
              <div className="relative">
                <select
                  name="year"
                  value={profile.year}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
                >
                  <option value="">Select Academic Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                  Academic Year
                </label>
              </div>

            </div>

            {/* Section Row */}
            <div className="relative">
              <select
                name="section"
                value={profile.section}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
              >
                <option value="">Select Section</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
                <option value="Section D">Section D</option>
              </select>
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                Class Section
              </label>
            </div>

            {/* Bio */}
            <div className="relative">
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
                placeholder="Aspiring software engineer..."
                className="w-full p-3.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-medium disabled:opacity-80"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500 font-medium">
                Bio
              </label>
            </div>

          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2026 IntelliHire. All rights reserved.</p>
        <p className="mt-4">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </p>
      </footer>
    </div>
  );
};

export default ProfilePage;