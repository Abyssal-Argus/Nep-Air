import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FaUser, FaLock, FaEnvelope, FaVenusMars, FaBirthdayCake, FaShieldAlt, FaArrowRight, FaCheck, FaChevronLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Login.css';
import logo from "../assets/logo.png";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    });
    setErrors({});
    setPasswordStrength(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
    
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.age || formData.age < 13) newErrors.age = 'You must be at least 13 years old';
      if (!formData.gender) newErrors.gender = 'Please select your gender';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter";
    if (!/[0-9]/.test(password)) return "Must contain a number";
    if (!/[!@#$%^&*]/.test(password)) return "Must contain a special character";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          if (userCredential.user.emailVerified) {
            const userData = userDoc.data();
            if (userData.role === 'admin' && userData.status !== 'approved') {
              alert("Your admin account is pending approval.");
              setIsLoading(false);
              return;
            }
            navigate('/');
          } else {
            setIsLoading(false);
            alert("Please verify your email address.");
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await sendEmailVerification(userCredential.user);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age,
          gender: formData.gender,
          email: formData.email,
          role: formData.role,
          status: formData.role === 'admin' ? 'pending' : 'approved',
          createdAt: new Date(),
        });
        setIsLoading(false);
        alert("Account created! Please verify your email.");
        toggleForm();
      }
    } catch (error) {
      console.error("Auth Error:", error.message);
      alert(error.message);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Please enter your email address:");
    if (email) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          if (userData.status === "approved") {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent. Please check your inbox.");
          } else {
            alert("Your account is not approved. Please contact the administrator.");
          }
        } else {
          alert("No user found with this email.");
        }
      } catch (error) {
        console.error("Password Reset Error:", error.message);
        alert(error.message);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-content">
          <div className="login-left">
            <div className="login-info">
              <motion.div 
                className="logo-container"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="logo-wrapper">
                  <img src={logo} alt="NepAir Logo" className="nepair-logo" />
                </div>
                <h1 className="logo-text">NepAir</h1>
              </motion.div>
              <motion.div 
                className="brand-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className='brandText'>Breathe Better with NepAir</h2>
                <p className='brandText'>Get real-time air quality updates across Nepal and make informed decisions about your outdoor activities.</p>
                <div className="features">
                  <motion.div 
                    className="feature"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="feature-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,7A2,2 0 0,0 9,9V15A2,2 0 0,0 11,17H13A2,2 0 0,0 15,15V14H13V15H11V9H13V10H15V9A2,2 0 0,0 13,7H11Z" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Real-time AQI</h3>
                      <p>Monitor air quality index in different regions</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="feature"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="feature-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,7.03 16.97,3 12,3M12,19C8.13,19 5,15.87 5,12C5,8.13 8.13,5 12,5C15.87,5 19,8.13 19,12C19,15.87 15.87,19 12,19M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15Z" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Health Alerts</h3>
                      <p>Receive notifications about poor air quality</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="feature"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="feature-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21,11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1L21,5V11M12,21C15.75,20 19,15.54 19,11.22V6.3L12,3.18L5,6.3V11.22C5,15.54 8.25,20 12,21Z" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Safety Tips</h3>
                      <p>Learn how to protect yourself from pollution</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              className="login-right"
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`login-card ${!isLogin ? 'signup-card' : ''}`}>
                <div className="login-header">
                  <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                  <p>{isLogin ? 'Sign in to access your NepAir dashboard' : 'Join NepAir for better air quality insights'}</p>
                </div>

                <div className="form-tabs">
                  <button 
                    className={`form-tab ${isLogin ? 'active' : ''}`} 
                    onClick={() => setIsLogin(true)}
                  >
                    Sign In
                  </button>
                  <button 
                    className={`form-tab ${!isLogin ? 'active' : ''}`} 
                    onClick={() => setIsLogin(false)}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                  <div className={`form-scroll-container ${!isLogin ? 'signup-form' : ''}`}>
                    {!isLogin && (
                      <>
                        <div className="form-row">
                          <div className="input-group">
                            <FaUser className="input-icon" />
                            <input
                              type="text"
                              name="firstName"
                              placeholder="First Name"
                              value={formData.firstName}
                              onChange={handleChange}
                              className={errors.firstName ? 'error' : ''}
                            />
                            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                          </div>
                          <div className="input-group">
                            <FaUser className="input-icon" />
                            <input
                              type="text"
                              name="lastName"
                              placeholder="Last Name"
                              value={formData.lastName}
                              onChange={handleChange}
                              className={errors.lastName ? 'error' : ''}
                            />
                            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="input-group">
                            <FaBirthdayCake className="input-icon" />
                            <input
                              type="number"
                              name="age"
                              placeholder="Age"
                              value={formData.age}
                              onChange={handleChange}
                              min="13"
                              className={errors.age ? 'error' : ''}
                            />
                            {errors.age && <span className="error-message">{errors.age}</span>}
                          </div>
                          <div className="input-group">
                            <FaVenusMars className="input-icon" />
                            <select 
                              name="gender" 
                              value={formData.gender} 
                              onChange={handleChange}
                              className={errors.gender ? 'error' : ''}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                            {errors.gender && <span className="error-message">{errors.gender}</span>}
                          </div>
                        </div>

                        <div className="input-group">
                          <FaShieldAlt className="select-icon" />
                          <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange}
                            className="role-select"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <small className="role-hint">Select "Admin" for organization account</small>
                        </div>
                      </>
                    )}

                    <div className="input-group">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="input-group">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                      />
                      {errors.password && <span className="error-message">{errors.password}</span>}
                      
                      {!isLogin && formData.password && (
                        <div className="password-strength-meter">
                          <div className="strength-bars">
                            <div className={`strength-bar ${passwordStrength >= 1 ? 'active' : ''}`}></div>
                            <div className={`strength-bar ${passwordStrength >= 2 ? 'active' : ''}`}></div>
                            <div className={`strength-bar ${passwordStrength >= 3 ? 'active' : ''}`}></div>
                            <div className={`strength-bar ${passwordStrength >= 4 ? 'active' : ''}`}></div>
                          </div>
                         
                        </div>
                      )}
                    </div>

                    {!isLogin && (
                      <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                          type="password"
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                      </div>
                    )}
                  </div>

                  <motion.button 
                    type="submit" 
                    className={`login-button ${isLogin ? 'signin-button' : 'signup-button'}`}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="spinner"></span>
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <FaArrowRight className="button-icon" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="login-footer">
                  {isLogin ? (
                    <button 
                      onClick={handleForgotPassword} 
                      className="forgot-password-button"
                    >
                      Forgot Password?
                    </button>
                  ) : (
                    <div className="password-requirements">
                      <p>Password must contain:</p>
                      <ul>
                        <li className={/[A-Z]/.test(formData.password) ? 'fulfilled' : ''}>
                          {/[A-Z]/.test(formData.password) ? <FaCheck className="check-icon" /> : null}
                          One uppercase letter
                        </li>
                        <li className={/.{8,}/.test(formData.password) ? 'fulfilled' : ''}>
                          {/.{8,}/.test(formData.password) ? <FaCheck className="check-icon" /> : null}
                          At least 8 characters
                        </li>
                        <li className={/[0-9]/.test(formData.password) ? 'fulfilled' : ''}>
                          {/[0-9]/.test(formData.password) ? <FaCheck className="check-icon" /> : null}
                          One number
                        </li>
                        <li className={/[!@#$%^&*]/.test(formData.password) ? 'fulfilled' : ''}>
                          {/[!@#$%^&*]/.test(formData.password) ? <FaCheck className="check-icon" /> : null}
                          One special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;