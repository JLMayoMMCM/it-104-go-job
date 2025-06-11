'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './forgot-password.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: email input, 2: success message
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email address.');
        setStep(2);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send reset instructions');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/app-login');
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">        <div className="forgot-password-header">
          <Image 
            src="/Assets/Title.png" 
            alt="Go Job Logo" 
            width={80} 
            height={80}
            className="logo"
          />
          
          {step === 1 ? (
            <>
              <h1>Forgot Password?</h1>
              <p>Don't worry! Enter your email address and we'll send you instructions to reset your password.</p>
            </>
          ) : (
            <>
              <h1>Check Your Email</h1>
              <p>We've sent password reset instructions to your email address.</p>
            </>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="reset-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <div className="success-content">
            <div className="success-icon">📧</div>
            <div className="success-message">{message}</div>
            <div className="success-details">
              <p>If you don't see the email in your inbox, please check your spam folder.</p>
              <p>The reset link will expire in 1 hour for security reasons.</p>
            </div>
          </div>
        )}

        <div className="forgot-password-footer">
          <button 
            type="button"
            onClick={handleBackToLogin}
            className="back-to-login-btn"
          >
            ← Back to Login
          </button>
          
          {step === 1 && (
            <p className="register-link">
              Don't have an account? <a href="/app-login/register">Sign up here</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
