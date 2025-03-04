import React, { useState, useEffect } from "react";
import "./Profile.css";
import User from "../../assets/assets/user.png";
import Navbar from "../../components/Navbar/Navbar";
import { FaEnvelope, FaPhone, FaPen, FaTimes, FaTrash } from "react-icons/fa";
import ImgtoTxt from "../../assets/assets/Image to Text.png";
import VidtoTxt from "../../assets/assets/Video to Text.png";
import AudtoTxt from "../../assets/assets/Audio to Text.png";
import LangTranslator from "../../assets/assets/Language Translator.png";
import Synopsis from "../../assets/synopsis-img.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import defaultpic from "../../assets/user-solid.png";
import deletimg from "../../assets/deleteimgprofile.png"

function ProfileCard() {
  const [profileImage, setProfileImage] = useState(defaultpic); // Change initial state to defaultpic
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
  });

  const [uploadCounts, setUploadCounts] = useState({
    imageUploads: 0,
    videoUploads: 0,
    audioUploads: 0,
    langTranslator: 0,
    documentationUploads: 0, // Add this line
  });

  const [activeCard, setActiveCard] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null); // State to store selected media item

  const [translations, setTranslations] = useState([]);
  const [showTranslationsPopup, setShowTranslationsPopup] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
    audios: [],
  });

  const [mediaData, setMediaData] = useState({
    images: [],
    videos: [],
    audios: [],
    documentation: [],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState({
    images: [],
    videos: [],
    audios: [],
    translations: [],
    documentation: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get("http://localhost:5000/profile", {
          withCredentials: true,
        });
        const { email, name, profile_image, phone, city, state } =
          profileRes.data;

        setFormData({
          name: name || "",
          email: email || "",
          phone: phone || "",
          city: city || "",
          state: state || "",
        });

        // Only update profile image if user has uploaded one
        if (profile_image) {
          setProfileImage(
            `http://localhost:5000/uploads/${email}/${profile_image}?t=${new Date().getTime()}`
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setProfileImage(defaultpic); // Set to default if there's an error
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data including documentation
        const [mediaResponse, translationsResponse] = await Promise.all([
          axios.get("http://localhost:5000/user/media", {
            withCredentials: true,
          }),
          axios.get("http://localhost:5000/uploads/translations", {
            withCredentials: true,
          }),
        ]);

        // Update the mediaData state with documentation
        setMediaData({
          ...mediaData,
          documentation: mediaResponse.data.documentation || [],
          images: mediaResponse.data.images || [],
          videos: mediaResponse.data.videos || [],
          audios: mediaResponse.data.audios || [],
        });

        // Set translations
        setMediaList(translationsResponse.data);

        setUploadCounts({
          ...uploadCounts,
          documentationUploads: mediaResponse.data.documentation || 0,
          imageUploads: mediaResponse.data.images.length || 0,
          videoUploads: mediaResponse.data.videos.length || 0,
          audioUploads: mediaResponse.data.audios.length || 0,
          langTranslator: translationsResponse.data.length || 0,
        });
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    };

    fetchData();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("profileImage", file);

      try {
        await axios.post(
          "http://localhost:5000/profile/upload-image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        console.log("Image uploaded successfully");
      } catch (error) {
        console.error("Error uploading profile image:", error);
      }
    }
  };

  const handleEditClick = () => {
    if (isEditMode) {
      // Reset selections when canceling
      setSelectedItems({
        images: [],
        videos: [],
        audios: [],
        translations: [],
        documentation: []
      });
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/profile/update", formData, {
        withCredentials: true,
      });
      console.log("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const fetchTranslations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/uploads/translations",
        { withCredentials: true }
      );
      setTranslations(res.data);
      setShowTranslationsPopup(true);
    } catch (error) {
      console.error("Error fetching translations:", error);
    }
  };

  const navigateToMediaPage = (mediaType) => {
    navigate(`/media/${mediaType}`);
  };

  // Add new function to handle media view
  const handleMediaView = (mediaType) => {
    setActiveCard(mediaType);
  };

  const handleItemSelect = (type, id) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter(item => item !== id)
        : [...prev[type], id]
    }));
  };

  // Update handleDeleteSelected function
const handleDeleteSelected = async () => {
  try {
    // Gather all selected items by type
    const itemsToDelete = {
      images: selectedItems.images,
      videos: selectedItems.videos,
      audios: selectedItems.audios,
      translations: selectedItems.translations,
      documentation: selectedItems.documentation
    };

    // Check if any items are selected
    const hasSelectedItems = Object.values(itemsToDelete)
      .some(items => items && items.length > 0);

    if (!hasSelectedItems) {
      console.log('No items selected');
      return;
    }

    console.log('Sending items to delete:', itemsToDelete);

    const response = await axios.post(
      'http://localhost:5000/move-to-trash',
      { items: itemsToDelete },
      { withCredentials: true }
    );

    if (response.status === 200) {
      // Update all media states
      setMediaData(prevData => ({
        images: prevData.images.filter(img => !selectedItems.images.includes(img.file_id)),
        videos: prevData.videos.filter(vid => !selectedItems.videos.includes(vid.file_id)),
        audios: prevData.audios.filter(aud => !selectedItems.audios.includes(aud.file_id)),
        documentation: prevData.documentation.filter(doc => !selectedItems.documentation.includes(doc.file_id))
      }));

      // Update translations list
      setMediaList(prevList => 
        prevList.filter(item => !selectedItems.translations.includes(item._id))
      );

      // Reset all selected items
      setSelectedItems({
        images: [],
        videos: [],
        audios: [],
        translations: [],
        documentation: []
      });

      // Update upload counts
      setUploadCounts(prev => ({
        ...prev,
        imageUploads: prev.imageUploads - (selectedItems.images.length || 0),
        videoUploads: prev.videoUploads - (selectedItems.videos.length || 0),
        audioUploads: prev.audioUploads - (selectedItems.audios.length || 0),
        langTranslator: prev.langTranslator - (selectedItems.translations.length || 0),
        documentationUploads: prev.documentationUploads - (selectedItems.documentation.length || 0),
      }));

      // Exit edit mode
      setIsEditMode(false);
    }
  } catch (error) {
    console.error('Error moving items to trash:', error);
  }
};

  const DEFAULT_PROFILE_IMAGE =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  return (
    <div>
      <Navbar />
      <div className="profile-card">
        <div className="edit-profile" onClick={handleEditClick}>
          <FaPen />
          <span>Edit Profile</span>
        </div>
        <div className="profile-image-container">
          <img
            src={profileImage || DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            onError={(e) => {
              e.target.src = DEFAULT_PROFILE_IMAGE; // Fallback to default image
              console.error("Error loading profile image");
            }}
            className="profile-image"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="image-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="edit-icon">
            <FaPen />
          </label>
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{formData.name}</h2>
          <div className="profile-info">
            <p className="profile-email">
              <FaEnvelope /> {formData.email}
            </p>
            <p className="profile-phone">
              <FaPhone /> {formData.phone}
            </p>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Your Details</h2>
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="form-group">
                <input
                  type="text"
                  name="name" // Changed from firstName to name
                  placeholder="Name" // Changed placeholder
                  value={formData.name} // Added value binding
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}

      <h3 className="history-title">History</h3>
      <div className="cards-container">
        <div className="card" onClick={() => handleMediaView("images")}>
          <img src={ImgtoTxt} alt="" className="card-icon" />
          <p>Image Uploads</p>
          <span className="upload-count">
            {uploadCounts.imageUploads} uploads
          </span>
        </div>
        <div className="card" onClick={() => handleMediaView("videos")}>
          <img src={VidtoTxt} alt="" className="card-icon" />
          <p>Video Uploads</p>
          <span className="upload-count">
            {uploadCounts.videoUploads} uploads
          </span>
        </div>
        <div className="card" onClick={() => handleMediaView("audios")}>
          <img src={AudtoTxt} alt="" className="card-icon" />
          <p>Audio Uploads</p>
          <span className="upload-count">
            {uploadCounts.audioUploads} uploads
          </span>
        </div>
        <div className="card" onClick={() => setActiveCard("langTranslator")}>
          <img src={LangTranslator} alt="" className="card-icon" />
          <p>Language Translator</p>
          <span className="upload-count">{mediaList.length} translations</span>
        </div>

        <div className="card" onClick={() => handleMediaView("synopsis")}>
          <img src={Synopsis} alt="" className="card-icon1" />
          <p>Synopsis uploades</p>
          <span className="upload-count">
            {mediaData.documentation.length || 0} summaries
          </span>
        </div>

        <div className="card" onClick={() => handleMediaView("delete")}>
          <img src={deletimg} alt="" className="card-icon" />
          <p>Deleted History</p>
          <span className="upload-count">
         Deleted
          </span>
        </div>
      </div>

      {/* Media Popups */}
      {activeCard === "images" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setActiveCard(null)}>
              <FaTimes />
            </span>
            <h2 className="popup-title">Image History</h2>
            <div className="media-list">
              {mediaData.images.length > 0 ? (
                mediaData.images.map((image) => (
                  <div 
                    key={image.file_id} 
                    className={`media-item ${isEditMode && selectedItems.images.includes(image.file_id) ? 'selected' : ''}`}
                    onClick={() => isEditMode && handleItemSelect('images', image.file_id)}
                  >
                    <img
                      src={`http://localhost:5000/media/file/${image.file_id}`}
                      alt={image.filename}
                      className="media-thumbnail"
                      onError={(e) => {
                        console.error("Error loading image:", e);
                        e.target.src = "fallback-image-url";
                      }}
                    />
                    <p>Extracted Text: {image.extracted_text}</p>
                    <p className="timestamp">
                      {new Date(image.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>No image history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button 
                className="delete-all-btn"
                onClick={handleDeleteSelected}
                disabled={!Object.values(selectedItems).some(items => items && items.length > 0)}
              >
                {isEditMode ? 'Delete Selected Items' : 'Delete All'}
              </button>
              <button 
                className="delete-all-btn1"
                onClick={handleEditClick}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCard === "videos" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setActiveCard(null)}>
              <FaTimes />
            </span>
            <h2 className="popup-title">Video History</h2>
            <div className="media-list">
              {mediaData.videos.length > 0 ? (
                mediaData.videos
                  .filter((video) => video.source !== "documentation")
                  .map((video) => (
                    <div 
                      key={video.file_id} 
                      className={`media-item ${isEditMode && selectedItems.videos.includes(video.file_id) ? 'selected' : ''}`}
                      onClick={() => isEditMode && handleItemSelect('videos', video.file_id)}
                    >
                      <video controls className="media-thumbnail">
                        <source
                          src={`http://localhost:5000/media/file/${video.file_id}`}
                          type={video.content_type || "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                      <p>Extracted Text: {video.extracted_text}</p>
                      <p className="timestamp">
                        {new Date(video.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
              ) : (
                <p>No video history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button 
                className="delete-all-btn"
                onClick={handleDeleteSelected}
                disabled={!Object.values(selectedItems).some(items => items && items.length > 0)}
              >
                {isEditMode ? 'Delete Selected Items' : 'Delete All'}
              </button>
              <button 
                className="delete-all-btn1"
                onClick={handleEditClick}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCard === "audios" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setActiveCard(null)}>
              <FaTimes />
            </span>
            <h2 className="popup-title">Audio History</h2>
            <div className="media-list">
              {mediaData.audios.length > 0 ? (
                mediaData.audios.map((audio) => (
                  <div 
                    key={audio.file_id} 
                    className={`media-item ${isEditMode && selectedItems.audios.includes(audio.file_id) ? 'selected' : ''}`}
                    onClick={() => isEditMode && handleItemSelect('audios', audio.file_id)}
                  >
                    <audio controls className="media-player">
                      <source
                        src={`http://localhost:5000/media/file/${audio.file_id}`}
                        type={audio.content_type || "audio/mpeg"}
                      />
                      Your browser does not support the audio tag.
                    </audio>
                    <p>Extracted Text: {audio.extracted_text}</p>
                    <p className="timestamp">
                      {new Date(audio.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>No audio history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button 
                className="delete-all-btn"
                onClick={handleDeleteSelected}
                disabled={!Object.values(selectedItems).some(items => items && items.length > 0)}
              >
                {isEditMode ? 'Delete Selected Items' : 'Delete All'}
              </button>
              <button 
                className="delete-all-btn1"
                onClick={handleEditClick}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

{activeCard === "langTranslator" && (
  <div className="popup-overlay">
    <div className="popup-content">
      <span className="popup-close" onClick={() => setActiveCard(null)}>
        <FaTimes />
      </span>
      <h2 className="popup-title">Language Translations</h2>
      <div className="media-list">
        {mediaList.length > 0 ? (
          mediaList.map((item) => (
            <div 
              key={item._id} 
              className={`media-item ${isEditMode && selectedItems.translations.includes(item._id) ? 'selected' : ''}`}
              onClick={() => isEditMode && handleItemSelect('translations', item._id)}
            >
              <p>Original Text: {item.original_text}</p>
              <p>Translated Text: {item.translated_text}</p>
              <p className="timestamp">
                {new Date(item.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p>No translations found.</p>
        )}
      </div>
      <div className="btn-div-profile">
        <button 
          className="delete-all-btn"
          onClick={handleDeleteSelected}
          disabled={!Object.values(selectedItems).some(items => items && items.length > 0)}
        >
          {isEditMode ? 'Delete Selected Items' : 'Delete All'}
        </button>
        <button 
          className="delete-all-btn1"
          onClick={handleEditClick}
        >
          {isEditMode ? 'Cancel' : 'Edit'}
        </button>
      </div>
    </div>
  </div>
)}

      {activeCard === "synopsis" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setActiveCard(null)}>
              <FaTimes />
            </span>
            <h2 className="popup-title">Synopsis History</h2>
            <div className="media-list">
              {mediaData.documentation && mediaData.documentation.length > 0 ? (
                mediaData.documentation.map((doc) => (
                  <div 
                    key={doc.file_id} 
                    className={`media-item ${isEditMode && selectedItems.documentation.includes(doc.file_id) ? 'selected' : ''}`}
                    onClick={() => isEditMode && handleItemSelect('documentation', doc.file_id)}
                  >
                    <div className="media-content">
                      <h3>{doc.filename}</h3>
                      <div className="summary-content">
                        <h4>Summary:</h4>
                        <p>{doc.summary || doc.extracted_text}</p>
                        <h4>Original Document:</h4>
                        {doc.content_type &&
                        doc.content_type.includes("pdf") ? (
                          <iframe
                            src={`http://localhost:5000/media/file/${doc.file_id}`}
                            width="100%"
                            height="500px"
                            title="PDF Preview"
                            className="pdf-preview"
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000/media/file/${doc.file_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            Download Original Document
                          </a>
                        )}
                        <p className="timestamp">
                          {new Date(doc.timestamp * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No synopsis history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button 
                className="delete-all-btn"
                onClick={handleDeleteSelected}
                disabled={!Object.values(selectedItems).some(items => items && items.length > 0)}
              >
                {isEditMode ? 'Delete Selected Items' : 'Delete All'}
              </button>
              <button 
                className="delete-all-btn1"
                onClick={handleEditClick}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeCard === "delete" && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setActiveCard(null)}>
              <FaTimes />
            </span>
            <h2 className="popup-title">Deleted History</h2>
            <div className="media-list">

            </div>
            <div className="btn-div-profile">
              <button className="delete-all-btn">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
