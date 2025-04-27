import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertCircle, FiCheckCircle, FiEdit, FiTrash2, FiPhone, FiMail,
  FiMapPin, FiHeart, FiCreditCard, FiCalendar, FiInfo, FiRefreshCw,
  FiClock, FiShield, FiDollarSign, FiCheck, FiArrowUpRight
} from 'react-icons/fi';
import { TbRefresh } from "react-icons/tb";
import './HealthAlert.css';
import khalti from "../assets/khalti.png"
import Select from 'react-select';

function HealthAlert() {
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [otherDisease, setOtherDisease] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const stationOptions = [
    'Kathmandu', 'Janakpur', 'Pokhara', 'Butwal', 'Bharatpur',
    'Nepalgunj', 'Mahendranagar', 'Biratnagar', 'Birgunj', 'Dharan'
  ];

  const diseases = [
    { name: 'Pneumonia', icon: '🫁' },
    { name: 'Asthma', icon: '🌬️' },
    { name: 'COPD', icon: '🚬' },
    { name: 'Sarcoidosis', icon: '🔍' },
    { name: 'Bronchiectasis', icon: '🔄' },
    { name: 'Other', icon: '❓' },
    { name: 'No Diseases', icon: '❌' },
  ];

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 800,
      currency: 'NPR',
      months: 1,
      discount: 0,
    },
    // {
    //   id: 'quarterly',
    //   name: 'Quarterly',
    //   price: 2100,
    //   currency: 'NPR',
    //   months: 3,
    //   discount: 12.5,
    // },
    {
      id: 'biannual',
      name: '6 Months',
      price: 3900,
      currency: 'NPR',
      months: 6,
      discount: 18.75,
      popular: true
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 7200,
      currency: 'NPR',
      months: 12,
      discount: 25,
    }
  ];

  // Calculate subscription amount based on selected plan
  const getSubscriptionAmount = () => {
    return plans.find(plan => plan.id === selectedPlan)?.price || 800;
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format number to display in health alert dashboard
  const formatNum = (num) => {
    num=num/100;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Check user authentication and subscription status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          // Check if we're returning from a successful payment
          const paymentSuccessFlag = sessionStorage.getItem('paymentSuccess');
          if (paymentSuccessFlag === 'true') {
            setPaymentSuccess(true);
            // Remove the flag from session storage
            sessionStorage.removeItem('paymentSuccess');
          }
          
          if (userDoc.exists() && userDoc.data().healthAlert?.subscribed) {
            const healthAlertData = userDoc.data().healthAlert;
            setIsSubscribed(true);
            setStations(healthAlertData.stations || []);
            setSelectedDiseases(healthAlertData.diseases || []);
            setPhoneNumber(healthAlertData.phoneNumber || '');
            setSubscriptionDetails(healthAlertData);
            
            // Format the subscription end date and calculate days remaining
            if (healthAlertData.paymentInfo?.expiryDate) {
              const expiryDate = new Date(healthAlertData.paymentInfo.expiryDate.seconds * 1000);
              
              setSubscriptionEndDate(formatDate(expiryDate));
              
              // Calculate days remaining in subscription
              const today = new Date();
              const timeDiff = expiryDate.getTime() - today.getTime();
              const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
              setDaysRemaining(daysDiff > 0 ? daysDiff : 0);
            }
            
            // Set subscription start date if available
            if (healthAlertData.paymentInfo?.startDate) {
              const startDate = new Date(healthAlertData.paymentInfo.startDate.seconds * 1000);
              setSubscriptionStartDate(formatDate(startDate));
            }
            
            // Handle "Other" disease option
            if (healthAlertData.diseases) {
              const other = healthAlertData.diseases.find(d => !diseases.some(disease => disease.name === d));
              if (other && other !== 'Other') {
                setOtherDisease(other);
                if (!selectedDiseases.includes('Other')) {
                  setSelectedDiseases(prev => [...prev, 'Other']);
                }
              }
            }
          }
          
        } catch (error) {
          console.error("Error fetching user data:", error);
          setMessage('Failed to load subscription data');
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setIsSubscribed(false);
        setPaymentSuccess(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update subscription date preview based on selected plan
  useEffect(() => {
    updateSubscriptionDates();
  }, [selectedPlan]);

  // Format date helper
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Update subscription dates
  const updateSubscriptionDates = () => {
    // Set start date (today)
    const startDate = new Date();
    setSubscriptionStartDate(formatDate(startDate));
    
    // Set end date based on selected plan
    const endDate = new Date();
    const months = plans.find(plan => plan.id === selectedPlan)?.months || 1;
    endDate.setMonth(endDate.getMonth() + months);
    setSubscriptionEndDate(formatDate(endDate));
  };

  const handleDiseaseChange = (disease) => {
    if (disease === 'No Diseases') {
      setSelectedDiseases(['No Diseases']);
      setOtherDisease('');
    } else if (disease === 'Other') {
      setSelectedDiseases(prev =>
        prev.includes('Other') ? prev.filter(d => d !== 'Other') : [...prev.filter(d => d !== 'No Diseases'), 'Other']
      );
    } else {
      setSelectedDiseases(prev =>
        prev.includes(disease)
          ? prev.filter(d => d !== disease)
          : [...prev.filter(d => d !== 'No Diseases'), disease]
      );
    }
  };

  // Validate the form before proceeding to payment
  const validateForm = () => {
    if (!stations.length) {
      setMessage('Please select at least one monitoring station');
      return false;
    }
    if (selectedDiseases.length === 0) {
      setMessage('Please select at least one health condition');
      return false;
    }
    if (selectedDiseases.includes('Other') && !otherDisease.trim()) {
      setMessage('Please specify your "Other" health condition');
      return false;
    }
    if (!phoneNumber || phoneNumber.length !== 10) {
      setMessage('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!agreed) {
      setMessage('Please agree to receive alerts');
      return false;
    }
    return true;
  };

  // Handle "Proceed to Payment" button click
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setMessage('');
    
    // Get months based on selected plan
    const months = plans.find(plan => plan.id === selectedPlan)?.months || 1;
    
    // Get amount based on selected plan
    const amount = getSubscriptionAmount();
    
    // Prepare the subscription data to be stored in session storage
    const diseasesToSave = selectedDiseases
      .filter(d => d !== 'Other')
      .concat(selectedDiseases.includes('Other') ? [otherDisease] : []);
      
    const subscriptionData = {
      email: user.email,
      phoneNumber: phoneNumber,
      stations: stations,
      diseases: diseasesToSave,
      amount: amount,
      months: months,
      planId: selectedPlan,
      startDate: new Date(),
      endDate: new Date(subscriptionEndDate),
      userId: user.uid
    };
    
    // Store the data in session storage for the payment page
    sessionStorage.setItem('healthAlertSubscription', JSON.stringify(subscriptionData));
    
    // Navigate to the payment page
    navigate('/khalti-payment');
  };

  const handleRenewSubscription = () => {
    setIsSubscribed(false);
    setPaymentSuccess(false);
    // Pre-fill the form with existing subscription details
    if (subscriptionDetails) {
      // Set plan based on subscription months
      const { months } = subscriptionDetails;
      const matchingPlan = plans.find(plan => plan.months === months);
      if (matchingPlan) {
        setSelectedPlan(matchingPlan.id);
      }
    }
    setCurrentStep(1);
  };

  const handleUnsubscribe = async () => {
    if (window.confirm('Are you sure you want to unsubscribe from health alerts?')) {
      setIsLoading(true);
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            healthAlert: { 
              subscribed: false,
              unsubscribedAt: new Date(),
              previousSubscription: subscriptionDetails
            },
          },
          { merge: true }
        );
        setIsSubscribed(false);
        setStations([]);
        setSelectedDiseases([]);
        setPhoneNumber('');
        setMessage('You have been unsubscribed from health alerts.');
        setPaymentSuccess(false);
        setCurrentStep(1);
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setMessage('Failed to unsubscribe. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="subscription-plans">
            <h2>Choose Your Subscription Plan</h2>
            <div className="plans-container">
              {plans.map(plan => (
                <motion.div 
                  key={plan.id}
                  className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && <div className="popular-tag">Most Popular</div>}
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="amount">{formatNumber(plan.price)}</span>
                    <span className="currency">{plan.currency}</span>
                  </div>
                  <div className="plan-duration">
                    {plan.months} {plan.months === 1 ? 'Month' : 'Months'} Subscription
                  </div>
                  {plan.discount > 0 && (
                    <div className="plan-discount">
                      <span className="discount-badge">{plan.discount}% OFF</span>
                    </div>
                  )}
                  {plan.discount===0 &&(
                    <div className='empty'>
                      <p>.</p>
                    </div>
                  )}
                  <button 
                    className="choose-plan-btn"
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      nextStep();
                    }}
                  >
                    Get Started
                    <FiArrowUpRight className='arroww'/>
                  </button>
                </motion.div>
              ))}
            </div>
            <div className='powr'>
            <h1>Powered by Khalti</h1>
            <img src={khalti} alt="" />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="subscription-details-step">
            <h2>Monitoring Preferences</h2>
            
            <div className="step-content">
              <div className="selected-plan-summary">
                <div className="plan-summary-details">
                  <div className="plan-name">
                <h3>Selected Plan</h3>
                <h2>
                    {plans.find(p => p.id === selectedPlan)?.name} Plan
                </h2>
                  </div>
                  <div className="plan-price">
                  <h3>Price</h3>
                  <h2>
                    NPR {formatNumber(getSubscriptionAmount())}
                  </h2>
                  </div>
                  {/* <div className="plan-duration">
                    {plans.find(p => p.id === selectedPlan)?.months + 
                    (plans.find(p => p.id === selectedPlan)?.months === 1 ? ' Month' : ' Months')}
                  </div> */}
                  <div className="subscription-period">
                  <h3>Subscription Duration</h3>
                  <h2>
                    {subscriptionStartDate} - {subscriptionEndDate}
                  </h2>
                  </div>
                </div>
                <div className='chngplandiv'>
                <button className="change-plan-btn" onClick={() => setCurrentStep(1)}>
                    <span>
                    Change Plan
                    <TbRefresh className='reff'/>
                      </span>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <p className='lebb'>
                  <FiMapPin className="label-icon" /> 
                  Select Monitoring Stations:
                </p>
                {/* <select
                  multiple
                  value={stations}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setStations(selected);
                  }}
                  className="station-select"
                  required
                >
                  {stationOptions.map(station => (
                    <option key={station} value={station}>
                      {station}
                    </option>
                  ))}
                </select> */}
                <div className='dropdownmenu'>
                <Select
                isMulti
                options={stationOptions.map(station => ({ value: station, label: station }))}
                value={stations.map(station => ({ value: station, label: station }))}
                onChange={(selectedOptions) => {
                  setStations(selectedOptions.map(option => option.value));
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                required/>
                </div>
                <small className="select-hint">
                  Hold Ctrl (Windows) or Command (Mac) to select multiple stations
                </small>
              </div>
              
              <div className="form-group">
                <p className='lebb'>
                  <FiHeart className="label-icon" /> 
                  Select Respiratory Conditions:
                </p>
                <div className="disease-grid">
                  {diseases.map(({name, icon}) => (
                    <motion.label 
                      key={name} 
                      className={`disease-option ${selectedDiseases.includes(name) ? 'selected' : ''}`}
                      whileHover={{ scale: 1.03 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiseases.includes(name)}
                        onChange={() => handleDiseaseChange(name)}
                      />
                      <span className="disease-icon">{icon}</span>
                      <span className="disease-name">{name}</span>
                    </motion.label>
                  ))}
                </div>
                
                {selectedDiseases.includes('Other') && (
                  <div className="other-disease-input">
                    <input
                      type="text"
                      value={otherDisease}
                      onChange={(e) => setOtherDisease(e.target.value)}
                      placeholder="Specify other condition"
                      className="form-control"
                    />
                  </div>
                )}
              </div>
              
              <div className="navigation-buttons">
                <button className="nav-button back" onClick={prevStep}>
                  Back
                </button>
                <button className="nav-button next" onClick={nextStep}>
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="contact-details-step">
            <h2>Contact Details</h2>
            
            <div className="step-content">
              <div className="contact-form">
                <div className="form-group">
                  <label>
                    <FiMail className="label-icon" /> 
                    Email Address for Alerts:
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-control"
                  />
                  <small className="input-hint">
                    Alerts will be sent to your registered email address
                  </small>
                </div>
                
                <div className="form-group">
                  <label>
                    <FiPhone className="label-icon" /> 
                    Mobile Number for SMS Alerts:
                  </label>
                  <div className="phone-input-container">
                    <div className="country-code">+977</div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                      }}
                      placeholder="98XXXXXXXX"
                      maxLength="10"
                      className="form-control phone-input"
                      required
                    />
                  </div>
                  <small className="input-hint">
                    Enter a 10-digit Nepali mobile number without country code
                  </small>
                </div>
                
                <div className="checkbox-group">
                  <motion.label 
                    className="checkbox-label"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className='radiodiv'>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                      />
                      <p>
                        I agree to receive SMS and email alerts about air quality conditions 
                        that may affect my health conditions
                      </p>
                    </div>
                  </motion.label>
                </div>
                
                <div className="alert-reminder">
                  <FiShield className="alert-reminder-icon" />
                  <p>
                    Your subscription will begin immediately after payment and will be valid until <strong>{subscriptionEndDate}</strong>.
                  </p>
                </div>
                
                {message && (
                  <motion.div 
                    className="alert-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <FiAlertCircle className="alert-icon" />
                    {message}
                  </motion.div>
                )}
                
                <div className="navigation-buttons">
                  <button className="nav-button back" onClick={prevStep}>
                    Back
                  </button>
                  <button 
                    className="nav-button payment"
                    onClick={handleProceedToPayment}
                    disabled={isLoading}
                  >
                    <FiCreditCard className="button-icon" />
                    Pay NPR {formatNumber(getSubscriptionAmount())} with Khalti
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="health-alert-wrapper">
      <div className="health-alert-content">
        <motion.div 
          className="health-alert-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Processing your request...</p>
            </div>
          ) : !user ? (
            <motion.div 
              className="auth-required"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="header-icon">
                <FiAlertCircle size={48} />
              </div>
              <h2>NepAir - Air Quality Health Alerts</h2>
              <p className="description">
                Get notified when air quality reaches dangerous levels in your selected locations.
              </p>
              <motion.button 
                onClick={() => navigate('/login')} 
                className="cta-button primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login to Subscribe
              </motion.button>
            </motion.div>
          ) : isSubscribed || paymentSuccess ? (
            <motion.div 
              className="subscription-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="success-icon">
                <FiCheckCircle size={64} />
              </div>
              <h2>Your Health Alert Subscription is Active!</h2>
              
              {paymentSuccess && (
                <div className="payment-success-message">
                  <p>Thank you for subscribing to NepAir Health Alerts.</p>
                  <p>You will receive email alerts at <strong>{user.email}</strong></p>
                  {phoneNumber && (
                    <p>and SMS alerts at <strong>+977 {phoneNumber}</strong></p>
                  )}
                </div>
              )}
              
              <div className="subscription-timeline">
                <div className="timeline-container">
                  <div className="timeline-start">
                    <div className="timeline-dot start"></div>
                    <div className="timeline-date">{subscriptionStartDate || 'Today'}</div>
                    <div className="timeline-label">Subscription Start</div>
                  </div>
                  <div className="timeline-line">
                    <div className="timeline-progress" style={{ 
                      width: `${daysRemaining > 0 && subscriptionDetails?.months ? 
                        100 - (daysRemaining / (subscriptionDetails.months * 30)) * 100 : 0}%` 
                    }}></div>
                  </div>
                  <div className="timeline-end">
                    <div className="timeline-dot end"></div>
                    <div className="timeline-date">{subscriptionEndDate}</div>
                    <div className="timeline-label">Subscription End</div>
                  </div>
                </div>
                <div className="timeline-status">
                  <FiClock className="timeline-icon" />
                  {daysRemaining > 0 ? (
                    <span>{daysRemaining} days remaining in your subscription</span>
                  ) : (
                    <span>Your subscription has expired</span>
                  )}
                </div>
              </div>
              
              <div className="subscription-details">
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <span>{user.email}</span>
                  <div className="detail-label">Email Alerts</div>
                </div>
                {phoneNumber && (
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <span>+977 {phoneNumber}</span>
                    <div className="detail-label">SMS Alerts</div>
                  </div>
                )}
                {stations.length > 0 && (
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <span>{stations.join(', ')}</span>
                    <div className="detail-label">Monitored Locations</div>
                  </div>
                )}
                {selectedDiseases.length > 0 && (
                  <div className="detail-item">
                    <FiHeart className="detail-icon" />
                    <span>
                      {selectedDiseases
                        .map(d => d === 'Other' ? otherDisease : d)
                        .filter(d => d !== '')
                        .join(', ')}
                    </span>
                    <div className="detail-label">Health Conditions</div>
                  </div>
                )}
                {subscriptionDetails?.months && (
                  <div className="detail-item">
                    <FiCalendar className="detail-icon" />
                    <span>{subscriptionDetails.months} {subscriptionDetails.months === 1 ? 'Month' : 'Months'}</span>
                    <div className="detail-label">Subscription Duration</div>
                  </div>
                )}
                {subscriptionDetails?.paymentInfo?.amount && (
                  <div className="detail-item">
                    <FiDollarSign className="detail-icon" />
                    <span>NPR {formatNum(subscriptionDetails.paymentInfo.amount)}</span>
                    <div className="detail-label">Amount Paid</div>
                  </div>
                )}
              </div>
              
              <div className={`subscription-message ${daysRemaining <= 7 ? 'warning' : ''}`}>
                <FiInfo className="info-icon" />
                {daysRemaining <= 7 ? (
                  <p>Your subscription will expire on <strong>{subscriptionEndDate}</strong>. Consider renewing soon to avoid service interruption.</p>
                ) : (
                  <p>Your subscription is valid until <strong>{subscriptionEndDate}</strong>.</p>
                )}
              </div>
              
              <div className="subscription-actions">
                <motion.button 
                  className="action-button renew"
                  onClick={handleRenewSubscription}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiRefreshCw className="button-icon" />
                  Renew Subscription
                </motion.button>
                <motion.button 
                  className="action-button unsubscribe"
                  onClick={handleUnsubscribe}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiTrash2 className="button-icon" />
                  Unsubscribe
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="subscription-wizard">
              <h1>NepAir - Air Quality Health Alerts</h1>
              <p className="service-description">
                Get personalized alerts when air quality may affect your health conditions.
              </p>
              
              <div className="wizard-progress">
                <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Select Plan</div>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Monitoring Preferences</div>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Contact Details</div>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default HealthAlert;