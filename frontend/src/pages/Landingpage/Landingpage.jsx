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
    try {
      const response = await axios.post("http://localhost:5000/auth/api/signup", signupData, {
        withCredentials: true,
      });
      if (response.data.success) {
        alert("Signup successful!");
        setPanelActive(false);
      } else {
        alert("Signup failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed.");
    } finally {
      setLoading(false);
      setSignupData({ name: '', email: '', password: '' });
    }
  };

  const handleSignin = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/auth/api/signin", signinData, {
        withCredentials: true,
      });

      if (response.data.success) {
        // Check if the email is admin@gmail.com
        if (signinData.email === "admin@gmail.com") {
          alert("Admin login successful!");
          navigate("/userdata"); // Navigate to /userdata for admin
        } else {
          alert("Login successful!");
          navigate("/about"); // Navigate to /about for non-admin users
        }
      } else {
        alert("Login failed: Incorrect email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: Network error or incorrect credentials.");
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
                  />
                </div>

                <div className="input-field">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                  />
                  <span className="eye-icon" onClick={toggleNewPasswordVisibility}>
                    <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                  </span>
                </div>
                <div className="input-field">
                  <input
                    type={showReEnterPassword ? "text" : "password"}
                    placeholder="Re-enter New Password"
                  />
                  <span className="eye-icon" onClick={toggleReEnterPasswordVisibility}>
                    <FontAwesomeIcon icon={showReEnterPassword ? faEye : faEyeSlash} />
                  </span>
                </div>
                <div className="auth-options">
                  <label>
                    <input type="radio" name="authMethod" value="email" /> Authenticate through Email
                  </label>
                </div>
                <div className="input-field">
                  <input type="text" placeholder="Enter OTP" />
                </div>
                <button className="verify-btn">Verify OTP</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Landingpage;