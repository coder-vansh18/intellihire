import React, { useState } from 'react';
import { FaBook, FaVideo, FaMap, FaSearch, FaArrowRight } from 'react-icons/fa';
import { Link } from 'wouter';

const ResourcesPage = () => {
  const [filter, setFilter] = useState('all');

  const resources = [
    { id: 1, title: 'JavaScript Mastery', type: 'article', description: 'Deep dive into ES6+ features.', icon: <FaBook />, author: 'John Doe' },
    { id: 2, title: 'React Hooks Tutorial', type: 'video', description: 'Learn hooks with examples.', icon: <FaVideo />, author: 'Jane Smith' },
    { id: 3, title: 'DSA Roadmap 2024', type: 'roadmap', description: 'Step-by-step DSA guide.', icon: <FaMap />, author: 'IntelliHire' },
    { id: 4, title: 'System Design Basics', type: 'article', description: 'Scalable architecture patterns.', icon: <FaBook />, author: 'Tech Lead' },
    { id: 5, title: 'Node.js Backend', type: 'video', description: 'Build APIs with Express.', icon: <FaVideo />, author: 'Dev Guru' },
    { id: 6, title: 'Full Stack Roadmap', type: 'roadmap', description: 'From frontend to deployment.', icon: <FaMap />, author: 'IntelliHire' },
  ];

  const filteredResources = filter === 'all' ? resources : resources.filter(r => r.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
        <div className="text-2xl font-bold text-primary">
          <Link to="/">IntelliHire</Link>
        </div>
        <ul className="flex space-x-8 list-none">
          <li><Link to="/" className="text-gray-700 hover:text-primary">Home</Link></li>
          <li><Link to="/quizzes" className="text-gray-700 hover:text-primary">Quizzes</Link></li>
          <li><Link to="/placements" className="text-gray-700 hover:text-primary">Placements</Link></li>
          <li><Link to="/resources" className="text-gray-700 hover:text-primary">Resources</Link></li>
        </ul>
        <Link to="/login">
          <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">Login / Signup</button>
        </Link>
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
              <div className="text-4xl text-primary mb-4">{resource.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
              <p className="text-gray-600 mb-4">{resource.description}</p>
              <span className="block text-sm text-gray-500 mb-4">By {resource.author}</span>
              <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center gap-2 mx-auto">
                Read More <FaArrowRight />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2023 IntelliHire. All rights reserved.</p>
        <p className="mt-4">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </p>
      </footer>
    </div>
  );
};

export default ResourcesPage;