import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiHome } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import logo from "../assets/K_suit.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // Real-time validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  
  const { login, verifyEmail, resendVerificationCode, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Handle email change with real-time validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setEmailError(validateEmail(value));
    }
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
  };

  // Handle field blur
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'email') setEmailError(validateEmail(email));
    if (field === 'password') setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setTouched({ email: true, password: true });
    
    if (emailErr || passwordErr) return;
    
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.message === 'User is not confirmed.' || err.code === 'UserNotConfirmedException') {
        setRegisteredEmail(email);
        setShowVerification(true);
        setError('Your email is not verified yet. Please enter the code sent to your email.');
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
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
      setShowVerification(false);
      setError('');
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

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to login with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
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
              {showVerification ? 'Verify Email' : 'Welcome Back'}
            </h1>
            <p className="text-secondary text-sm">
              {showVerification ? `We've sent a code to ${registeredEmail}` : 'Sign in to continue shopping'}
            </p>
          </div>

          {/* Global Error */}
          {error && (
            <div className={`mb-4 p-3 border text-sm rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2 ${
              showVerification ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <span className={showVerification ? 'text-amber-500' : 'text-red-500'}>
                {showVerification ? 'ℹ' : '⚠'}
              </span>
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
                  onClick={() => {
                    setShowVerification(false);
                    setError('');
                  }}
                  className="text-xs text-secondary hover:text-primary transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiMail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        emailError && touched.email
                          ? 'border-red-400 focus:border-red-400 bg-red-50/30'
                          : 'border-stone-200 focus:border-primary'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {emailError && touched.email && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      <HiLockClosed size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300 ${
                        passwordError && touched.password
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
                  {passwordError && touched.password && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>
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
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                  <span className="bg-white px-3 text-stone-400">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full py-3 bg-white border border-stone-200 text-primary rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-stone-50 transition-all shadow-sm hover:shadow-md"
              >
                <FcGoogle size={20} />
                Login with Google
              </button>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-stone-200 text-center">
                <p className="text-secondary text-sm">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary font-bold hover:underline decoration-accent underline-offset-2 transition-all">
                    Create account
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

export default Login;
