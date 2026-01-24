import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-animation">
          <h1 className="not-found-404">404</h1>
          <div className="not-found-emoji">😕</div>
        </div>
        
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="not-found-actions">
          <button 
            className="btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

        <div className="not-found-links">
          <p>Quick Links:</p>
          <div className="quick-links">
            <button onClick={() => navigate('/surveys')}>Surveys</button>
            <button onClick={() => navigate('/withdraw')}>Withdraw</button>
            <button onClick={() => navigate('/activate')}>Activate</button>
          </div>
        </div>
      </div>
    </div>
  );
}
