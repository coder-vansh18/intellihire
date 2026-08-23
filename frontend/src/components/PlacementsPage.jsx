import React, { useState, useEffect } from 'react';
import { FaBuilding, FaCalendar, FaFilter, FaPlay, FaUser, FaLaptop } from 'react-icons/fa';
import { Link } from 'wouter';

const PlacementsPage = () => {
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const placements = [
    {
      id: 1,
      title: 'Google Placement Test',
      company: 'Tech',
      description: 'Aptitude + Coding + System Design',
      date: '2026-04-10',
      questions: 20,
      duration: '20 min',
      icon: <FaBuilding />
    },
    {
      id: 2,
      title: 'Amazon Online Assessment',
      company: 'Tech',
      description: 'DSA + Debugging + MCQs',
      date: '2026-04-15',
      questions: 25,
      duration: '25 min',
      icon: <FaBuilding />
    },
    {
      id: 3,
      title: 'Finance Aptitude Test',
      company: 'Finance',
      description: 'Quant + Reasoning + Data Interpretation',
      date: '2026-04-20',
      questions: 18,
      duration: '18 min',
      icon: <FaCalendar />
    },
  ];

  const filteredPlacements =
    filter === 'all'
      ? placements
      : placements.filter(p => p.company === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-20">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary font-bold text-primary">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary">Resources</Link></li>
        </ul>

        {/* Auth UI with Avatar */}
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
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                </div>

                <Link to="/profile">
                  <div className="px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaUser className="text-gray-400 text-xs" /> Profile
                  </div>
                </Link>

                <Link to={user.role === "company" || user.role === "professor" ? "/company-dashboard" : "/dashboard"}>
                  <div className="px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FaLaptop className="text-gray-400 text-xs" /> Dashboard
                  </div>
                </Link>

                <div
                  onClick={handleLogout}
                  className="px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-semibold cursor-pointer border-t border-gray-100"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full font-semibold text-sm">
              Login / Signup
            </button>
          </Link>
        )}
      </nav>

      {/* Header */}
      <header className="text-center p-16 bg-white shadow-md">
        <h1 className="text-4xl font-bold mb-4">Placement Preparation</h1>
        <p className="text-lg">Attempt real company mock tests with exam-like interface</p>
      </header>

      {/* Filter */}
      <section className="flex justify-center items-center p-8 bg-gray-100 gap-4">
        <FaFilter className="text-2xl text-primary" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Companies</option>
          <option value="Tech">Tech</option>
          <option value="Finance">Finance</option>
        </select>
      </section>

      {/* Cards */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredPlacements.map((placement) => (
            <div
              key={placement.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-center flex flex-col justify-between"
            >
              <div>
                <div className="text-4xl text-primary mb-4 flex justify-center">
                  {placement.icon}
                </div>

                <h3 className="text-xl font-semibold mb-2">{placement.title}</h3>
                <p className="text-gray-600 mb-2">{placement.description}</p>
                <p className="text-sm text-gray-500 mb-2">📅 Date: {placement.date}</p>
                <p className="text-sm text-gray-500 mb-4">
                  ❓ {placement.questions} Questions | ⏱ {placement.duration}
                </p>
              </div>

              {/* ✅ Real test routing */}
              <Link to={`/quizzes`}>
                <button className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition font-semibold">
                  <FaPlay className="text-xs" /> View Assessments
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default PlacementsPage;