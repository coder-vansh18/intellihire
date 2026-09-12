import React, { useState, useEffect } from 'react';
import { FaBook, FaVideo, FaMap, FaSearch, FaArrowRight, FaUser, FaLaptop } from 'react-icons/fa';
import { Link } from 'wouter';

const ResourcesPage = () => {
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

  const resources = [
    { id: 1, title: 'JavaScript Mastery', type: 'article', description: 'Deep dive into ES6+ features.', icon: <FaBook />, author: 'John Doe' },
    { id: 2, title: 'React Hooks Tutorial', type: 'video', description: 'Learn hooks with examples.', icon: <FaVideo />, author: 'Jane Smith' },
    { id: 3, title: 'DSA Roadmap 2026', type: 'roadmap', description: 'Step-by-step DSA guide.', icon: <FaMap />, author: 'IntelliHire' },
    { id: 4, title: 'System Design Basics', type: 'article', description: 'Scalable architecture patterns.', icon: <FaBook />, author: 'Tech Lead' },
    { id: 5, title: 'Node.js Backend', type: 'video', description: 'Build APIs with Express.', icon: <FaVideo />, author: 'Dev Guru' },
    { id: 6, title: 'Full Stack Roadmap', type: 'roadmap', description: 'From frontend to deployment.', icon: <FaMap />, author: 'IntelliHire' },
  ];

  const filteredResources = filter === 'all' ? resources : resources.filter(r => r.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-20">
        <div className="text-2xl font-bold text-primary">
          <Link to={user && (user.role === "company" || user.role === "professor") ? "/company-dashboard" : "/"}>IntelliHire</Link>
        </div>
        <ul className="flex space-x-8 list-none">
          <li><Link to={user && (user.role === "company" || user.role === "professor") ? "/company-dashboard" : "/"} className="text-gray-700 hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="text-gray-700 hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="text-gray-700 hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="hover:text-primary font-bold text-primary">Resources</Link></li>
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
        <h1 className="text-4xl font-bold mb-4">Learning Resources</h1>
        <p className="text-lg">Curated articles, videos, and roadmaps to boost your skills.</p>
      </header>

      {/* Filters */}
      <section className="flex justify-center items-center p-8 bg-gray-100 gap-4">
        <FaSearch className="text-2xl text-primary" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-3 border border-gray-300 rounded-lg">
          <option value="all">All Resources</option>
          <option value="article">Articles</option>
          <option value="video">Videos</option>
          <option value="roadmap">Roadmaps</option>
        </select>
      </section>

      {/* Resources Grid */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
              <div className="text-4xl text-primary mb-4 flex justify-center">{resource.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
              <p className="text-gray-600 mb-2">{resource.description}</p>
              <p className="text-sm text-gray-500 mb-4">By {resource.author}</p>
              <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 mx-auto">
                Explore <FaArrowRight />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;