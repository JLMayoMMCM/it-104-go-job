'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import './verify.css';

function VerifyContent() {
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is an employee verification
    const userType = searchParams.get('type');
    const emailParam = searchParams.get('email');
    
    if (userType === 'employee') {
      setIsEmployee(true);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !verificationCode) {
      setError('Email and verification code are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verification_code: verificationCode
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/app-login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Verification code sent! Please check your email.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">        <div className="verify-header">
          <Image 
            src="/Assets/Title.png" 
            alt="Go Job Logo" 
            width={80} 
            height={80}
            className="logo"
          />
          <h1>Verify Your Email</h1>
          {isEmployee ? (
            <div className="employee-verification-notice">
              <p className="primary-text">Employee Verification Required</p>
              <p className="secondary-text">
                The verification code has been sent to your company's HR email address. 
                Please contact your HR department to obtain the verification code.
              </p>
              <div className="employee-info-box">
                <strong>Important:</strong> For security reasons, employee verifications are 
                sent to the company email to ensure authorized access.
              </div>
            </div>
          ) : (
            <p>We've sent a verification code to your email address</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button 
            type="submit" 
            className="verify-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>        <div className="verify-actions">
          <p>Didn't receive the code?</p>
          {isEmployee ? (
            <p className="employee-resend-note">
              Please contact your HR department or company administrator 
              for assistance with the verification code.
            </p>
          ) : (
            <button 
              type="button"
              onClick={handleResendCode}
              className="resend-btn"
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        <div className="verify-footer">        <p>Remember your password? <a href="/app-login">Sign in here</a></p>
        </div>
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={<div>Loading verification page...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
