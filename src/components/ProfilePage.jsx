// import React, { useState } from 'react';
// import { FaEdit, FaSave } from 'react-icons/fa';
// import { Link } from 'wouter';

// const ProfilePage = () => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [profile, setProfile] = useState({
//     name: 'John Doe',
//     email: 'john.doe@example.com',
//     role: 'Student',
//     bio: 'Aspiring software developer'
//   });

//   const handleSave = () => {
//     setIsEditing(false);
//     alert('Profile updated successfully!');
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-gray-800 font-inter">
//       {/* Navbar */}
//       <nav className="flex justify-between items-center p-4 bg-white bg-opacity-90 shadow-md sticky top-0 z-10">
//         <div className="text-2xl font-bold text-primary">
//           <Link to="/">IntelliHire</Link>
//         </div>
//         <ul className="flex space-x-8 list-none">
//           <li><Link to="/" className="text-gray-700 hover:text-primary">Home</Link></li>
//           <li><Link to="/quizzes" className="text-gray-700 hover:text-primary">Quizzes</Link></li>
//           <li><Link to="/placements" className="text-gray-700 hover:text-primary">Placements</Link></li>
//           <li><Link to="/resources" className="text-gray-700 hover:text-primary">Resources</Link></li>
//         </ul>
//         <Link to="/login">
//           <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full">Logout</button>
//         </Link>
//       </nav>

//       {/* Header */}
//       <header className="text-center p-16 bg-white">
//         <h1 className="text-4xl font-bold mb-4">Profile Settings</h1>
//         <p className="text-lg">Manage your account information.</p>
//       </header>

//       {/* Profile Form */}
//       <section className="p-16 bg-gray-100">
//         <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold">Personal Information</h2>
//             <button
//               onClick={() => setIsEditing(!isEditing)}
//               className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2"
//             >
//               {isEditing ? <FaSave /> : <FaEdit />}
//               {isEditing ? 'Save' : 'Edit'}
//             </button>
//           </div>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Full Name</label>
//               <input
//                 type="text"
//                 value={profile.name}
//                 disabled={!isEditing}
//                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Email</label>
//               <input
//                 type="email"
//                 value={profile.email}
//                 disabled={!isEditing}
//                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Role</label>
//               <input
//                 type="text"
//                 value={profile.role}
//                 disabled
//                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Bio</label>
//               <textarea
//                 value={profile.bio}
//                 disabled={!isEditing}
//                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
//                 rows="3"
//               />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-800 text-white p-8 text-center">
//         <p>© 2023 IntelliHire. All rights reserved.</p>
//         <p className="mt-4">
//           <Link to="/" className="text-primary hover:underline">Back to Home</Link>
//         </p>
//       </footer>
//     </div>
//   );
// };

// export default ProfilePage;

import React, { useState } from 'react';
import { FaEdit, FaSave } from 'react-icons/fa';
import { Link } from 'wouter';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Student',
    bio: 'Aspiring software developer'
  });

  const handleSave = () => {
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const quizProgress = [
    { subject: 'DSA', score: 80 },
    { subject: 'Aptitude', score: 65 },
    { subject: 'OS', score: 50 },
    { subject: 'Math', score: 75 },
  ];

  const companyResults = [
    { company: 'Amazon', score: 85 },
    { company: 'Infosys', score: 70 },
    { company: 'TCS', score: 60 },
  ];

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
      <header className="text-center p-16 bg-white">
        <h1 className="text-4xl font-bold mb-2">Profile Dashboard</h1>
        <p className="text-gray-500">Manage your account & track performance</p>
      </header>

      <section className="p-10 bg-gray-100 space-y-8">

        {/* Profile Card */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary text-white flex items-center justify-center rounded-full text-xl font-bold">
                JD
              </div>
              <div>
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
              {profile.role}
            </span>
            <p className="text-sm text-gray-500 mt-3">{profile.bio}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-primary">4</h2>
            <p className="text-sm text-gray-500">Tests Taken</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-primary">76%</h2>
            <p className="text-sm text-gray-500">Average Score</p>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full flex items-center gap-2"
            >
              {isEditing ? <FaSave /> : <FaEdit />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="space-y-5">

            <div className="relative">
              <input
                value={profile.name}
                disabled={!isEditing}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500">
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                value={profile.email}
                disabled={!isEditing}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500">
                Email
              </label>
            </div>

            <div className="relative">
              <textarea
                value={profile.bio}
                disabled={!isEditing}
                rows="3"
                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
              />
              <label className="absolute left-3 -top-2 text-xs bg-white px-1 text-gray-500">
                Bio
              </label>
            </div>

          </div>
        </div>

        {/* Quiz Progress */}
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">
  <h2 className="text-xl font-bold mb-6">Quiz Performance</h2>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">

    {quizProgress.map((item, i) => {
      const radius = 30;
      const stroke = 6;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (item.score / 100) * circumference;

      const color =
        item.score > 75 ? '#22c55e' :
        item.score > 60 ? '#eab308' :
        '#ef4444';

      return (
        <div key={i} className="flex flex-col items-center">

          {/* Circle Wrapper */}
          <div className="relative w-20 h-20 flex items-center justify-center">

            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={stroke}
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Centered Score */}
            <span className="absolute text-sm font-semibold">
              {item.score}%
            </span>
          </div>

          {/* Subject */}
          <p className="mt-3 text-sm font-medium">{item.subject}</p>

          {/* Label */}
          <p className="text-xs text-gray-500">
            {item.score > 75 ? 'Excellent' :
             item.score > 60 ? 'Good' :
             'Improve'}
          </p>

        </div>
      );
    })}

  </div>
</div>
        {/* Company Results */}
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Company Test Results</h2>

          {companyResults.map((item, i) => (
            <div key={i} className="flex justify-between border-b py-2 text-sm">
              <span>{item.company}</span>
              <span className="font-semibold text-primary">{item.score}%</span>
            </div>
          ))}
        </div>

      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center">
        <p>© 2025 IntelliHire. All rights reserved.</p>
        <p className="mt-4">
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </p>
      </footer>
    </div>
  );
};

export default ProfilePage;