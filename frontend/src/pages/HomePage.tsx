import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, CatIdentification } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CatIdentification | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setShowResult(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

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
                  Change Image
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p className="upload-text">Take a picture or upload an image</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  className="upload-button"
                  onClick={handleCameraClick}
                >
                  Choose Image
                </button>
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

