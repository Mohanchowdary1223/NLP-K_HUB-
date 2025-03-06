import React, { useState, useEffect } from 'react'; // Add useEffect
import axios from 'axios'; // Add axios import
import { Link } from 'react-router-dom';
import './Navbar.css';
import { Info, PlayCircle, Book, Mail } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import userPic from '../../assets/user.png';
import Profile from '../../assets/profile.png';
import Logout from '../../assets/logout.png';
import logoImage from '../../assets/assets/DDLogo.png';
import defaultpic from '../../assets/user-solid.png'

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);  // Mobile menu state
  const [profileOpen, setProfileOpen] = useState(false);  // Profile dropdown state
  const [userName, setUserName] = useState('');  // Add state for user name
  const [email, setEmail] = useState(''); // Add state for user email
  const [profileImage, setProfileImage] = useState(defaultpic); // Change initial state to defaultpic

  // Add useEffect to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/profile', {
          withCredentials: true,
        });
        setUserName(response.data.name); // Set user name
        setEmail(response.data.email);   // Set user email
        
        // Only update profile image if user has uploaded one
        if (response.data.profile_image) {
          setProfileImage(`http://localhost:5000/uploads/${response.data.email}/${response.data.profile_image}?t=${new Date().getTime()}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setProfileImage(defaultpic); // Set to default if there's an error
      }
    };
  
    fetchUserData();
  }, []);
  return (
    <nav>
      <div className="logo-container">
        <Link to="/about"> 
          <img src={logoImage} alt="Logo" className="logo-image" /> 
        </Link>
        <h2 className="logo">Data Dialect.</h2>
      </div>

      {/* Mobile & Desktop Menu */}
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        {/* Close Button Inside the Menu */}
        <button className="close-menu" onClick={() => setMenuOpen(false)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <li><Link to="/about"><Info className="icon" size={16} /> About</Link></li>
        <li><Link to="/demo"><PlayCircle className="icon" size={16} /> Demo</Link></li>
        <li><Link to="/documentation"><Book className="icon" size={16} /> Synopsis</Link></li>
        <li><Link to="/contact"><Mail className="icon" size={16} /> Contact</Link></li>
      </ul>

      {/* User Profile */}
      <img 
        src={profileImage} 
        className="user-pic" 
        onClick={() => setProfileOpen(!profileOpen)} 
        alt="User" 
      />

      {/* User Profile Dropdown */}
      {profileOpen && (
        <div className="sub-menu-wrap open-menu">
          <div className="sub-menu">
            <div className="user-info">
              <img src={profileImage} alt="User" />
              <h3>{userName}</h3>
            </div>
            <hr />
            <Link to="/profile" className="sub-menu-link">
              <img src={Profile} alt="Edit Profile" />
              <p>Profile</p>
            </Link>
            <Link to="/" className="sub-menu-link">
              <img src={Logout} alt="Log Out" />
              <p>Log Out</p>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <FontAwesomeIcon icon={faBars} />
      </button>
    </nav>
  );
};

export default Navbar;
