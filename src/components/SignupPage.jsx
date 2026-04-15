import { Link, useLocation } from 'wouter';
import React, { useState } from 'react';
import { API_URL } from "../config";

const steps = ['Choose role', 'Sign up', 'Done'];

const SignupPage = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setUserType(role);
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('${API_URL}/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: userType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Signup failed');
        setLoading(false);
        return;
      }

      setStep(3);
      setTimeout(() => setLocation('/login'), 1200);

    } catch (err) {
      console.error(err);
      setError('Server error');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-primary to-secondary p-6 font-inter">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-lg font-semibold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-500">Join IntelliHire today 🚀</p>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-6">
            {steps.map((label, i) => {
              const idx = i + 1;
              const isDone = step > idx;
              const isActive = step === idx;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border
                      ${isDone ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : isActive ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-400'}`}>
                      {isDone ? '✓' : idx}
                    </div>
                    <span className="text-xs">{label}</span>
                  </div>
                  {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mb-4" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="px-8 pb-8">

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              {['student', 'company'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className="p-4 border rounded-xl hover:bg-gray-50"
                >
                  {role === 'student' ? 'Student 👩‍🎓' : 'Company 🏢'}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                onChange={handleInputChange}
                className="p-2 border rounded-lg"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleInputChange}
                className="p-2 border rounded-lg"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  onChange={handleInputChange}
                  className="p-2 border rounded-lg w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2"
                >
                  👁
                </button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary text-white py-2 rounded-lg"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="text-center">
              <h2 className="text-lg font-semibold">Account Created 🎉</h2>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600">Login</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default SignupPage;