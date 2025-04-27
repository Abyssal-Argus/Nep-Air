import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import axios from 'axios';
import { 
  FiCreditCard, 
  FiAlertCircle, 
  FiArrowLeft, 
  FiCalendar, 
  FiCheckCircle, 
  FiShield,
  FiClock,
  FiLock,
  FiSmartphone,
  FiInfo
} from 'react-icons/fi';
import './KhaltiPayment.css';

const KhaltiPayment = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get subscription data from session storage
    const storedData = sessionStorage.getItem('healthAlertSubscription');
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSubscriptionData(data);
      } catch (error) {
        console.error("Error parsing subscription data:", error);
        showToast('error', 'Invalid Data', 'Subscription data is invalid');
        setTimeout(() => navigate('/healthalert'), 3000);
      }
    } else {
      // No subscription data found, redirect to health alert page
      showToast('error', 'Missing Data', 'No subscription data found');
      setTimeout(() => navigate('/healthalert'), 3000);
    }

    // Check if we have a payment verification response in URL
    const urlParams = new URLSearchParams(window.location.search);
    const pidx = urlParams.get('pidx');
    const txnId = urlParams.get('txnId');
    const amount = urlParams.get('amount');
    const status = urlParams.get('status');

    if (pidx && status) {
      setPaymentStep(3);
      verifyPayment(pidx, txnId, amount, status);
    }
  }, [navigate]);

  // Show toast notification
  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Format date to display in a friendly format
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format amount with commas
  const formatAmount = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Initialize Khalti payment
  const initiatePayment = async () => {
    if (!subscriptionData) {
      showToast('error', 'Payment Failed', 'No subscription data available');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const data = {
      return_url: window.location.origin + "/khalti-payment",
      website_url: window.location.origin,
      amount: subscriptionData.amount * 100, // Convert to paisa (Khalti's smallest unit)
      purchase_order_id: `healthalert-${Date.now()}`,
      purchase_order_name: `NepAir Health Alert ${subscriptionData.months}-Month Subscription`,
      customer_info: {
        name: auth.currentUser?.displayName || "NepAir User",
        email: subscriptionData.email,
        phone: subscriptionData.phoneNumber,
      },
      amount_breakdown: [
        {
          label: `${subscriptionData.months}-Month Subscription`,
          amount: subscriptionData.amount * 100,
        }
      ],
      product_details: [
        {
          identity: "health-alert-subscription",
          name: "NepAir Health Alert",
          total_price: subscriptionData.amount * 100,
          quantity: 1,
          unit_price: subscriptionData.amount * 100,
        },
      ],
    };

    const headers = {
      Authorization: "Key e53ffb1e15a443ce8c65cfb95e0037e8", // Replace with your Khalti Key
    };

    try {
      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        data,
        { headers }
      );
      
      setPaymentUrl(response.data.payment_url);
      setPaymentInitiated(true);
      setPaymentStep(2);
      setIsLoading(false);
      
      // Auto-redirect to Khalti payment page
      window.location.href = response.data.payment_url;
    } catch (error) {
      console.error("Khalti payment initiation error:", error);
      showToast('error', 'Payment Failed', 'Failed to initiate payment');
      setIsLoading(false);
    }
  };

  // Verify payment and update subscription
  const verifyPayment = async (pidx, txnId, amount, status) => {
    setIsLoading(true);
    
    try {
      // Get subscription data from session storage again (in case page was refreshed)
      const storedData = sessionStorage.getItem('healthAlertSubscription');
      const subscriptionData = storedData ? JSON.parse(storedData) : null;
      
      if (!subscriptionData || !subscriptionData.userId) {
        throw new Error('Subscription data not found');
      }
      
      if (status === 'Completed') {
        // Calculate subscription expiry date (based on selected number of months)
        const today = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(today.getMonth() + subscriptionData.months);
        
        // Update user document with subscription details
        await setDoc(
          doc(db, 'users', subscriptionData.userId),
          {
            healthAlert: {
              subscribed: true,
              subscribedAt: today,
              stations: subscriptionData.stations,
              diseases: subscriptionData.diseases,
              phoneNumber: subscriptionData.phoneNumber,
              months: subscriptionData.months,
              paymentInfo: {
                pidx: pidx,
                txnId: txnId,
                amount: amount,
                status: status,
                paymentDate: today,
                expiryDate: expiryDate
              }
            },
          },
          { merge: true }
        );
        
        // Set success flag in session storage
        sessionStorage.setItem('paymentSuccess', 'true');
        
        // Clean up subscription data
        sessionStorage.removeItem('healthAlertSubscription');
        
        // Show success message before redirecting
        setMessage('Payment successful! Redirecting to Health Alert dashboard...');
        setTimeout(() => navigate('/healthalert'), 3000);
      } else {
        // Payment failed or was cancelled
        setMessage(`Payment ${status.toLowerCase()}. Please try again.`);
        setPaymentStep(1);
        setTimeout(() => setIsLoading(false), 1000);
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      showToast('error', 'Verification Failed', 'Please contact support');
      setIsLoading(false);
    }
  };

  // Payment progress steps
  const renderProgressSteps = () => {
    const steps = [
      { label: 'Review', number: 1, icon: <FiInfo /> },
      { label: 'Payment', number: 2, icon: <FiCreditCard /> },
      { label: 'Confirmation', number: 3, icon: <FiCheckCircle /> }
    ];

    return (
      <div className="payment-progress">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="progress-step">
              <div 
                className={`step-circle ${
                  paymentStep === step.number ? 'active' : 
                  paymentStep > step.number ? 'completed' : ''
                }`}
              >
                {paymentStep > step.number ? <FiCheckCircle /> : step.icon}
              </div>
              <div 
                className={`step-label ${
                  paymentStep === step.number ? 'active' : 
                  paymentStep > step.number ? 'completed' : ''
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`progress-connector ${
                paymentStep > index + 1 ? 'completed' : ''
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="khalti-payment-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Processing your request...</p>
          </div>
        </div>
      )}
      
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div>{toast.message}</div>
          </div>
        </div>
      )}
      
      <div className="khalti-payment-card">
        <div className="card-header">
          <h2>
            <FiCreditCard className="header-icon" /> 
            <span>NepAir Health Alert</span>
            <span className="header-subtitle">Payment Portal</span>
          </h2>
        </div>
        
        {renderProgressSteps()}
        
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message.includes('successful') ? <FiCheckCircle className="message-icon" /> : <FiAlertCircle className="message-icon" />}
            {message}
          </div>
        )}
        
        {subscriptionData && !paymentInitiated && (
          <div className="payment-summary">
            <h3>Subscription Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Service:</span>
                <span>Health Alert Subscription</span>
              </div>
              
              <div className="summary-row highlight">
                <span>Duration:</span>
                <span>{subscriptionData.months} {subscriptionData.months === 1 ? 'Month' : 'Months'}</span>
              </div>
              
              <div className="summary-row">
                <span>Valid Until:</span>
                <span className="valid-until">
                  <FiCalendar className="inline-icon" /> 
                  {formatDate(new Date(new Date().setMonth(new Date().getMonth() + subscriptionData.months)))}
                </span>
              </div>
              
              <div className="summary-row">
                <span>Monitoring Stations:</span>
                <span>{subscriptionData.stations.join(', ')}</span>
              </div>
              
              <div className="summary-row">
                <span>Health Conditions:</span>
                <span>{subscriptionData.diseases.join(', ')}</span>
              </div>
              
              <div className="summary-row">
                <span>Contact Number:</span>
                <span><FiSmartphone className="inline-icon" /> +977 {subscriptionData.phoneNumber}</span>
              </div>
              
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>NPR {formatAmount(subscriptionData.amount)}</span>
              </div>
            </div>
            
            <div className="subscription-notice">
              <FiInfo className="notice-icon" />
              <p>
                Your subscription will be active immediately after successful payment and will 
                remain active until {formatDate(new Date(new Date().setMonth(new Date().getMonth() + subscriptionData.months)))}.
              </p>
            </div>
            
            <div className="payment-info">
              <div className="payment-security">
                <FiShield className="info-icon security" /> 
                <span>Secure Payment via Khalti Digital Wallet</span>
              </div>
              <div className="payment-timing">
                <FiClock className="info-icon" /> 
                <span>Processing time: Less than 1 minute</span>
              </div>
            </div>
            
            <div className="payment-actions">
              <button 
                className="back-button"
                onClick={() => navigate('/healthalert')}
                aria-label="Go back to Health Alert page"
              >
                <FiArrowLeft className="button-icon" /> Back
              </button>
              
              <button 
                className="khalti-button"
                onClick={initiatePayment}
                disabled={isLoading}
                aria-label="Pay with Khalti"
              >
                <FiLock className="button-icon" /> Pay NPR {formatAmount(subscriptionData?.amount || 0)}
              </button>
            </div>
          </div>
        )}
        
        {paymentInitiated && paymentUrl && (
          <div className="payment-redirect">
            <div className="redirect-message">
              <FiAlertCircle className="redirect-icon pulse" />
              <p>Redirecting to Khalti payment page...</p>
              <p className="redirect-subtitle">If you're not redirected automatically, please click the button below:</p>
            </div>
            
            <a 
              href={paymentUrl} 
              className="khalti-link-button"
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Continue to Khalti Payment"
            >
              <FiCreditCard className="button-icon" /> Continue to Khalti Payment
            </a>
            
            <button 
              className="cancel-button"
              onClick={() => {
                setPaymentInitiated(false);
                setPaymentUrl(null);
                setPaymentStep(1);
              }}
              aria-label="Cancel Payment"
            >
              Cancel Payment
            </button>
          </div>
        )}
        
        {paymentStep === 3 && (
          <div className="payment-success">
            <div className="success-icon-wrapper">
              <FiCheckCircle className="success-icon" />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your Health Alert subscription is now active.</p>
            <p className="transaction-id">Transaction ID: {new URLSearchParams(window.location.search).get('txnId') || 'N/A'}</p>
            
            <div className="success-details">
              <div className="success-detail-row">
                <span>Status:</span>
                <span className="success-status">Active</span>
              </div>
              <div className="success-detail-row">
                <span>Amount Paid:</span>
                <span>NPR {formatAmount(subscriptionData?.amount || 0)}</span>
              </div>
              <div className="success-detail-row">
                <span>Payment Date:</span>
                <span>{formatDate(new Date())}</span>
              </div>
            </div>
            
            <button 
              className="dashboard-button"
              onClick={() => navigate('/healthalert')}
              aria-label="Go to Health Alert Dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        
        <div className="card-footer">
          <div className="secure-badge">
            <FiLock className="footer-icon" /> Secured by Khalti
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} NepAir Health Alert
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhaltiPayment;