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
  
// Used for error message pop up
const [showError, setShowError] = useState(false);
const [errorReason, setErrorReason] = useState("");

const SAMPLE_PHOTOS = [
  { id: 'sphynx', label: 'Sphynx', src: '/samples/sphynx.jpg', filename: 'sphynx.jpg' },
  { id: 'american-shorthair', label: 'American Shorthair', src: '/samples/american-shorthair.jpg', filename: 'american-shorthair.jpg' },
  { id: 'dog', label: 'Dog', src: '/samples/dog.jpg', filename: 'dog.jpg' },
  { id: 'lion', label: 'Lion', src: '/samples/lion.jpg', filename: 'lion.jpg' },
];

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

// Add this useEffect after your existing useEffects
useEffect(() => {
  if (isCameraActive && streamRef.current && videoRef.current) {
    console.log('Setting video srcObject from useEffect');
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play()
      .then(() => {
        console.log('Video started from useEffect');
      })
      .catch((error) => {
        console.error('Error playing video in useEffect:', error);
      });
  }
}, [isCameraActive]);

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

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted with stream:', stream);
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

      // Set camera active first so the video element renders
      setIsCameraActive(true);
      
      // Use setTimeOut to ensure the video element is rendered before assigning stream
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          console.log('Assigning stream to video element');
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play()
            .then(() => {
              console.log('Video playback started successfully');
            })
            .catch((playError) => {
              console.error('Error playing video:', playError);
            });
        } else {
          console.error('Video ref or stream is null:', { 
            videoRef: videoRef.current, 
            stream: streamRef.current 
          });
        }
      }, 100);
      
      if (deviceId) {
        setCurrentCameraId(deviceId);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setIsCameraActive(false);
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
    setShowError(false);

    try {
      const identification = await apiService.uploadImage(selectedImage);
      setResult(identification);
      setShowResult(false);
    } catch (error:any) {
      console.log(`Error caught in handleUpload:`, error);
      if (error.message === "MEOWRRER404 Thats not a cat" || error.message?.includes("MEOWRRER404")) {
        const reason = error.reason || "The image does not contain a cat";
        setErrorReason(reason);
        setShowError(true);
      } else {
      console.error('Error uploading image:', error);
      setErrorReason('Failed to identify cat breed. Please try again.');
      setShowError(true);
    } 
  }finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    setErrorReason("");
  };

  const handleSamplePhotoClick = async (sample:typeof SAMPLE_PHOTOS[0]) => {
    try {
      const res = await fetch(sample.src);
      if (!res.ok) throw new Error(`Image not foung`);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, {type:blob.type || 'image/jpeg'});
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setShowResult(false);
      setShowError(false);
    } catch (e) {
      console.error('Failed to load sample:', e);
      alert(`Sample image not found. Add ${sample.filename} to public/samples/ `);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="page-bg-doodle"></div>
        <div className="walking-character"></div>
        <header className="home-header">
          <h1 className="home-title">W.C.I.T</h1>
          <h4 className="home-subtitle">What Cat Is That?</h4>
          <p className="home-description">
            As a fellow cat enthusiast, every time I see a cat, 
            I wonder "hmm, what type of cat is that?" This app helps you identify 
            cat breeds using AI technology! Simply upload a photo or take a picture 
            of your feline friend to discover what breed it is as well as a few fun facts!
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

        <div className="sample-photos-section">
          <h3 className="sample-photos-title">Try sample photos</h3>
          <p className="sample-photos-subtitle">Dont have a cat yourself? Either screenshot a cat online or use one of our sample "cats", DONT CLICK THE DOG</p>
          <div className = "sample-photos-grid">
          {SAMPLE_PHOTOS.map((sample) => (
            <button key = {sample.id} type = "button" className = "sample-photos-card" onClick={()=>handleSamplePhotoClick(sample)}>
              <img src={sample.src} alt={sample.label} className="sample-photo-image" />
              <span className="sample-photo-label">{sample.label}</span>
            </button>
          ))}
          </div>
        </div>

          
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your cat...</p>
          </div>
        )}

        {showResult && result && (
          <div className="result-modal-overlay" onClick={handleCloseError}>
            <div className="result-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={handleCloseError}>×</button>
              
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

                {/* {cat.alternativeBreeds.length > 0 && (
                        <div className="detail-section">
                          <h4>Other Possible Breeds</h4>
                          <ul className="alternatives-list">
                            {cat.alternativeBreeds.map((alt, index) => (
                              <li key={index} className="alternative-item">
                                <span className="breed-name">{alt.breed}</span>
                                <span className="percentage">{alt.percentage}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )} */}

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

              <div className="detail-section">
                        <h4>Rarity</h4>
                        <p className="rarity-value">{result.rarity || "Common"}</p>
                      </div>

                      <div className="detail-section">
                        <h4>Difficulty</h4>
                        <p className="difficulty-value">{result.difficulty || "Easy"}</p>
                      </div>

                      <div className="detail-section">
                        <h4>Place of Origin</h4>
                        <p className="origin-value">{result.placeOfOrigin || "Unknown"}</p>
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

        {showError && (
          <div className="error-modal-overlay" onClick={handleCloseError}>
            <div className="error-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={handleCloseError}>×</button>
              
              <div className="error-header">
                <h2>🐾 MEOWRRER404</h2>
                <p className="error-title">That's not a cat!</p>
              </div>

              <div className="error-content">
                <p className="error-message">{errorReason}</p>
              </div>

              <div className="error-actions">
                <button 
                  className="error-button"
                  onClick={handleCloseError}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default HomePage;

