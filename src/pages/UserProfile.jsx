import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import BG from '../assets/BGG.jpg';
import { FiUser, FiInfo, FiAlertTriangle, FiEdit, FiSave, FiX, FiPlus, FiBell } from 'react-icons/fi';
import './UserProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    healthAlert: {
      diseases: [],
      stations: [],
      subscribed: false,
    },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(userData);
            setFormData({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              age: userData.age || '',
              gender: userData.gender || '',
              email: userData.email || '',
              healthAlert: userData.healthAlert || {
                diseases: [],
                stations: [],
                subscribed: false,
              },
            });
          } else {
            console.error("User data not found.");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleHealthAlertChange = (field, index, value) => {
    const updatedHealthAlert = { ...formData.healthAlert };
    if (field === 'diseases') {
      updatedHealthAlert.diseases[index] = value;
    } else if (field === 'stations') {
      updatedHealthAlert.stations[index] = value;
    }
    setFormData({ ...formData, healthAlert: updatedHealthAlert });
  };

  const handleAddField = (field) => {
    const updatedHealthAlert = { ...formData.healthAlert };
    if (field === 'diseases') {
      updatedHealthAlert.diseases.push('');
    } else if (field === 'stations') {
      updatedHealthAlert.stations.push('');
    }
    setFormData({ ...formData, healthAlert: updatedHealthAlert });
  };

  const handleRemoveField = (field, index) => {
    const updatedHealthAlert = { ...formData.healthAlert };
    if (field === 'diseases') {
      updatedHealthAlert.diseases.splice(index, 1);
    } else if (field === 'stations') {
      updatedHealthAlert.stations.splice(index, 1);
    }
    setFormData({ ...formData, healthAlert: updatedHealthAlert });
  };

  const handleSaveChanges = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age,
          gender: formData.gender,
          email: formData.email,
          healthAlert: formData.healthAlert,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading" style={{ backgroundImage: `url(${BG})` }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-background" style={{ backgroundImage: `url(${BG})` }}></div>
      <div className="profile-glass-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1>
              <FiUser className="profile-icon" />
              User Profile
            </h1>
            {!isEditing ? (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit /> Edit Profile
              </button>
            ) : null}
          </div>

          <div className="profile-sections">
            <div className="profile-section personal-info">
              <h2>
                <FiInfo className="section-icon" />
                Personal Information
              </h2>
              
              <div className="profile-field">
                <label>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.firstName || '-'}</div>
                )}
              </div>

              <div className="profile-field">
                <label>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.lastName || '-'}</div>
                )}
              </div>

              <div className="profile-field">
                <label>Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.age || '-'}</div>
                )}
              </div>

              <div className="profile-field">
                <label>Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="profile-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="profile-value">
                    {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : '-'}
                  </div>
                )}
              </div>

              <div className="profile-field">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-value">{formData.email || '-'}</div>
                )}
              </div>
            </div>

            <div className="profile-section health-alerts">
              <h2>
                <FiAlertTriangle className="section-icon" />
                Health Alerts
              </h2>
              
              <div className="profile-field">
                <label>Diseases</label>
                {formData.healthAlert.diseases.length > 0 ? (
                  formData.healthAlert.diseases.map((disease, index) => (
                    <div key={index} className="multi-field-item">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={disease}
                            onChange={(e) => handleHealthAlertChange('diseases', index, e.target.value)}
                            className="profile-input"
                          />
                          <button 
                            className="remove-item-btn"
                            onClick={() => handleRemoveField('diseases', index)}
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <div className="profile-value">{disease}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="profile-value">No diseases specified</div>
                )}
                {isEditing && (
                  <button 
                    className="add-item-btn"
                    onClick={() => handleAddField('diseases')}
                  >
                    <FiPlus /> Add Disease
                  </button>
                )}
              </div>

              <div className="profile-field">
                <label>Monitoring Stations</label>
                {formData.healthAlert.stations.length > 0 ? (
                  formData.healthAlert.stations.map((station, index) => (
                    <div key={index} className="multi-field-item">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={station}
                            onChange={(e) => handleHealthAlertChange('stations', index, e.target.value)}
                            className="profile-input"
                          />
                          <button 
                            className="remove-item-btn"
                            onClick={() => handleRemoveField('stations', index)}
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <div className="profile-value">{station}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="profile-value">No stations specified</div>
                )}
                {isEditing && (
                  <button 
                    className="add-item-btn"
                    onClick={() => handleAddField('stations')}
                  >
                    <FiPlus /> Add Station
                  </button>
                )}
              </div>

              <div className="profile-field">
                <label>Alert Subscription</label>
                {isEditing ? (
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.healthAlert.subscribed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          healthAlert: {
                            ...formData.healthAlert,
                            subscribed: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="slider round"></span>
                    <span className="toggle-label">
                      {formData.healthAlert.subscribed ? (
                        <><FiBell /> Subscribed</>
                      ) : (
                        "Not Subscribed"
                      )}
                    </span>
                  </label>
                ) : (
                  <div className="profile-value">
                    {formData.healthAlert.subscribed ? (
                      <span className="subscribed"><FiBell /> Subscribed</span>
                    ) : (
                      <span className="not-subscribed">Not Subscribed</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button 
                className="save-btn"
                onClick={handleSaveChanges}
              >
                <FiSave /> Save Changes
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                <FiX /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;