import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, CatIdentification } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CatIdentification | null>(null);
  const [showResult, setShowResult] = useState(false);

// Camera-related state
const [isCameraActive, setIsCameraActive] = useState(false);
const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // To create a button to upload an image
  const fileInputRef = useRef<HTMLInputElement>(null);
  // To create a button to open the camera
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

useEffect(()=> {
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (error) {
      console.log('Error getting cameras:', error);
    }
  };

  // Only enumerate if we have permission (after first camera access)
  if (isCameraActive) {
    getCameras();
  }
}, [isCameraActive]);

useEffect(()=> {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
}, []);

const startCamera = async (deviceId?: string) => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: facingMode }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Get the actual device ID from the active track
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.deviceId) {
        setCurrentCameraId(settings.deviceId);
      }

      // Enumerate devices after permission is granted to get full list with labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      console.log('Cameras found:', videoDevices.length, videoDevices);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCameraActive(true);
      if (deviceId) {
        setCurrentCameraId(deviceId);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCurrentCameraId(null);
  };

  const switchCamera = async () => {
    if (availableCameras.length < 2) {
      alert('Only one camera available');
      return;
    }

    // Find current camera index
    const currentIndex = currentCameraId 
      ? availableCameras.findIndex(cam => cam.deviceId === currentCameraId)
      : -1;
    
    // Switch to next camera
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    await startCamera(nextCamera.deviceId);
    
    // Update facing mode based on camera label (if available)
    const label = nextCamera.label.toLowerCase();
    if (label.includes('front') || label.includes('user')) {
      setFacingMode('user');
    } else if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      setFacingMode('environment');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setPreviewUrl(URL.createObjectURL(blob));
          setResult(null);
          setShowResult(false);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setShowResult(false);
    }
  };

  const handleCameraClick = async () => {
    console.log('Button clicked');
    console.log('cameraInputRef.current:', cameraInputRef.current);
    if (isCameraActive){
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const identification = await apiService.uploadImage(selectedImage);
      setResult(identification);
      setShowResult(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to identify cat breed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1 className="home-title">WCIT</h1>
          <p className="home-description">
            What Cat Is That? As a fellow cat enthusiast, every time I see a cat, 
            I wonder "hmm, what type of cat is that?" This app helps you identify 
            cat breeds using AI technology. Simply upload a photo or take a picture 
            to discover what breed your feline friend is!
          </p>
        </header> 

{/* 
          <div className="upload-section">
          <div className="upload-area">
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button 
                  className="change-image-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">🖼️</div>
                <p className="upload-text">Upload Image</p>

                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  //capture="enivornment" makes the browser open the camera
                  // no capture means it will select a photo from the file picker
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display:'none' }}
                  id="camera-input"
                  />

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-input"
                />

              <div className="button-group" style={{ display:'flex', gap:'10px', justifyContent:'center'}}>

              <button
              className="upload-button"
              onClick={handleFileUploadClick}
              type="button"
              >
                📁 Choose Photo
              </button>

                <button 
                  className="upload-button"
                  onClick={handleCameraClick}
                  type="button"
                >
                  📷 Take Photo
                </button>

              </div>
            </div>
            )}
          </div> 

          {selectedImage && !result && (
            <button
              className="identify-button"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? 'Identifying...' : 'Identify Cat Breed'}
            </button>
          )}
        </div> */}

<div className="upload-section">
          <div className="upload-area">
            {isCameraActive ? (
              <div className="camera-preview-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-preview"
                />
                <div className="camera-controls">
                  {availableCameras.length > 1 && (
                    <button
                      className="switch-camera-btn"
                      onClick={switchCamera}
                      type="button"
                    >
                      🔄 Switch Camera
                    </button>
                  )}
                  <button
                    className="capture-btn"
                    onClick={capturePhoto}
                    type="button"
                  >
                    📸 Capture
                  </button>
                  <button
                    className="cancel-camera-btn"
                    onClick={stopCamera}
                    type="button"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button 
                  className="change-image-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">🖼️</div>
                <p className="upload-text">Upload Image</p>

                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display:'none' }}
                  id="camera-input"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-input"
                />

                <div className="button-group" style={{ display:'flex', gap:'10px', justifyContent:'center'}}>
                  <button
                    className="upload-button"
                    onClick={handleFileUploadClick}
                    type="button"
                  >
                    📁 Choose Photo
                  </button>

                  <button 
                    className="upload-button"
                    onClick={handleCameraClick}
                    type="button"
                  >
                    📷 Take Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedImage && !result && (
            <button
              className="identify-button"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? 'Identifying...' : 'Identify Cat Breed'}
            </button>
          )}
        </div>
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your cat...</p>
          </div>
        )}

        {showResult && result && (
          <div className="result-modal-overlay" onClick={handleCloseResult}>
            <div className="result-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={handleCloseResult}>×</button>
              
              <div className="result-header">
                <h2>Congratulations!</h2>
                <p className="result-breed">You have found a <strong>{result.breedName}</strong></p>
              </div>

              <div className="result-content">
                <div className="confidence-section">
                  <p className="confidence-label">Confidence: {result.confidence}%</p>
                </div>

                {result.alternativeBreeds.length > 0 && (
                  <div className="alternatives-section">
                    <h3>Other Possible Breeds:</h3>
                    <ul className="alternatives-list">
                      {result.alternativeBreeds.map((alt, index) => (
                        <li key={index} className="alternative-item">
                          <span className="breed-name">{alt.breed}</span>
                          <span className="percentage">{alt.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.funFacts.length > 0 && (
                  <div className="fun-facts-section">
                    <h3>Fun Facts:</h3>
                    <ul className="fun-facts-list">
                      {result.funFacts.map((fact, index) => (
                        <li key={index} className="fun-fact-item">{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="result-actions">
                <button 
                  className="view-collection-btn"
                  onClick={() => {
                    navigate('/gallery');
                    setShowResult(false);
                  }}
                >
                  View My Collection
                </button>
                <button 
                  className="identify-another-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setResult(null);
                    setShowResult(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Identify Another Cat
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="home-nav">
          <button 
            className="nav-button"
            onClick={() => navigate('/gallery')}
          >
            View My Collection
          </button>
        </nav>
      </div>
    </div>
  );
};

export default HomePage;

