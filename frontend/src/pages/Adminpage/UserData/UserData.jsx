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
      <NavLink to="/about" className="home-btn">
        Home
      </NavLink>
    </div>
  </div>
);

const UserData = () => {
  const [users, setUsers] = useState([]); // State to store fetched users
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/admin-users", {
          credentials: 'include' // Add this to include cookies if needed
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        
        // Log the full user data to check the structure
        console.log('Fetched user data:', data);
        
        // Modify user data to include profile image URL
        const usersWithProfileImages = data.map(user => ({
          ...user,
          profile: user.profile_image 
            ? `http://localhost:5000/uploads/${user.email}/${user.profile_image}`
            : DEFAULT_PROFILE_IMAGE,
          // Make sure documentation data is properly mapped
          documentation: user.documentation || []
        }));
        
        setUsers(usersWithProfileImages);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (id) => {
    setUsers(
      users.map((user) =>
        user._id === id ? { ...user, isEditing: !user.isEditing } : user
      )
    );
  };

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

  const handleSave = (id) => {
    setUsers(
      users.map((user) =>
        user._id === id ? { ...user, isEditing: false } : user
      )
    );
  };

  const handleUserClick = (user) => {
    if (!user.isEditing) {
        console.log('Full user data:', user); // Debug log
        setSelectedUser(user); // Use the entire user object directly
        setActiveTab("images");
    }
  };

  const handleMediaClick = (media, type) => {
    setSelectedMedia({ ...media, type });
  };

  // Add this function to handle PDF display
  const renderPDFPreview = (doc) => {
    if (!doc.file_id) return null;
    
    return (
      <div className="pdf-preview-container">
        <h4>{doc.filename}</h4>
        <iframe
          src={`http://localhost:5000/media/file/${doc.file_id}`}
          width="100%"
          height="500px"
          title={doc.filename}
          className="pdf-preview"
        />
        <div className="pdf-details">
          <p>Summary: {doc.summary || doc.extracted_text || 'No summary available'}</p>
          <p>Uploaded: {new Date(doc.timestamp * 1000).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  // Modify the Synopsis Section to properly handle documentation files
  const SynopsisSection = ({ user }) => (
    <div className="synopsis-list">
      {user.documentation && user.documentation.length > 0 ? (
        user.documentation.map((doc, index) => (
          <div key={index} className="synopsis-item">
            {renderPDFPreview(doc)}
          </div>
        ))
      ) : (
        <p className="no-data">No documentation found.</p>
      )}
    </div>
  );

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
                key={user._id}
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
                        onChange={(e) => handleProfileChange(user._id, e)}
                        style={{ display: "none" }}
                        id={`file-input-${user._id}`}
                      />
                      <label htmlFor={`file-input-${user._id}`}>
                        <img
                          src={user.profile || DEFAULT_PROFILE_IMAGE}
                          alt="Profile"
                          className="profile-img"
                          onError={(e) => {
                            e.target.src = DEFAULT_PROFILE_IMAGE; // Fallback to default image
                            console.error("Error loading profile image");
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <img
                      src={user.profile || DEFAULT_PROFILE_IMAGE}
                      alt="Profile"
                      className="profile-img"
                      onError={(e) => {
                        e.target.src = DEFAULT_PROFILE_IMAGE; // Fallback to default image
                        console.error("Error loading profile image");
                      }}
                    />
                  )}
                </div>
                {user.isEditing ? (
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) =>
                      handleChange(user._id, "name", e.target.value)
                    }
                  />
                ) : (
                  <p>{user.name}</p>
                )}
                {user.isEditing ? (
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) =>
                      handleChange(user._id, "email", e.target.value)
                    }
                  />
                ) : (
                  <p>{user.email}</p>
                )}
                {user.isEditing ? (
                  <input
                    type="text"
                    value={user.password || "*****"}
                    onChange={(e) =>
                      handleChange(user._id, "password", e.target.value)
                    }
                  />
                ) : (
                  <p>*****</p> // Changed from displaying actual password to fixed 5 asterisks
                )}

                <div className="actions" onClick={(e) => e.stopPropagation()}>
                  {user.isEditing ? (
                    <FaSave
                      className="save-icon"
                      title="Save"
                      onClick={() => handleSave(user._id)}
                    />
                  ) : (
                    <FaEdit
                      className="edit-icon-a"
                      title="Edit"
                      onClick={() => handleEdit(user._id)}
                    />
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
      </div>
    </div>
  );
};

export default UserData;
