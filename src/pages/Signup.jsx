import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiUser, HiMail, HiLockClosed, HiEye, HiEyeOff, HiHome, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import logo from "../assets/K_suit.png";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // Real-time validation states
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false
  });
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  
  const { signup, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  // Full name validation
  const validateFullName = (name) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters';
    return '';
  };

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return 'Phone number is required';
    // Allow spaces and hyphens for better UX
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) return 'Include +country code (e.g. +919992304505)';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Warn about suspicious domains (but don't block)
    if (domain && !commonDomains.includes(domain) && domain.split('.').length < 2) {
      return 'Please check your email domain';
    }
    
    return '';
  };

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, text: '', color: '' };
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars
    
    // Determine strength
    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'Fair', color: 'bg-yellow-500' };
    if (score <= 5) return { score, text: 'Good', color: 'bg-blue-500' };
    return { score, text: 'Strong', color: 'bg-green-500' };
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    // Removed hard error for length < 8 to allow 'Fair' strength passwords
    return '';
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // Handle input change with real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update password strength in real-time
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Real-time validation if field was touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'fullName':
        error = validateFullName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phoneNumber':
        error = validatePhoneNumber(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Update confirm password validation when password changes
  useEffect(() => {
    if (touched.confirmPassword && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  }, [formData.password]);

  // Handle field blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true
    });
    
    // Validate all fields
    const nameErr = validateFullName(formData.fullName);
    const emailErr = validateEmail(formData.email);
    const phoneErr = validatePhoneNumber(formData.phoneNumber);
    const passwordErr = validatePassword(formData.password);
    const confirmErr = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    setErrors({
      fullName: nameErr,
      email: emailErr,
      phoneNumber: phoneErr,
      password: passwordErr,
      confirmPassword: confirmErr
    });
    
    if (nameErr || emailErr || phoneErr || passwordErr || confirmErr) {
      setError('Please fix the errors above');
      return;
    }
    
    setLoading(true);
    try {
      await signup(formData.email, formData.password, { 
        full_name: formData.fullName,
        phone_number: formData.phoneNumber 
      });
      setRegisteredEmail(formData.email);
      setShowVerification(true);
      setError('');
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
        setErrors(prev => ({ ...prev, email: 'Email already exists' }));
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(registeredEmail, verificationCode);
      alert('Email verified successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendVerificationCode(registeredEmail);
      alert('Verification code resent! Please check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-secondary hover:text-primary transition-all font-medium group z-50"
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-all border border-stone-200">
          <HiHome size={20} />
        </div>
        <span className="hidden sm:inline bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm shadow-sm">Back to Home</span>
      </Link>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200/50 p-8 relative overflow-hidden">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-primary rounded-2xl shadow-lg mb-4">
              <img
                src={logo}
                alt="Kamlesh Suits"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl font-serif text-primary mb-1">
              {showVerification ? 'Verify Email' : 'Create Account'}
            </h1>
            <p className="text-secondary text-sm">
              {showVerification ? `We've sent a code to ${registeredEmail}` : 'Join our exclusive community'}
            </p>
          </div>

          {/* Global Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-red-500">⚠</span>
              <p className="flex-1">{error}</p>
            </div>
          )}

          {showVerification ? (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-stone-300 text-center tracking-[0.5em] text-xl font-bold"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Resend verification code
                </button>
              </div>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="text-xs text-secondary hover:text-primary transition-colors"
                >
                  Back to Registration
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiUser size={18} />
                    </div>
                    <input
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('fullName')}
                      className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        errors.fullName && touched.fullName
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="John Doe"
                    />
                    {!errors.fullName && touched.fullName && formData.fullName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <HiCheckCircle size={18} />
                      </div>
                    )}
                  </div>
                  {errors.fullName && touched.fullName && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiXCircle size={14} /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiMail size={18} />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        errors.email && touched.email
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="you@example.com"
                    />
                    {!errors.email && touched.email && formData.email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <HiCheckCircle size={18} />
                      </div>
                    )}
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiXCircle size={14} /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <span className="text-lg">📱</span>
                    </div>
                    <input
                      name="phoneNumber"
                      type="text"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('phoneNumber')}
                      className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        errors.phoneNumber && touched.phoneNumber
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="+919992304505"
                    />
                  </div>
                  {errors.phoneNumber && touched.phoneNumber && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiXCircle size={14} /> {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiLockClosed size={18} />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        errors.password && touched.password
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map((bar) => (
                          <div
                            key={bar}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              bar <= passwordStrength.score ? passwordStrength.color : 'bg-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ml-1 ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 4 ? 'text-yellow-500' :
                        passwordStrength.score === 5 ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        Password strength: {passwordStrength.text}
                      </p>
                    </div>
                  )}
                  
                  {errors.password && touched.password && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiXCircle size={14} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiLockClosed size={18} />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : !errors.confirmPassword && touched.confirmPassword && formData.confirmPassword
                          ? 'border-green-400 focus:border-green-400 bg-green-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                    {!errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500">
                        <HiCheckCircle size={18} />
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiXCircle size={14} /> {errors.confirmPassword}
                    </p>
                  )}
                  {!errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && (
                    <p className="text-xs text-green-500 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                      <HiCheckCircle size={14} /> Passwords match!
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-stone-200 text-center">
                <p className="text-secondary text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline decoration-accent underline-offset-2 transition-all">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
