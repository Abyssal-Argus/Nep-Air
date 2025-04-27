import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs'; // ✅ Correct package for browser
import axios from 'axios';
import './ReportPollutionPage.css';

const ReportPollutionPage = () => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    location: '',
    description: '',
    pollutionType: 'smoke',
    severity: 'medium',
    image: null,
    imagePreview: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isVehicleImage, setIsVehicleImage] = useState(null);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  const cloudName = 'dp8th7yoy';
  const uploadPreset = 'pollution_reports';

  const pollutionTypes = [
    { value: 'smoke', label: 'Black Smoke' },
    { value: 'dust', label: 'Excessive Dust' },
    { value: 'liquid', label: 'Liquid Pollution' },
    { value: 'noise', label: 'White smoke' },
    { value: 'other', label: 'Other' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'extreme', label: 'Extreme' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please select a valid image (JPEG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    const imageURL = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: imageURL
    }));
    setError(null);

    // Run MobileNet model to validate if image is a vehicle
    const img = new Image();
    img.src = imageURL;
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const model = await mobilenet.load();
      const predictions = await model.classify(img);

      const vehicleKeywords = ['car', 'truck', 'bus', 'motorcycle', 'bike', 'van', 'vehicle'];
      const match = predictions.some(pred =>
        vehicleKeywords.some(keyword =>
          pred.className.toLowerCase().includes(keyword)
        )
      );

      setIsVehicleImage(match);
      if (!match) {
        setError('Only vehicle images are accepted. Please upload a valid vehicle photo.');
        setFormData(prev => ({ ...prev, image: null, imagePreview: null }));
      }
    };
  };

  const uploadImageToCloudinary = async (imageFile) => {
    const data = new FormData();
    data.append('file', imageFile);
    data.append('upload_preset', uploadPreset);
    data.append('folder', 'pollution_reports');

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      data,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      }
    );
    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      width: response.data.width,
      height: response.data.height,
    };
  };

  const submitReportToBackend = async (reportData) => {
    console.log('Submitting:', reportData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.location) {
      setError('Vehicle number and location are required.');
      return;
    }

    if (formData.image && !isVehicleImage) {
      setError('Please upload a valid vehicle image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      let imageData = null;
      if (formData.image) {
        imageData = await uploadImageToCloudinary(formData.image);
      }

      const reportData = {
        vehicleNumber: formData.vehicleNumber.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        pollutionType: formData.pollutionType,
        severity: formData.severity,
        image: imageData,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      await submitReportToBackend(reportData);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-background">
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="report-form">
            <h2 className="form-title">Report Polluting Vehicle</h2>

            {error && <div className="error-message">{error}</div>}
            <h1 className='form-lebels'>Vehicle Number</h1>
            <input
              type="text"
              name="vehicleNumber"
              placeholder="Vehicle Number"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
            />
            <h1 className='form-lebels'>Location</h1>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              required
            />
            <h1 className='form-lebels'>Pollution Type</h1>
            <select
              name="pollutionType"
              value={formData.pollutionType}
              onChange={handleChange}
            >
              {pollutionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <h1 className='form-lebels'>Severity</h1>
            <div className="severity-options">
              {severityLevels.map(level => (
                <label key={level.value}>
                  <input
                    type="radio"
                    name="severity"
                    value={level.value}
                    checked={formData.severity === level.value}
                    onChange={handleChange}
                  />
                  {level.label}
                </label>
              ))}
            </div>
            <h1 className='form-lebels'>Description</h1>
            <textarea
              name="description"
              placeholder="Description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
            <h1 className='form-lebels'>Photo</h1>
            <div className='photos'>
            <input
              type="file"
              accept="image/*"
              className='custom-file-input'
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            </div>

            {formData.imagePreview && (
              <div>
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  ref={imageRef}
                  style={{ maxWidth: '100%', marginTop: '10px' }}
                />
                {uploadProgress > 0 && (
                  <div className="upload-progress-bar">
                    <div
                      className="upload-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
            <div className='buttonSub'>
            <button type="submit" className='submitButton' disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportPollutionPage;
