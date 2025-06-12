import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.GOOGLE_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.GOOGLE_SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} - Success status
 */
export async function sendVerificationEmail(email, verificationCode, userName = '') {
  try {
    const mailOptions = {
      from: {
        name: 'GO JOB - Account Verification',
        address: process.env.SMTP_USER
      },
      to: email,
      subject: 'Verify Your GO JOB Account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    color: #5585b5;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .verification-code {
                    background: linear-gradient(135deg, #5585b5 0%, #53a8b6 50%, #79c2d0 100%);
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    letter-spacing: 4px;
                    margin: 20px 0;
                }
                .instructions {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">GO JOB</div>
                    <h1 style="color: #5585b5; margin: 0;">Account Verification</h1>
                </div>
                
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                
                <p>Thank you for registering with GO JOB! To complete your account setup and start exploring job opportunities, please verify your email address.</p>
                
                <div class="verification-code">
                    ${verificationCode}
                </div>
                
                <div class="instructions">
                    <h3 style="margin-top: 0; color: #5585b5;">How to verify:</h3>
                    <ol>
                        <li>Go to the verification page on GO JOB</li>
                        <li>Enter the 6-digit code shown above</li>
                        <li>Click "Verify Account" to complete the process</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <strong>Important:</strong> This verification code will expire in 24 hours for security reasons. If you didn't request this verification, please ignore this email.
                </div>
                
                <p>Once verified, you'll be able to:</p>
                <ul>
                    <li>Browse and apply for jobs</li>
                    <li>Create and manage your professional profile</li>
                    <li>Connect with potential employers</li>
                    <li>Receive job recommendations tailored to your skills</li>
                </ul>
                
                <div class="footer">
                    <p>If you need assistance, please contact our support team.</p>
                    <p><strong>GO JOB Team</strong><br>
                    Your Gateway to Career Success</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        GO JOB - Account Verification
        
        Hello${userName ? ` ${userName}` : ''},
        
        Thank you for registering with GO JOB! To complete your account setup, please verify your email address.
        
        Your verification code is: ${verificationCode}
        
        Instructions:
        1. Go to the verification page on GO JOB
        2. Enter the 6-digit code: ${verificationCode}
        3. Click "Verify Account" to complete the process
        
        This verification code will expire in 24 hours.
        
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        GO JOB Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', {
      to: email,
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send welcome email for company registration (no verification needed)
 * @param {string} email - Company email address
 * @param {string} companyName - Company name
 * @returns {Promise<boolean>} - Success status
 */
export async function sendCompanyWelcomeEmail(email, companyName) {
  try {
    const mailOptions = {
      from: {
        name: 'GO JOB - Welcome',
        address: process.env.SMTP_USER
      },
      to: email,
      subject: `Welcome to GO JOB, ${companyName}!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to GO JOB</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    color: #5585b5;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .welcome-banner {
                    background: linear-gradient(135deg, #5585b5 0%, #53a8b6 50%, #79c2d0 100%);
                    color: white;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .features {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">GO JOB</div>
                    <h1 style="color: #5585b5; margin: 0;">Welcome to Our Platform!</h1>
                </div>
                
                <div class="welcome-banner">
                    <h2 style="margin: 0;">${companyName}</h2>
                    <p style="margin: 10px 0 0 0;">Your company has been successfully added to GO JOB!</p>
                </div>
                
                <p>Congratulations! ${companyName} is now part of the GO JOB network, connecting talented professionals with exciting career opportunities.</p>
                
                <div class="features">
                    <h3 style="margin-top: 0; color: #5585b5;">What's Next?</h3>
                    <ul>
                        <li><strong>Create Job Postings:</strong> Start attracting top talent by posting your open positions</li>
                        <li><strong>Browse Candidates:</strong> Explore our database of qualified job seekers</li>
                        <li><strong>Manage Applications:</strong> Review and respond to candidate applications</li>
                        <li><strong>Build Your Brand:</strong> Showcase your company culture and values</li>
                    </ul>
                </div>
                
                <p>Our platform is designed to help you find the perfect candidates efficiently and effectively. You can start posting jobs and connecting with talented professionals right away.</p>
                
                <p>If you need to create employer accounts for your team members, they can register as employees and link to your company profile.</p>
                
                <div class="footer">
                    <p>Thank you for choosing GO JOB as your recruitment partner!</p>
                    <p><strong>GO JOB Team</strong><br>
                    Connecting Talent with Opportunity</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        GO JOB - Welcome!
        
        Congratulations! ${companyName} has been successfully added to GO JOB!
        
        Your company is now part of our network, connecting talented professionals with exciting career opportunities.
        
        What's Next:
        - Create Job Postings: Start attracting top talent
        - Browse Candidates: Explore our database of qualified job seekers  
        - Manage Applications: Review and respond to applications
        - Build Your Brand: Showcase your company culture
        
        You can start posting jobs and connecting with talented professionals right away.
        
        Thank you for choosing GO JOB as your recruitment partner!
        
        Best regards,
        GO JOB Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Company welcome email sent successfully:', {
      to: email,
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send company welcome email:', error);
    return false;
  }
}

/**
 * Send verification email to employee with company branding
 * @param {string} email - Employee's email address
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} userName - Employee's name (optional)
 * @param {object} companyInfo - Company information for branding
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmployeeVerificationEmail(email, verificationCode, userName = '', companyInfo) {
  try {
    const companyName = companyInfo?.company_name || 'Your Company';
    const companyEmail = companyInfo?.company_email || process.env.SMTP_USER;
    
    const mailOptions = {
      from: {
        name: `${companyName} - Account Verification`,
        address: process.env.SMTP_USER
      },
      replyTo: companyEmail,
      to: email,
      subject: `Verify Your ${companyName} Employee Account on GO JOB`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Employee Account</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .company-logo {
                    color: #2c3e50;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .go-job-logo {
                    color: #5585b5;
                    font-size: 18px;
                    font-weight: normal;
                    margin-top: 5px;
                }
                .verification-code {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #5a6c7d 100%);
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    letter-spacing: 4px;
                    margin: 20px 0;
                }
                .instructions {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .company-banner {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #5a6c7d 100%);
                    color: white;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #856404;
                }
                .branding-note {
                    background-color: #e3f2fd;
                    border: 1px solid #bbdefb;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #1565c0;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="company-logo">${companyName}</div>
                    <div class="go-job-logo">powered by GO JOB</div>
                    <h1 style="color: #2c3e50; margin: 10px 0 0 0;">Employee Account Verification</h1>
                </div>
                
                <div class="company-banner">
                    <h2 style="margin: 0;">Welcome to ${companyName}!</h2>
                    <p style="margin: 10px 0 0 0;">Complete your employee account setup on GO JOB</p>
                </div>
                
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                
                <p>Your employer, <strong>${companyName}</strong>, has set up an employee account for you on the GO JOB platform. To complete your account setup and access your employee portal, please verify your email address.</p>
                
                <div class="verification-code">
                    ${verificationCode}
                </div>
                
                <div class="instructions">
                    <h3 style="margin-top: 0; color: #2c3e50;">How to verify your employee account:</h3>
                    <ol>
                        <li>Go to the verification page on GO JOB</li>
                        <li>Enter the 6-digit code shown above</li>
                        <li>Click "Verify Account" to complete the process</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <strong>Important:</strong> This verification code will expire in 24 hours for security reasons. If you didn't expect this email or believe this is an error, please contact your HR department at ${companyName}.
                </div>
                
                <p>Once verified, you'll be able to:</p>
                <ul>
                    <li>Access your employee dashboard</li>
                    <li>View company job postings and internal opportunities</li>
                    <li>Manage your professional profile</li>
                    <li>Connect with colleagues and other professionals</li>
                    <li>Receive job recommendations and career development resources</li>
                </ul>
                
                <div class="branding-note">
                    <strong>Note:</strong> This verification email was sent on behalf of ${companyName} through the GO JOB platform. For any questions about your employment or account access, please contact your company's HR department.
                </div>
                
                <div class="footer">
                    <p>If you need technical assistance with the verification process, please contact GO JOB support.</p>
                    <p><strong>${companyName} HR Team</strong><br>
                    via GO JOB Platform</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        ${companyName} - Employee Account Verification
        
        Hello${userName ? ` ${userName}` : ''},
        
        Your employer, ${companyName}, has set up an employee account for you on the GO JOB platform. To complete your account setup, please verify your email address.
        
        Your verification code is: ${verificationCode}
        
        Instructions:
        1. Go to the verification page on GO JOB
        2. Enter the 6-digit code: ${verificationCode}
        3. Click "Verify Account" to complete the process
        
        This verification code will expire in 24 hours.
        
        If you didn't expect this email or believe this is an error, please contact your HR department at ${companyName}.
        
        Once verified, you'll be able to access your employee dashboard, view company opportunities, and manage your professional profile.
        
        Best regards,
        ${companyName} HR Team
        via GO JOB Platform
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Employee verification email sent successfully:', {
      to: email,
      company: companyName,
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send employee verification email:', error);
    return false;
  }
}

/**
 * Send employee verification email to company email (instead of personal email)
 * @param {string} companyEmail - Company's email address where verification will be sent
 * @param {string} employeeEmail - Employee's personal email address (for reference)
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} userName - Employee's name
 * @param {object} companyInfo - Company information for branding
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmployeeVerificationToCompanyEmail(companyEmail, employeeEmail, verificationCode, userName = '', companyInfo) {
  try {
    const companyName = companyInfo?.company_name || 'Your Company';
    
    const mailOptions = {
      from: {
        name: `GO JOB - Employee Verification`,
        address: process.env.SMTP_USER
      },
      to: companyEmail,
      subject: `Employee Account Verification Required - ${userName} (${employeeEmail})`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Employee Account Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .company-logo {
                    color: #2c3e50;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .go-job-logo {
                    color: #5585b5;
                    font-size: 18px;
                    font-weight: normal;
                    margin-top: 5px;
                }
                .verification-code {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #5a6c7d 100%);
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    letter-spacing: 4px;
                    margin: 20px 0;
                }
                .employee-info {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .company-banner {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #5a6c7d 100%);
                    color: white;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .instructions {
                    background-color: #e3f2fd;
                    border: 1px solid #bbdefb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #1565c0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="company-logo">${companyName}</div>
                    <div class="go-job-logo">powered by GO JOB</div>
                    <h1 style="color: #2c3e50; margin: 10px 0 0 0;">Employee Account Verification</h1>
                </div>
                
                <div class="company-banner">
                    <h2 style="margin: 0;">New Employee Registration</h2>
                    <p style="margin: 10px 0 0 0;">Verification required for company access</p>
                </div>
                
                <p>Dear ${companyName} HR Team,</p>
                
                <p>A new employee has registered for your company on the GO JOB platform. The verification email has been sent to your company email as requested.</p>
                
                <div class="employee-info">
                    <h3 style="margin-top: 0; color: #2c3e50;">Employee Details</h3>
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${employeeEmail}</p>
                    <p><strong>Company:</strong> ${companyName}</p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="verification-code">
                    ${verificationCode}
                </div>
                
                <div class="instructions">
                    <h3 style="margin-top: 0;">Verification Instructions</h3>
                    <p><strong>Important:</strong> Please share this verification code with ${userName} (${employeeEmail}) so they can complete their account setup.</p>
                    <ol>
                        <li>Forward this verification code to the employee: <strong>${verificationCode}</strong></li>
                        <li>The employee should go to the GO JOB verification page</li>
                        <li>They should enter the 6-digit code shown above</li>
                        <li>Click "Verify Account" to complete the process</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> This verification code will expire in 24 hours. Only share this code with the authorized employee. If this registration was not authorized by your company, please contact GO JOB support immediately.
                </div>
                
                <p><strong>Why verification is sent to company email:</strong></p>
                <ul>
                    <li>Enhanced security and control over employee access</li>
                    <li>Company oversight of new employee registrations</li>
                    <li>Centralized management of employee onboarding</li>
                    <li>Prevention of unauthorized employee accounts</li>
                </ul>
                
                <div class="footer">
                    <p>If you need assistance with employee management or verification, please contact GO JOB support.</p>
                    <p><strong>${companyName} HR Management</strong><br>
                    via GO JOB Platform</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        ${companyName} - Employee Account Verification
        
        Dear ${companyName} HR Team,
        
        A new employee has registered for your company on the GO JOB platform. The verification email has been sent to your company email as requested.
        
        Employee Details:
        - Name: ${userName}
        - Email: ${employeeEmail}
        - Company: ${companyName}
        - Registration Date: ${new Date().toLocaleDateString()}
        
        VERIFICATION CODE: ${verificationCode}
        
        Verification Instructions:
        Please share this verification code with ${userName} (${employeeEmail}) so they can complete their account setup.
        
        1. Forward this verification code to the employee: ${verificationCode}
        2. The employee should go to the GO JOB verification page
        3. They should enter the 6-digit code: ${verificationCode}
        4. Click "Verify Account" to complete the process
        
        SECURITY NOTICE: This verification code will expire in 24 hours. Only share this code with the authorized employee. If this registration was not authorized by your company, please contact GO JOB support immediately.
        
        Why verification is sent to company email:
        - Enhanced security and control over employee access
        - Company oversight of new employee registrations  
        - Centralized management of employee onboarding
        - Prevention of unauthorized employee accounts
        
        If you need assistance with employee management or verification, please contact GO JOB support.
        
        Best regards,
        ${companyName} HR Management
        via GO JOB Platform
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Employee verification email sent to company email successfully:', {
      to: companyEmail,
      employee: employeeEmail,
      company: companyName,
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send employee verification email to company:', error);
    return false;
  }
}

export default { sendVerificationEmail, sendCompanyWelcomeEmail, sendEmployeeVerificationEmail, sendEmployeeVerificationToCompanyEmail };
