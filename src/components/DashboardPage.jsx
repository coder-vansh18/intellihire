import React, { useEffect, useState } from 'react';
import { FaChartLine, FaBook, FaTrophy, FaCalendar } from 'react-icons/fa';
import { Link } from 'wouter';
import { API_URL } from '../config';

const DashboardPage = () => {

  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    if (storedUser?._id) {
      fetch(`${API_URL}/api/results/student/${storedUser._id}`)
        .then(res => res.json())
        .then(data => setResults(data));
        
    }
  }, []);

  // 📊 CALCULATIONS
  const totalTests = results.length;

  const avgScore =
    totalTests > 0
      ? Math.round(
          results.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) /
            totalTests
        )
      : 0;

  const lastTestDate =
    results.length > 0
      ? new Date(results[0].createdAt).toLocaleDateString()
      : "N/A";

  const stats = [
    {
      title: 'Tests Taken',
      value: totalTests,
      icon: <FaBook />,
      color: 'bg-blue-500'
    },
    {
      title: 'Average Score',
      value: `${avgScore}%`,
      icon: <FaChartLine />,
      color: 'bg-green-500'
    },
    {
      title: 'Best Score',
      value:
        results.length > 0
          ? `${Math.max(...results.map(r => (r.score / r.total) * 100)).toFixed(0)}%`
          : "0%",
      icon: <FaTrophy />,
      color: 'bg-yellow-500'
    },
    {
      title: 'Last Test',
      value: lastTestDate,
      icon: <FaCalendar />,
      color: 'bg-purple-500'
    }
  ];

  // 🚪 LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>

        <ul className="flex space-x-8 list-none">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/quizzes">Quizzes</Link></li>
          <li><Link to="/placements">Placements</Link></li>
          <li><Link to="/resources">Resources</Link></li>
        </ul>

        {user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold text-primary">
              👤 {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Header */}
      <header className="text-center p-16 bg-white">
        <h1 className="text-4xl font-bold mb-4">Student Dashboard</h1>
        <p className="text-lg">Track your real performance and progress</p>
      </header>

      {/* Stats */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className={`text-4xl ${stat.color} text-white mb-4 p-4 rounded-full inline-block`}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
              <p className="text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity (REAL DATA) */}
      <section className="p-16 bg-gray-100">
        <h2 className="text-3xl font-bold mb-8 text-center">Recent Tests</h2>

        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">

          {results.length === 0 ? (
            <p className="text-center text-gray-500">
              No tests attempted yet 🚀
            </p>
          ) : (
            <div className="space-y-4">
              {results.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b">
                  <span>{r.testId?.title || "Test"}</span>
                  <span className="font-bold text-primary">
                    {Math.round((r.score / r.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2023 IntelliHire. All rights reserved.</p>
        <Link to="/" className="text-primary">Back to Home</Link>
      </footer>

    </div>
  );
};

export default DashboardPage;