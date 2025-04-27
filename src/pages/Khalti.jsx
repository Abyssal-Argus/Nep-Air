import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiLoader, FiShield, FiAlertCircle } from "react-icons/fi";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import myKey from "./khaltiKey";
import { useNavigate } from 'react-router-dom';

const Khalti = ({ payment, months, onSuccess }) => {
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const initiatePayment = async () => {
    setIsLoading(true);
    setPaymentStatus("processing");
    setError("");

    const subscriptionData = JSON.parse(sessionStorage.getItem('healthAlertSubscription'));

    if (!subscriptionData) {
      setError("Subscription data not found. Please try again.");
      setIsLoading(false);
      setPaymentStatus("failed");
      return;
    }

    const data = {
      return_url: `${window.location.origin}/khalti-payment`,
      website_url: window.location.origin,
      amount: payment * 100,
      purchase_order_id: `health_alert_${Date.now()}`,
      purchase_order_name: `Health Alert Subscription (${months} Month${months > 1 ? 's' : ''})`,
      customer_info: {
        name: "NepAIr Customer",
        email: subscriptionData.email,
        phone: subscriptionData.phoneNumber,
      },
      amount_breakdown: [
        {
          label: `Subscription Fee (${months} Month${months > 1 ? 's' : ''})`,
          amount: payment * 100,
        },
      ],
      product_details: [
        {
          identity: "health_alert_sub",
          name: `Health Alert Subscription (${months} Month${months > 1 ? 's' : ''})`,
          total_price: payment * 100,
          quantity: 1,
          unit_price: payment * 100,
        },
      ],
    };

    const headers = {
      Authorization: `Key ${myKey.secretKey}`,
    };

    try {
      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        data,
        { headers }
      );
      

      if (response.data?.payment_url) {
        // Save transaction
        const transactionRef = doc(db, 'transactions', response.data.pidx);
        await setDoc(transactionRef, {
          pidx: response.data.pidx,
          amount: payment,
          months: months,
          status: 'initiated',
          userEmail: subscriptionData.email,
          userPhone: subscriptionData.phoneNumber,
          createdAt: serverTimestamp(),
          expiryDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
        });

        window.location.href = response.data.payment_url;
      } else {
        throw new Error("Invalid response from payment gateway");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.response?.data?.detail || "Payment initiation failed. Please try again.");
      setPaymentStatus("failed");
      setIsLoading(false);
    }
  };

  const verifyPayment = async (pidx) => {
    setIsLoading(true);
    setPaymentStatus("processing");

    const headers = {
      Authorization: `Key ${myKey.secretKey}`,
    };
    

    try {
      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        { pidx },
        { headers }
      );

      if (response.data?.status === "Completed") {
        // Update Firestore
        const transactionRef = doc(db, 'transactions', pidx);
        await setDoc(transactionRef, {
          status: 'completed',
          paidAt: serverTimestamp(),
          transactionDetails: response.data
        }, { merge: true });

        const subscriptionData = JSON.parse(sessionStorage.getItem('healthAlertSubscription'));
        if (subscriptionData?.userId) {
          const userRef = doc(db, 'users', subscriptionData.userId);
          await setDoc(userRef, {
            healthAlert: {
              subscribed: true,
              stations: subscriptionData.stations,
              diseases: subscriptionData.diseases,
              phoneNumber: subscriptionData.phoneNumber,
              paymentInfo: {
                amount: payment,
                date: serverTimestamp(),
                months: months,
                transactionId: pidx,
                expiryDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
              }
            }
          }, { merge: true });
        }

        sessionStorage.setItem('paymentSuccess', 'true');
        setPaymentStatus("success");
        if (onSuccess) onSuccess(response.data);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(err.response?.data?.detail || "Payment verification failed. Please contact support.");
      setPaymentStatus("failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const pidx = queryParams.get('pidx');
    const status = queryParams.get('status');

    if (pidx && status === 'Completed') {
      verifyPayment(pidx);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      {paymentStatus === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FiShield className="text-green-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been activated for {months} month{months > 1 ? 's' : ''}.
          </p>
          <button
            onClick={() => navigate('/health-alert')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            View Subscription
          </button>
        </motion.div>
      ) : paymentStatus === "failed" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FiAlertCircle className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
          <p className="text-red-500 mb-4">{error || "There was an issue processing your payment."}</p>
          <button
            onClick={() => {
              setPaymentStatus("idle");
              setError("");
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Payment</h2>
            <p className="text-gray-600">
              Pay NPR {payment} for {months} month{months > 1 ? 's' : ''} subscription
            </p>
          </div>

          <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subscription</span>
              <span className="font-medium">NPR {payment}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{months} Month{months > 1 ? 's' : ''}</span>
            </div>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>NPR {payment}</span>
            </div>
          </div>

          <button
            onClick={initiatePayment}
            disabled={isLoading}
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2" /> Processing...
              </>
            ) : (
              "Pay with Khalti"
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            By clicking "Pay with Khalti", you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      )}
    </div>
  );
};

export default Khalti;
