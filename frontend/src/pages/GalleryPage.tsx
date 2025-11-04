import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, CatIdentification } from '../services/api';
import './GalleryPage.css';

const GalleryPage: React.FC = () => {
  const [cats, setCats] = useState<CatIdentification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCats();
  }, []);

  const loadCats = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCats();
      setCats(data);
    } catch (error) {
      console.error('Error loading cats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your cat collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-container">
        <header className="gallery-header">
          <h1 className="gallery-title">My Cat Collection</h1>
          <p className="gallery-subtitle">
            All the cats you've identified are stored here
          </p>
        </header>

        {cats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐱</div>
            <h2>No cats yet!</h2>
            <p>Start identifying cats to build your collection</p>
            <button 
              className="start-button"
              onClick={() => navigate('/')}
            >
              Identify Your First Cat
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {cats.map((cat) => (
              <div key={cat.id} className="cat-card">
                <div className="cat-image-container">
                  <img 
                    src={cat.imageUrl} 
                    alt={cat.breedName}
                    className="cat-image"
                  />
                </div>
                
                <div className="cat-info">
                  <h3 className="cat-breed-name">{cat.breedName}</h3>
                  
                  <button
                    className="details-toggle"
                    onClick={() => toggleExpand(cat.id)}
                  >
                    {expandedId === cat.id ? 'Hide Details' : 'Show Details'}
                    <span className={`toggle-icon ${expandedId === cat.id ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {expandedId === cat.id && (
                    <div className="cat-details">
                      <div className="detail-section">
                        <h4>Confidence</h4>
                        <p className="confidence-value">{cat.confidence}%</p>
                      </div>

                      {cat.alternativeBreeds.length > 0 && (
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
                      )}

                      {cat.funFacts.length > 0 && (
                        <div className="detail-section">
                          <h4>Fun Facts</h4>
                          <ul className="fun-facts-list">
                            {cat.funFacts.map((fact, index) => (
                              <li key={index} className="fun-fact-item">{fact}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="detail-section">
                        <h4>Identified On</h4>
                        <p className="date-value">
                          {new Date(cat.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <nav className="gallery-nav">
          <button 
            className="nav-button"
            onClick={() => navigate('/')}
          >
            Identify Another Cat
          </button>
        </nav>
      </div>
    </div>
  );
};

export default GalleryPage;

