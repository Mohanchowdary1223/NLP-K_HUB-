import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaEdit, FaTrash, FaSave, FaTimes, FaMusic } from 'react-icons/fa';
import './UserData.css';
import user from '../../../assets/user.png';
import add_icon from '../../../assets/add_icon.png';
import order_icon from '../../../assets/order_icon.png';
import logoImage from '../../../assets/assets/DDLogo1.png';


const Navbar = () => (
  <div className='navbar-a'>

    <img src={logoImage} alt="Logo" className="logo-image-admin" /> 

   
    <div className="nav-links">
      <NavLink to='/userdata' className="nav-link">Users List</NavLink>
      <NavLink to='/userreport' className="nav-link">Report</NavLink>
      <NavLink to='/about' className="home-btn">Home</NavLink>
    </div>
  </div>
);

const UserData = () => {
  const [users, setUsers] = useState([
    { id: 1, profile: user, name: 'John Doe', email: 'john@example.com', password: '********', isEditing: false },
    { id: 2, profile: user, name: 'Jane Smith', email: 'jane@example.com', password: '********', isEditing: false },
    { id: 3, profile: user, name: 'Michael Johnson', email: 'michael@example.com', password: '********', isEditing: false },
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('images');
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleEdit = (id) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, isEditing: !user.isEditing } : user
    ));
  };

  const handleChange = (id, field, value) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, [field]: value } : user
    ));
  };

  const handleProfileChange = (id, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUsers(users.map(user =>
          user.id === id ? { ...user, profile: reader.result } : user
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (id) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, isEditing: false } : user
    ));
  };

  const handleUserClick = (user) => {
    if (!user.isEditing) {
      setSelectedUser(user);
      setActiveTab('images');
    }
  };

  const handleMediaClick = (media, type) => {
    setSelectedMedia({ ...media, type });
  };

  const userDetails = {
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', title: 'Team Meeting' },
      { id: 2, url: 'https://images.unsplash.com/photo-1497493292307-31c376b6e479', title: 'Project Discussion' },
    ],
    videos: [
      { id: 1, url: 'https://www.w3schools.com/html/mov_bbb.mp4', title: 'Training Session 1' },
      { id: 2, url: 'https://www.w3schools.com/html/movie.mp4', title: 'Product Demo' },
    ],
    audio: [
      { id: 1, url: 'https://www.w3schools.com/html/horse.mp3', title: 'Voice Note 1' },
      { id: 2, url: 'https://www.w3schools.com/html/horse.mp3', title: 'Meeting Recording' },
    ],
    translations: [
      { language: 'Spanish', text: 'Hola Mundo' },
      { language: 'French', text: 'Bonjour le Monde' },
    ],
    history: [
      { date: '2024-03-15', action: 'Profile updated' },
      { date: '2024-03-14', action: 'Password changed' },
      { date: '2024-03-13', action: 'New document uploaded' },
    ],
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        <Navbar />
        
        <div className="list add flex-col">
          <div className="list-table">
            {/* Table Header */}
            <div className="list-table-format title">
              <b>S. No</b>
              <b>Profile</b>
              <b>Name</b>
              <b>Email</b>
              <b>Password</b>
              <b>Actions</b>
            </div>

            {/* Table Data */}
            {users.map((user, index) => (
              <div
                key={user.id}
                className="list-table-format"
                onClick={() => handleUserClick(user)}
              >
                <p>{index + 1}</p>
                <div className="profile-container">
                  {user.isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProfileChange(user.id, e)}
                        style={{ display: 'none' }}
                        id={`file-input-${user.id}`}
                      />
                      <label htmlFor={`file-input-${user.id}`}>
                        <img src={user.profile} alt="Profile" className="profile-img" />
                      </label>
                    </>
                  ) : (
                    <img src={user.profile} alt="Profile" className="profile-img" />
                  )}
                </div>
                {user.isEditing ? (
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => handleChange(user.id, 'name', e.target.value)}
                  />
                ) : (
                  <p>{user.name}</p>
                )}
                {user.isEditing ? (
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => handleChange(user.id, 'email', e.target.value)}
                  />
                ) : (
                  <p>{user.email}</p>
                )}
                {user.isEditing ? (
                  <input
                    type="text"
                    value={user.password}
                    onChange={(e) => handleChange(user.id, 'password', e.target.value)}
                  />
                ) : (
                  <p>{user.password}</p>
                )}

                <div className="actions" onClick={(e) => e.stopPropagation()}>
                  {user.isEditing ? (
                    <FaSave className="save-icon" title="Save" onClick={() => handleSave(user.id)} />
                  ) : (
                    <FaEdit className="edit-icon-a" title="Edit" onClick={() => handleEdit(user.id)} />
                  )}
                  <FaTrash className="delete-icon-a" title="Delete" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details Popup */}
        {selectedUser && (
          <div className="popup-overlay" onClick={() => setSelectedUser(null)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-popup" onClick={() => setSelectedUser(null)}>
                <FaTimes />
              </button>
              
              <h2 style={{ marginBottom: '1.5rem' }}>{selectedUser.name}'s Details</h2>
              
              <div className="popup-tabs">
                <button
                  className={`popup-tab ${activeTab === 'images' ? 'active' : ''}`}
                  onClick={() => setActiveTab('images')}
                >
                  Images
                </button>
                <button
                  className={`popup-tab ${activeTab === 'videos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('videos')}
                >
                  Videos
                </button>
                <button
                  className={`popup-tab ${activeTab === 'audio' ? 'active' : ''}`}
                  onClick={() => setActiveTab('audio')}
                >
                  Audio
                </button>
                <button
                  className={`popup-tab ${activeTab === 'translations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('translations')}
                >
                  Translations
                </button>
                <button
                  className={`popup-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>

              {/* Images Section */}
              <div className={`popup-content-section ${activeTab === 'images' ? 'active' : ''}`}>
                <div className="media-grid">
                  {userDetails.images.map((image) => (
                    <div key={image.id} className="media-item" onClick={() => handleMediaClick(image, 'image')}>
                      <img src={image.url} alt={image.title} />
                      <div className="media-item-info">{image.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos Section */}
              <div className={`popup-content-section ${activeTab === 'videos' ? 'active' : ''}`}>
                <div className="media-grid">
                  {userDetails.videos.map((video) => (
                    <div key={video.id} className="media-item" onClick={() => handleMediaClick(video, 'video')}>
                      <div className="video-thumbnail"></div>
                      <div className="media-item-info">{video.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Section */}
              <div className={`popup-content-section ${activeTab === 'audio' ? 'active' : ''}`}>
                <div className="media-grid">
                  {userDetails.audio.map((audio) => (
                    <div key={audio.id} className="media-item" onClick={() => handleMediaClick(audio, 'audio')}>
                      <div className="audio-thumbnail">
                        <FaMusic />
                      </div>
                      <div className="media-item-info">{audio.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translations Section */}
              <div className={`popup-content-section ${activeTab === 'translations' ? 'active' : ''}`}>
                {userDetails.translations.map((translation, index) => (
                  <div key={index} className="translation-item">
                    <span>{translation.language}:</span>
                    <span>{translation.text}</span>
                  </div>
                ))}
              </div>

              {/* History Section */}
              <div className={`popup-content-section ${activeTab === 'history' ? 'active' : ''}`}>
                {userDetails.history.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{item.date}</div>
                    <div className="history-action">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Media Preview */}
        {selectedMedia && (
          <div className="media-preview-overlay" onClick={() => setSelectedMedia(null)}>
            <div className="media-preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="media-preview-close" onClick={() => setSelectedMedia(null)}>
                <FaTimes />
              </button>
              
              {selectedMedia.type === 'image' && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  className="media-preview-image"
                />
              )}
              
              {selectedMedia.type === 'video' && (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="media-preview-video"
                />
              )}
              
              {selectedMedia.type === 'audio' && (
                <audio
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="media-preview-audio"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserData;