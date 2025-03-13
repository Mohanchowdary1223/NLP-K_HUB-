import React, { useState } from "react";
import axios from "axios";
import "./Landingpage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faGooglePlusG, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import transformation from '../../assets/transformation.mp4';

const Landingpage = () => {
  const [panelActive, setPanelActive] = useState(false);
  const [showContainer, setShowContainer] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showSendOtp, setShowSendOtp] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState("");
  const [otpVerificationMessage, setOtpVerificationMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(""); // "success" or "error"
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signinSuccess, setSigninSuccess] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signinError, setSigninError] = useState("");

  const navigate = useNavigate();

  const handlePanelToggle = () => {
    setPanelActive(!panelActive);
  };

  const handleShowContainer = () => {
    setShowContainer(true);
    document.body.classList.add("blur");
  };

  const handleCloseContainer = () => {
    setShowContainer(false);
    document.body.classList.remove("blur");
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSigninChange = (e) => {
    setSigninData({ ...signinData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    setLoading(true);
    setSignupError("");
    try {
      const response = await axios.post("http://localhost:5000/auth/api/signup", signupData, {
        withCredentials: true,
      });
      if (response.data.success) {
        setSignupSuccess(true);
        setTimeout(() => {
          setSignupSuccess(false);
          setPanelActive(false);
          setSignupData({ name: '', email: '', password: '' });
        }, 2000);
      } else {
        setSignupError("Email is already registered");
        setTimeout(() => setSignupError(""), 3000);
      }
    } catch (error) {
      setSignupError("Signup failed. Please try again.");
      setTimeout(() => setSignupError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async () => {
    setLoading(true);
    setSigninError("");
    try {
      const response = await axios.post("http://localhost:5000/auth/api/signin", signinData, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSigninSuccess(true);
        setTimeout(() => {
          setSigninSuccess(false);
          if (signinData.email === "admin@gmail.com") {
            navigate("/userdata");
          } else {
            navigate("/about");
          }
        }, 2000);
      } else {
        setSigninError("Email or password is incorrect");
        setTimeout(() => setSigninError(""), 3000);
      }
    } catch (error) {
      setSigninError("Email or password is incorrect");
      setTimeout(() => setSigninError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleReEnterPasswordVisibility = () => setShowReEnterPassword(!showReEnterPassword);

  const handleForgotPasswordEmailChange = (e) => {
    setForgotPasswordEmail(e.target.value);
  };

  const handleVerifyEmail = () => {
    setShowOtpInput(true);
  };

  const showTemporaryMessage = (setMessageFunction, message, duration = 3000) => {
    setMessageFunction(message);
    setTimeout(() => {
      setMessageFunction("");
    }, duration);
  };

  const handleEmailVerification = async () => {
    setIsVerifying(true);
    setEmailError("");
    
    try {
        const response = await axios.post(
            'http://localhost:5000/auth/api/verify-email',
            { email: forgotPasswordEmail },
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        setTimeout(() => {
            setIsVerifying(false);
            
            if (response.data.exists) {
                setIsEmailVerified(true);
                setVerificationStatus("success");
                setShowSendOtp(true);
            } else {
                setIsEmailVerified(false);
                setVerificationStatus("error");
            }
        }, 2000);

    } catch (error) {
        setTimeout(() => {
            setIsVerifying(false);
            setIsEmailVerified(false);
            setVerificationStatus("error");
        }, 2000);
    }
};

  const handlePasswordChange = (e, isNewPassword) => {
    const value = e.target.value;
    if (isNewPassword) {
      setNewPassword(value);
    } else {
      setReEnterPassword(value);
    }
    setPasswordError("");
  };

  const handleSendOtp = async () => {
    try {
        setOtpSending(true);
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:5000/auth/api/send-otp',
            data: { email: forgotPasswordEmail },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true
        });

        if (response.data.success) {
            setShowOtpInput(true);
            showTemporaryMessage(setOtpSuccessMessage, "OTP sent successfully!");
        } else {
            showTemporaryMessage(setPasswordError, response.data.message || "Failed to send OTP");
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        showTemporaryMessage(setPasswordError, "Failed to send OTP. Please try again.");
    } finally {
        setOtpSending(false);
    }
};

const handleVerifyOtp = async () => {
  try {
    if (!otpValue) {
      showTemporaryMessage(setPasswordError, "Please enter OTP");
      return;
    }

    const response = await axios.post(
      'http://localhost:5000/auth/api/verify-otp',
      { 
        email: forgotPasswordEmail,
        otp: otpValue
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      setShowPasswordFields(true);
      setPasswordError("");
      setOtpValue("");
      showTemporaryMessage(setOtpVerificationMessage, "OTP verified successfully!");
    } else {
      showTemporaryMessage(setPasswordError, response.data.message || "Invalid OTP");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    showTemporaryMessage(setPasswordError, "Failed to verify OTP. Please try again.");
  }
};

const handleChangePassword = async () => {
  try {
    if (!newPassword || !reEnterPassword) {
      setPasswordError("Both password fields are required");
      return;
    }

    if (newPassword !== reEnterPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const response = await axios.post(
      'http://localhost:5000/auth/api/change-password',
      {
        email: forgotPasswordEmail,
        newPassword: newPassword
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      showTemporaryMessage(setPasswordChangeMessage, "Password changed successfully!");
      setTimeout(() => {
        closeForgotPassword();
      }, 3000);
    } else {
      setPasswordError(response.data.message || "Failed to change password");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    setPasswordError("Failed to change password. Please try again.");
  }
};

  return (
    <div className="main">
      <video className='lpvideo' src={transformation} autoPlay loop muted />
      <div className={`overlay ${showContainer ? "show-overlay" : ""}`}></div>

      <div className="header-contents">
        <h2 className="heading">Data Dialect</h2>
        <h2 className="sub-heading">Step Into The World Of Data!</h2>
        <p className="para">
          Connecting different cultures by using the power of data collection to
          build stronger understanding and collaboration between communities.
        </p>
        <button className="signbtn" onClick={handleShowContainer}>
          Sign in
        </button>
      </div>

      {showContainer && (
        <div className="string-div">
          <FontAwesomeIcon
            icon={faTimes}
            className="close-icon"
            onClick={handleCloseContainer}
          />

          <div className={`sign-container ${panelActive ? "panel-active" : ""}`}>
            <div className="form-section signup-section">
              <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
                <h1>Create Account</h1>
                <div className="social-links">
                  <a href="#" className="social"><FontAwesomeIcon icon={faFacebookF} /></a>
                  <a href="#" className="social"><FontAwesomeIcon icon={faGooglePlusG} /></a>
                  <a href="#" className="social"><FontAwesomeIcon icon={faLinkedinIn} /></a>
                </div>
                <span>or use your email for registration</span>
                <div className="input-field">
                  <input type="text" name="name" placeholder="Name" onChange={handleSignupChange} />
                </div>
                <div className="input-field">
                  <input type="email" name="email" placeholder="Email" onChange={handleSignupChange} />
                </div>
                <div className="input-field">
                  <input type="password" name="password" placeholder="Password" onChange={handleSignupChange} />
                </div>
                {signupError && <div className="error-message">{signupError}</div>}
                {signupSuccess && (
                  <div className="success-message">
                    Signup successful! 
                  </div>
                )}
                <button className="sign" type="submit" disabled={loading}>
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>
              </form>
            </div>

            <div className="form-section signin-section">
              <form onSubmit={(e) => { e.preventDefault(); handleSignin(); }}>
                <h1>Sign in</h1>
                <div className="social-links">
                  <a href="#" className="social"><FontAwesomeIcon icon={faFacebookF} /></a>
                  <a href="#" className="social"><FontAwesomeIcon icon={faGooglePlusG} /></a>
                  <a href="#" className="social"><FontAwesomeIcon icon={faLinkedinIn} /></a>
                </div>
                <span>or use your account</span>
                <div className="input-field">
                  <input type="email" name="email" placeholder="Email" onChange={handleSigninChange} />
                </div>
                <div className="input-field">
                  <input type="password" name="password" placeholder="Password" onChange={handleSigninChange} />
                </div>
                <a href="#" className="forgot-password" onClick={toggleForgotPassword}>
                  Forgot your password?
                </a>
                {signinError && <div className="error-message">{signinError}</div>}
                {signinSuccess && (
                  <div className="success-message">
                    Login successful! 
                  </div>
                )}
                <button className="sign" type="submit" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            </div>

            <div className="overlay-wrapper">
              <div className="overlay-background">
                <div className="overlay-panel left-panel">
                  <h1>Welcome Back!</h1>
                  <p>To keep connected with us please login with your personal info</p>
                  <button className="toggle-button" onClick={handlePanelToggle}>Sign In</button>
                </div>
                <div className="overlay-panel right-panel">
                  <h1>Hello, Friend!</h1>
                  <p>Enter your personal details and start your journey with us</p>
                  <button className="toggle-button" onClick={handlePanelToggle}>Sign Up</button>
                </div>
              </div>
            </div>
          </div>

          {showForgotPassword && (
            <>
              <div className="forgot-password-overlay"></div>
              <div className="forgot-password-form">
                <FontAwesomeIcon
                  icon={faTimes}
                  className="forgot-close-icon"
                  onClick={closeForgotPassword}
                />
                <h2>Reset Password</h2>

                <div className="input-field">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={handleForgotPasswordEmailChange}
                    disabled={isEmailVerified}
                  />
                </div>

                <div className={`verification-box ${verificationStatus}`}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={handleEmailVerification}
                      disabled={isEmailVerified || isVerifying || !forgotPasswordEmail}
                      checked={isEmailVerified}
                    />
                    {isVerifying ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      isEmailVerified ? "Email Verified Successfully" : 
                      verificationStatus === "error" ? "Email not found" : "Verify Email"
                    )}
                  </label>
                </div>

                {emailError && (
                  <div className="error-message">
                    {emailError}
                  </div>
                )}

                {verificationMessage && (
                  <div className="verification-message">
                    {verificationMessage}
                  </div>
                )}

                {passwordError && (
                  <div className="error-message">
                    {passwordError}
                  </div>
                )}

                {otpSuccessMessage && (
                  <div className="otp-success-message">
                    {otpSuccessMessage}
                  </div>
                )}

                {otpVerificationMessage && (
                  <div className="otp-success-message">
                    {otpVerificationMessage}
                  </div>
                )}

                {passwordChangeMessage && (
                  <div className="password-success-message">
                    {passwordChangeMessage}
                  </div>
                )}

                {showSendOtp && (
                  <>
                    {showOtpInput ? (
                      !showPasswordFields ? (
                        <>
                          <div className="input-field">
                            <input 
                              type="text" 
                              placeholder="Enter 6-digit OTP" 
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value)}
                              maxLength={6}
                            />
                          </div>
                          <button 
                            className="verify-btn"
                            onClick={handleVerifyOtp}
                            disabled={!otpValue || otpValue.length !== 6}
                          >
                            Verify OTP
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="input-field">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="New Password"
                              value={newPassword}
                              onChange={(e) => handlePasswordChange(e, true)}
                            />
                            <span className="eye-icon" onClick={toggleNewPasswordVisibility}>
                              <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                            </span>
                          </div>
                          <div className="input-field">
                            <input
                              type={showReEnterPassword ? "text" : "password"}
                              placeholder="Re-enter New Password"
                              value={reEnterPassword}
                              onChange={(e) => handlePasswordChange(e, false)}
                            />
                            <span className="eye-icon" onClick={toggleReEnterPasswordVisibility}>
                              <FontAwesomeIcon icon={showReEnterPassword ? faEye : faEyeSlash} />
                            </span>
                          </div>
                          <button 
                            className="verify-btn"
                            onClick={handleChangePassword}
                            disabled={!newPassword || !reEnterPassword || newPassword !== reEnterPassword}
                          >
                            Change Password
                          </button>
                        </>
                      )
                    ) : (
                      <button 
                        className="verify-btn" 
                        onClick={handleSendOtp}
                        disabled={otpSending}
                      >
                        {otpSending ? "Sending OTP..." : "Send OTP"}
                      </button>
                    )}
                  </>
                )}

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Landingpage;