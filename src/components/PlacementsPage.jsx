import React, { useState, useEffect } from 'react';
import { FaBuilding, FaCalendar, FaFilter, FaPlay } from 'react-icons/fa';
import { Link } from 'wouter';

const PlacementsPage = () => {
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);

  // ✅ Check login
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ Improved placement data
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
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="hover:text-primary">Placements</Link></li>
        </ul>

        {/* ✅ Auth UI */}
        {user ? (
          <span className="font-semibold text-primary">👤 {user.name}</span>
        ) : (
          <Link to="/login">
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">
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
              className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl hover:scale-105 transition duration-300"
            >

              <div className="text-4xl text-primary mb-4">
                {placement.icon}
              </div>

              <h3 className="text-xl font-semibold mb-2">
                {placement.title}
              </h3>

              <p className="text-gray-600 mb-4">
                {placement.description}
              </p>

              {/* Test Info */}
              <div className="text-sm mb-4">
                <p className="text-gray-700">📊 Questions: {placement.questions}</p>
                <p className="text-gray-700">⏱ Duration: {placement.duration}</p>
                <p className="font-bold text-primary">Company: {placement.company}</p>
                <p className="text-gray-500">📅 {placement.date}</p>
              </div>

              {/* Start Button */}
              <Link to={`/placement/${placement.id}`}>
                <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto">
                  <FaPlay /> Start Test
                </button>
              </Link>

            </div>
          ))}

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2026 IntelliHire. All rights reserved.</p>
        <Link to="/" className="text-primary">Back to Home</Link>
      </footer>
    </div>
  );
};

export default PlacementsPage;