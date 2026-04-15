import React from 'react';
import { FaRocket, FaUsers, FaLightbulb } from 'react-icons/fa';
import { Link } from 'wouter';

const AboutPage = () => {
  const features = [
    { icon: <FaRocket />, title: 'Fast Learning', description: 'Accelerate your skills with interactive quizzes.' },
    { icon: <FaUsers />, title: 'Community', description: 'Connect with students and companies.' },
    { icon: <FaLightbulb />, title: 'Innovation', description: 'Stay updated with latest tech trends.' },
  ];

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
        <h1 className="text-4xl font-bold mb-4">About IntelliHire</h1>
        <p className="text-lg">Empowering students to achieve their career goals.</p>
      </header>

      {/* Features */}
      <section className="p-16 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition">
              <div className="text-4xl text-primary mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
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

export default AboutPage;