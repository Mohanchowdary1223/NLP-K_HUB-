import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaEdit, FaTrash, FaSave, FaTimes, FaMusic } from "react-icons/fa";
import "./UserData.css";
import user from "../../../assets/user.png";
import add_icon from "../../../assets/add_icon.png";
import order_icon from "../../../assets/order_icon.png";
import logoImage from "../../../assets/assets/DDLogo1.png";

// Add default profile image constant
const DEFAULT_PROFILE_IMAGE = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const Navbar = () => (
  <div className="navbar-a">
    <img src={logoImage} alt="Logo" className="logo-image-admin" />
    <div className="nav-links">
      <NavLink to="/userdata" className="nav-link">
        Users List
      </NavLink>
      <NavLink to="/userreport" className="nav-link">
        Report
      </NavLink>
      <NavLink to="/" className="home-btn">
        Logout
      </NavLink>
    </div>
  </div>
);

const UserData = () => {
  // Add new state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUploadsPopup, setShowUploadsPopup] = useState(false); // Add this state

  const [users, setUsers] = useState([]); // State to store fetched users
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/admin-users", {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw user data:', data); // Debug log
        
        if (!Array.isArray(data)) {
          console.error('Received data is not an array:', data);
          return;
        }

        const usersWithProfileImages = data.map(user => ({
          ...user,
          _id: user._id || String(Math.random()), // Ensure we have an ID
          name: user.name || 'No Name',
          email: user.email || 'No Email',
          password: '*****',
          profile: user.profile_image 
            ? `http://localhost:5000/admin/profile-image/${user.email}/${user.profile_image}`
            : DEFAULT_PROFILE_IMAGE,
        }));
        
        console.log('Processed user data:', usersWithProfileImages); // Debug log
        setUsers(usersWithProfileImages);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);



  const handleChange = (id, field, value) => {
    setUsers(
      users.map((user) =>
        user._id === id ? { ...user, [field]: value } : user
      )
    );
  };

  const handleProfileChange = (id, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUsers(
          users.map((user) =>
            user._id === id ? { ...user, profile: reader.result } : user
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };


  const handleUserClick = (user) => {
    if (!user.isEditing) {
      setSelectedUser(user);
    }
  };

  // Add new handler for All Uploads button
  const handleUploadsClick = (e, user) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedUser(user);
    setShowUploadsPopup(true);
  };

  const handleMediaClick = (media, type) => {
    setSelectedMedia({ ...media, type });
  };

  // Add delete handler functions
  const handleDeleteClick = (user, e) => {
    e.stopPropagation();
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`http://localhost:5000/admin/delete-user/${userToDelete.email}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const data = await response.json();
      console.log('Delete response:', data);

      // Remove user from local state
      setUsers(users.filter(user => user.email !== userToDelete.email));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Add this function to handle PDF display
  const renderPDFPreview = (doc) => {
    if (!doc || !doc.file_id) {
        console.log("Invalid document or missing file_id:", doc);
        return (
            <div className="pdf-preview-error">
                <p>Unable to load PDF preview</p>
            </div>
        );
    }

    const pdfUrl = `http://localhost:5000/media/file/${doc.file_id}`;
    
    return (
        <div className="pdf-preview-container">
            <h4>{doc.filename || 'Untitled Document'}</h4>
            <div className="pdf-viewer">
                <iframe
                    src={pdfUrl}
                    width="100%"
                    height="500px"
                    title={doc.filename || 'PDF Document'}
                    className="pdf-preview"
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                    }}
                />
            </div>
            <div className="pdf-details">
                <div className="summary-section">
                    <h5>Summary</h5>
                    <p>{doc.summary || 'No summary available'}</p>
                </div>
                <div className="metadata-section">
                    <p>Uploaded: {doc.timestamp ? new Date(doc.timestamp * 1000).toLocaleString() : 'Date unknown'}</p>
                    {doc.extracted_text && (
                        <div className="extracted-text">
                            <h5>Extracted Text</h5>
                            <p>{doc.extracted_text.slice(0, 200)}...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

  // Modify the Synopsis Section to properly handle documentation files
  const SynopsisSection = ({ user }) => {
    if (!user || !user.documentation) {
        return <div className="synopsis-list"><p className="no-data">No documentation available.</p></div>;
    }

    const validDocs = user.documentation.filter(doc => doc && doc.file_id);

    if (validDocs.length === 0) {
        return <div className="synopsis-list"><p className="no-data">No valid documentation found.</p></div>;
    }

    return (
        <div className="synopsis-list">
            {validDocs.map((doc, index) => (
                <div key={index} className="synopsis-item">
                    {renderPDFPreview(doc)}
                </div>
            ))}
        </div>
    );
};

// Add this new component after SynopsisSection
const MessagesSection = ({ user }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Sort messages by timestamp in descending order (most recent first)
  const sortedMessages = user.messages 
    ? [...user.messages].sort((a, b) => b.timestamp - a.timestamp)
    : [];

  if (!sortedMessages.length) {
    return <div className="messages-list"><p className="no-data">No messages found.</p></div>;
  }

  return (
    <div className="messages-list">
      {sortedMessages.map((message, index) => (
        <div key={index} className="message-item">
          <div className="message-header">
            <span className="message-sender">{message.name}</span>
            <span className="message-time">{formatDate(message.timestamp)}</span>
          </div>
          <div className="message-content">
            <p className="message-text">{message.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

  // Add this function to calculate total uploads
  const calculateTotalUploads = (user) => {
    const totalImages = user.images?.length || 0;
    const totalVideos = user.videos?.length || 0;
    const totalAudios = user.audios?.length || 0;
    const totalDocs = user.documentation?.length || 0;
    return totalImages + totalVideos + totalAudios + totalDocs;
  };

  // Add loading and error states to the render
  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

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
              <b>Uploads</b>
              <b>Actions</b>
            </div>

            {/* Table Data - Map through all users */}
            {users.length > 0 ? (
              users.map((user, index) => (
                <div
                  key={user._id}
                  className="list-table-format"
                  onClick={() => handleUserClick(user)}
                >
                  <p>{index + 1}</p>
                  <div className="profile-container">
                    <img
                      src={user.profile || DEFAULT_PROFILE_IMAGE}
                      alt="Profile"
                      className="profile-img"
                      onError={(e) => {
                        e.target.src = DEFAULT_PROFILE_IMAGE;
                        console.log(`Error loading profile image for ${user.email}`);
                      }}
                    />
                  </div>
                  <p>{user.name}</p>
                  <p>{user.email}</p>
                  <button 
                    className="button-uploads"
                    onClick={(e) => handleUploadsClick(e, user)}
                  >
                    All Uploads ({calculateTotalUploads(user)})
                  </button>
                  <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <FaTrash 
                      className="delete-icon-a" 
                      title="Delete" 
                      onClick={(e) => handleDeleteClick(user, e)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="list-table-format">
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* User Details Popup */}
        {selectedUser && showUploadsPopup && (
          <div className="popup-overlay" onClick={() => setShowUploadsPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-popup"
                onClick={() => setSelectedUser(null)}
              >
                <FaTimes />
              </button>

              <h2 style={{ marginBottom: "1.5rem" }}>
                {selectedUser.name}'s Details
              </h2>

              <div className="popup-tabs">
                <button
                  className={`popup-tab ${
                    activeTab === "images" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("images")}
                >
                  Images
                </button>
                <button
                  className={`popup-tab ${
                    activeTab === "videos" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("videos")}
                >
                  Videos
                </button>
                <button
                  className={`popup-tab ${
                    activeTab === "audio" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("audio")}
                >
                  Audio
                </button>
                <button
                  className={`popup-tab ${
                    activeTab === "translations" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("translations")}
                >
                  Translations
                </button>
                <button
                  className={`popup-tab ${
                    activeTab === "synopsis" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("synopsis")}
                >
                  Synopsis
                </button>
                <button
                  className={`popup-tab ${activeTab === "messages" ? "active" : ""}`}
                  onClick={() => setActiveTab("messages")}
                >
                  Messages
                </button>
              </div>

              {/* Images Section */}
              <div className={`popup-content-section ${activeTab === "images" ? "active" : ""}`}>
                <div className="media-list">
                  {selectedUser.images && selectedUser.images.length > 0 ? (
                    selectedUser.images.map((image, index) => {
                        console.log('Image data:', image); // Debug log
                        return (
                            <div key={index} className="media-item">
                                <img
                                    src={`http://localhost:5000/media/file/${image.file_id}`}
                                    alt={image.filename || 'Image'}
                                    className="media-thumbnail"
                                    onError={(e) => {
                                        console.error("Error loading image:", e);
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = 'Failed to load image';
                                    }}
                                />
                                <div className="media-details">
                                    <p className="filename">{image.filename}</p>
                                    <p className="extracted-text">
                                        {image.extracted_text || 'No extracted text available'}
                                    </p>
                                    <p className="timestamp">
                                        {image.timestamp ? new Date(image.timestamp * 1000).toLocaleString() : 'No timestamp'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                  ) : (
                    <p>No image uploads found.</p>
                  )}
                </div>
              </div>

              {/* Videos Section */}
              <div className={`popup-content-section ${activeTab === "videos" ? "active" : ""}`}>
                <div className="media-list">
                  {selectedUser.videos && selectedUser.videos.length > 0 ? (
                    selectedUser.videos.map((video, index) => (
                      <div key={index} className="media-item">
                        <video controls className="media-thumbnail">
                          <source
                            src={`http://localhost:5000/media/file/${video.file_id}`}
                            type={video.content_type || "video/mp4"}
                          />
                          Your browser does not support the video tag.
                        </video>
                        <div className="media-details">
                          <p className="filename">{video.filename}</p>
                          <p className="extracted-text">Extracted Text: {video.extracted_text}</p>
                          <p className="timestamp">
                            {new Date(video.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No video uploads found.</p>
                  )}
                </div>
              </div>

              {/* Audio Section */}
              <div className={`popup-content-section ${activeTab === "audio" ? "active" : ""}`}>
                <div className="media-list">
                  {selectedUser.audios && selectedUser.audios.length > 0 ? (
                    selectedUser.audios.map((audio, index) => (
                      <div key={index} className="media-item">
                        <audio controls className="media-player">
                          <source
                            src={`http://localhost:5000/media/file/${audio.file_id}`}
                            type={audio.content_type || "audio/mpeg"}
                          />
                          Your browser does not support the audio tag.
                        </audio>
                        <div className="media-details">
                          <p className="filename">{audio.filename}</p>
                          <p className="extracted-text">Extracted Text: {audio.extracted_text}</p>
                          <p className="timestamp">
                            {new Date(audio.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No audio uploads found.</p>
                  )}
                </div>
              </div>

              {/* Translations Section */}
              <div className={`popup-content-section ${activeTab === "translations" ? "active" : ""}`}>
                <div className="translations-list">
                    {selectedUser.translations && selectedUser.translations.length > 0 ? (
                        selectedUser.translations.map((translation, index) => (
                            <div key={index} className="translation-item">
                                <div className="translation-content">
                                    <div className="original-text-box">
                                        <h4>Original Text:</h4>
                                        <p>{translation.original_text}</p>
                                    </div>
                                    <div className="translated-text-box">
                                        <h4>Translated Text:</h4>
                                        <p>{translation.translated_text}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">No translations found.</p>
                    )}
                </div>
              </div>

              {/* Synopsis Section */}
              <div
                className={`popup-content-section ${
                  activeTab === "synopsis" ? "active" : ""
                }`}
              >
                <SynopsisSection user={selectedUser} />
              </div>

              {/* Messages Section */}
              <div className={`popup-content-section ${activeTab === "messages" ? "active" : ""}`}>
                <MessagesSection user={selectedUser} />
              </div>

            </div>
          </div>
        )}

        {/* Media Preview */}
        {selectedMedia && (
          <div
            className="media-preview-overlay"
            onClick={() => setSelectedMedia(null)}
          >
            <div
              className="media-preview-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="media-preview-close"
                onClick={() => setSelectedMedia(null)}
              >
                <FaTimes />
              </button>

              {selectedMedia.type === "image" && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  className="media-preview-image"
                />
              )}

              {selectedMedia.type === "video" && (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="media-preview-video"
                />
              )}

              {selectedMedia.type === "audio" && (
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

        {/* Add Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="popup-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-confirmation-popup" onClick={e => e.stopPropagation()}>
              <h3>Confirm Action</h3>
              <p>Are you sure you want to deactivate or delete this user account?</p>
              <div className="delete-confirmation-buttons">
                <button className="confirm-button" onClick={handleDeleteConfirm}>
                  Yes
                </button>
                <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserData;

<style>
{`
  .messages-list {
    padding: 20px;
  }

  .message-item {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .message-sender {
    font-weight: bold;
    color: #333;
  }

  .message-time {
    color: #666;
    font-size: 0.9em;
  }

  .message-content {
    margin: 10px 0;
  }

  .message-email {
    color: #666;
    margin-bottom: 5px;
  }

  .message-text {
    color: #333;
    line-height: 1.4;
  }

  .message-status {
    font-size: 0.9em;
    color: #666;
    margin-top: 5px;
  }

  .no-data {
    text-align: center;
    color: #666;
    padding: 20px;
  }

  // Add these styles to your existing styles
  .pdf-preview-container {
    margin: 20px 0;
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .pdf-viewer {
    margin: 15px 0;
    min-height: 500px;
    background: #f8f9fa;
    border-radius: 4px;
    overflow: hidden;
  }

  .pdf-details {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-top: 15px;
  }

  .summary-section, .metadata-section {
    margin-bottom: 15px;
  }

  .summary-section h5, .metadata-section h5 {
    color: #333;
    margin-bottom: 8px;
  }

  .pdf-preview-error {
    padding: 20px;
    text-align: center;
    background: #fff3f3;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    color: #d32f2f;
  }

  .synopsis-item {
    margin-bottom: 30px;
    border-bottom: 1px solid #eee;
    padding-bottom: 20px;
  }

  .synopsis-item:last-child {
    border-bottom: none;
  }

  .extracted-text {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }
`}
</style>
