'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [returnUrl, setReturnUrl] = useState('/');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get the return URL from search params or referrer
    const returnUrlParam = searchParams.get('returnUrl');
    const referrer = document.referrer;
    
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    } else if (referrer && !referrer.includes('/app-login')) {
      // Only use referrer if it's not the login page
      try {
        const url = new URL(referrer);
        setReturnUrl(url.pathname);
      } catch (e) {
        setReturnUrl('/');
      }
    }

    // Get error message from search params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleLogin = () => {
    // Store the return URL for after login
    sessionStorage.setItem('returnUrl', returnUrl);
    router.push('/app-login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="error-icon">🚫</div>
        
        <h1 className="error-title">Access Denied</h1>
        
        <div className="error-message">
          {error || 'You need to be logged in to access this page.'}
        </div>
        
        <div className="error-details">
          Please log in with the appropriate account type to continue.
        </div>
        
        <div className="action-buttons">
          <button 
            className="login-btn"
            onClick={handleLogin}
          >
            Go to Login
          </button>
          
          <button 
            className="home-btn"
            onClick={handleGoHome}
          >
            Go to Home
          </button>
        </div>
        
        {returnUrl !== '/' && (
          <div className="return-info">
            After logging in, you'll be redirected to: <strong>{returnUrl}</strong>
          </div>
        )}
      </div>

      <style jsx>{`
        .unauthorized-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .unauthorized-card {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(231, 76, 60, 0.2);
          padding: 40px;
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .error-title {
          font-size: 32px;
          font-weight: bold;
          color: #e74c3c;
          margin-bottom: 20px;
        }

        .error-message {
          font-size: 18px;
          color: #2c3e50;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .error-details {
          font-size: 16px;
          color: #7f8c8d;
          margin-bottom: 30px;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .login-btn, .home-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .login-btn {
          background: #e74c3c;
          color: white;
        }

        .login-btn:hover {
          background: #c0392b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        .home-btn {
          background: #95a5a6;
          color: white;
        }

        .home-btn:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
        }

        .return-info {
          font-size: 14px;
          color: #7f8c8d;
          padding: 15px;
          background: #ecf0f1;
          border-radius: 8px;
          border-left: 4px solid #e74c3c;
        }

        @media (max-width: 480px) {
          .action-buttons {
            flex-direction: column;
          }
          
          .unauthorized-card {
            padding: 30px 20px;
          }
          
          .error-title {
            font-size: 24px;
          }
          
          .error-icon {
            font-size: 48px;
          }
        }
      `}</style>
    </div>
  );
}
