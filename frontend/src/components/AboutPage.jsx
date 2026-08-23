import React, { useState, useEffect } from 'react';
import { FaRocket, FaUsers, FaLightbulb, FaUser, FaLaptop } from 'react-icons/fa';
import { Link } from 'wouter';

const AboutPage = () => {
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

  const features = [
    { icon: <FaRocket />, title: 'Fast Learning', description: 'Accelerate your skills with interactive quizzes.' },
    { icon: <FaUsers />, title: 'Community', description: 'Connect with students and companies.' },
    { icon: <FaLightbulb />, title: 'Innovation', description: 'Stay updated with latest tech trends.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-20">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>
        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="text-gray-700 hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="text-gray-700 hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="text-gray-700 hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="text-gray-700 hover:text-primary">Resources</Link></li>
        </ul>

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
      <header className="text-center p-16 bg-white">
        <h1 className="text-4xl font-bold mb-4">About IntelliHire</h1>
        <p className="text-lg">Empowering students to achieve their career goals.</p>
      </header>

      {/* Features */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
              <div className="text-4xl text-primary mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© {new Date().getFullYear()} IntelliHire. All rights reserved.</p>
        <p className="mt-4">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </p>
      </footer>
    </div>
  );
};

export default AboutPage;