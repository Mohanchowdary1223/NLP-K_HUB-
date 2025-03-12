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
import deletimg from "../../assets/deleteimgprofile.png";

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
    documentation: [],
  });

  // Add new state for trash data
  const [trashData, setTrashData] = useState({
    images: [],
    videos: [],
    audios: [],
    translations: [],
    documentation: [],
  });

  // Add new state for trash counts
  const [trashCounts, setTrashCounts] = useState({
    images: 0,
    videos: 0,
    audios: 0,
    translations: 0,
    documentation: 0,
  });

  // Add new state for copy status
  const [copiedIds, setCopiedIds] = useState(new Set());

  // Add copy handler function
  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      // Add ID to copied set
      setCopiedIds(new Set([...copiedIds, id]));
      // Remove ID after 2 seconds
      setTimeout(() => {
        setCopiedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

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

  // Add new useEffect to fetch trash data
  useEffect(() => {
    const fetchTrashData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/trash-data", {
          withCredentials: true,
        });
        setTrashData(response.data);

        // Update counts
        setTrashCounts({
          images: response.data.images.length,
          videos: response.data.videos.length,
          audios: response.data.audios.length,
          translations: response.data.translations.length,
          documentation: response.data.documentation.length,
        });
      } catch (error) {
        console.error("Error fetching trash data:", error);
      }
    };

    fetchTrashData();
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
        documentation: [],
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
      const response = await axios.post(
        "http://localhost:5000/profile/update",
        formData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        // Close edit modal
        setIsEditing(false);
        // Show success notification (you might want to add a notification system)
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
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
    setSelectedItems((prev) => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter((item) => item !== id)
        : [...prev[type], id],
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
        documentation: selectedItems.documentation,
      };

      // Check if any items are selected
      const hasSelectedItems = Object.values(itemsToDelete).some(
        (items) => items && items.length > 0
      );

      if (!hasSelectedItems) {
        console.log("No items selected");
        return;
      }

      console.log("Sending items to delete:", itemsToDelete);

      const response = await axios.post(
        "http://localhost:5000/move-to-trash",
        { items: itemsToDelete },
        { withCredentials: true }
      );

      if (response.status === 200) {
        // Update all media states
        setMediaData((prevData) => ({
          images: prevData.images.filter(
            (img) => !selectedItems.images.includes(img.file_id)
          ),
          videos: prevData.videos.filter(
            (vid) => !selectedItems.videos.includes(vid.file_id)
          ),
          audios: prevData.audios.filter(
            (aud) => !selectedItems.audios.includes(aud.file_id)
          ),
          documentation: prevData.documentation.filter(
            (doc) => !selectedItems.documentation.includes(doc.file_id)
          ),
        }));

        // Update translations list
        setMediaList((prevList) =>
          prevList.filter(
            (item) => !selectedItems.translations.includes(item._id)
          )
        );

        // Reset all selected items
        setSelectedItems({
          images: [],
          videos: [],
          audios: [],
          translations: [],
          documentation: [],
        });

        // Update upload counts
        setUploadCounts((prev) => ({
          ...prev,
          imageUploads: prev.imageUploads - (selectedItems.images.length || 0),
          videoUploads: prev.videoUploads - (selectedItems.videos.length || 0),
          audioUploads: prev.audioUploads - (selectedItems.audios.length || 0),
          langTranslator:
            prev.langTranslator - (selectedItems.translations.length || 0),
          documentationUploads:
            prev.documentationUploads -
            (selectedItems.documentation.length || 0),
        }));

        // Exit edit mode
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error moving items to trash:", error);
    }
  };

  // Add this new function after handleDeleteSelected
  const handleDeleteAll = async () => {
    try {
      // Determine which type of media to delete based on activeCard
      let itemsToDelete = {
        images: [],
        videos: [],
        audios: [],
        translations: [],
        documentation: [],
      };

      // Fill the appropriate array based on activeCard
      switch (activeCard) {
        case "images":
          itemsToDelete.images = mediaData.images.map((img) => img.file_id);
          break;
        case "videos":
          itemsToDelete.videos = mediaData.videos.map((vid) => vid.file_id);
          break;
        case "audios":
          itemsToDelete.audios = mediaData.audios.map((aud) => aud.file_id);
          break;
        case "langTranslator":
          itemsToDelete.translations = mediaList.map((item) => item._id);
          break;
        case "synopsis":
          itemsToDelete.documentation = mediaData.documentation.map(
            (doc) => doc.file_id
          );
          break;
        default:
          return;
      }

      const response = await axios.post(
        "http://localhost:5000/move-to-trash",
        { items: itemsToDelete },
        { withCredentials: true }
      );

      if (response.status === 200) {
        // Update states based on which type was deleted
        if (activeCard === "images") {
          setMediaData((prev) => ({ ...prev, images: [] }));
          setUploadCounts((prev) => ({ ...prev, imageUploads: 0 }));
        } else if (activeCard === "videos") {
          setMediaData((prev) => ({ ...prev, videos: [] }));
          setUploadCounts((prev) => ({ ...prev, videoUploads: 0 }));
        } else if (activeCard === "audios") {
          setMediaData((prev) => ({ ...prev, audios: [] }));
          setUploadCounts((prev) => ({ ...prev, audioUploads: 0 }));
        } else if (activeCard === "langTranslator") {
          setMediaList([]);
          setUploadCounts((prev) => ({ ...prev, langTranslator: 0 }));
        } else if (activeCard === "synopsis") {
          setMediaData((prev) => ({ ...prev, documentation: [] }));
          setUploadCounts((prev) => ({ ...prev, documentationUploads: 0 }));
        }
      }
    } catch (error) {
      console.error("Error moving all items to trash:", error);
    }
  };

  // Add this new function after handleDeleteAll
  const handlePermanentDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete all items? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Get all items from current visible section in trash
      const itemsToDelete = {
        images: [],
        videos: [],
        audios: [],
        translations: [],
        documentation: [],
      };

      // Get all visible items based on section
      if (trashData.images && trashData.images.length > 0) {
        itemsToDelete.images = trashData.images.map((item) => item.file_id);
      }
      if (trashData.videos && trashData.videos.length > 0) {
        itemsToDelete.videos = trashData.videos.map((item) => item.file_id);
      }
      if (trashData.audios && trashData.audios.length > 0) {
        itemsToDelete.audios = trashData.audios.map((item) => item.file_id);
      }
      if (trashData.translations && trashData.translations.length > 0) {
        itemsToDelete.translations = trashData.translations.map(
          (item) => item._id
        );
      }
      if (trashData.documentation && trashData.documentation.length > 0) {
        itemsToDelete.documentation = trashData.documentation.map(
          (item) => item.file_id
        );
      }

      // Check if there are any items to delete
      const hasItems = Object.values(itemsToDelete).some(
        (arr) => arr.length > 0
      );
      if (!hasItems) {
        alert("No items to delete");
        return;
      }

      console.log("Sending items to delete:", itemsToDelete);

      const response = await axios.post(
        "http://localhost:5000/permanently-delete",
        { items: itemsToDelete },
        { withCredentials: true }
      );

      if (response.status === 200) {
        // Clear all trash data
        setTrashData({
          images: [],
          videos: [],
          audios: [],
          translations: [],
          documentation: [],
        });

        // Reset all trash counts
        setTrashCounts({
          images: 0,
          videos: 0,
          audios: 0,
          translations: 0,
          documentation: 0,
        });

        // Show success message
        alert("All items have been permanently deleted");
      }
    } catch (error) {
      console.error("Error performing permanent deletion:", error);
      alert("Failed to delete items permanently");
    }
  };

  const DEFAULT_PROFILE_IMAGE =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleEditProfile = () => {
    setIsEditing(true); // This opens the edit modal
  };

  return (
    <div>
      <Navbar />
      <div className="profile-card">
        <div className="edit-profile" onClick={handleEditProfile}>
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
            <div className="modal-header">
              <h2>Edit Your Details</h2>
            </div>
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
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
                  disabled  // Email should be disabled as it's usually not changeable
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
              <div className="button-group">
                <button type="submit" className="save-btn">Save</button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
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
            {Object.values(trashCounts).reduce((a, b) => a + b, 0)} items
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
                    className={`media-item ${
                      isEditMode && selectedItems.images.includes(image.file_id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      isEditMode && handleItemSelect("images", image.file_id)
                    }
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
                    <button
                      className="copy-bttn-profile"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(image.extracted_text, image.file_id);
                      }}
                    >
                      {copiedIds.has(image.file_id) ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))
              ) : (
                <p>No image history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button
                className="delete-all-btn"
                onClick={isEditMode ? handleDeleteSelected : handleDeleteAll}
                disabled={
                  isEditMode &&
                  !Object.values(selectedItems).some(
                    (items) => items && items.length > 0
                  )
                }
              >
                {isEditMode ? "Delete Selected Items" : "Delete All"}
              </button>
              <button className="delete-all-btn1" onClick={handleEditClick}>
                {isEditMode ? "Cancel" : "Edit"}
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
                mediaData.videos.map((video) => (
                  <div
                    key={video.file_id}
                    className={`media-item ${
                      isEditMode && selectedItems.videos.includes(video.file_id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      isEditMode && handleItemSelect("videos", video.file_id)
                    }
                  >
                    <div className="media-content">
                      <h3>{video.filename}</h3>
                      <video
                        controls
                        className="media-thumbnail"
                        crossOrigin="anonymous"
                      >
                        <source
                          src={`http://localhost:5000/media/file/${video.file_id}`}
                          type={video.content_type || "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                      <div className="text-content">
                        <h4>Extracted Text:</h4>
                        <p>{video.extracted_text}</p>
                        <p className="timestamp">
                          {new Date(video.timestamp * 1000).toLocaleString()}
                        </p>
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(video.extracted_text, video.file_id);
                          }}
                        >
                          {copiedIds.has(video.file_id) ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No video history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button
                className="delete-all-btn"
                onClick={isEditMode ? handleDeleteSelected : handleDeleteAll}
                disabled={
                  isEditMode &&
                  !Object.values(selectedItems).some(
                    (items) => items && items.length > 0
                  )
                }
              >
                {isEditMode ? "Delete Selected Items" : "Delete All"}
              </button>
              <button className="delete-all-btn1" onClick={handleEditClick}>
                {isEditMode ? "Cancel" : "Edit"}
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
                    className={`media-item ${
                      isEditMode && selectedItems.audios.includes(audio.file_id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      isEditMode && handleItemSelect("audios", audio.file_id)
                    }
                  >
                    <div className="media-content">
                      <h3>{audio.filename}</h3>
                      <audio
                        controls
                        className="media-player"
                        crossOrigin="anonymous"
                      >
                        <source
                          src={`http://localhost:5000/media/file/${audio.file_id}`}
                          type={audio.content_type || "audio/mpeg"}
                        />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="text-content">
                        <h4>Extracted Text:</h4>
                        <p>{audio.extracted_text}</p>
                        <p className="timestamp">
                          {new Date(audio.timestamp * 1000).toLocaleString()}
                        </p>
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(audio.extracted_text, audio.file_id);
                          }}
                        >
                          {copiedIds.has(audio.file_id) ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No audio history found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button
                className="delete-all-btn"
                onClick={isEditMode ? handleDeleteSelected : handleDeleteAll}
                disabled={
                  isEditMode &&
                  !Object.values(selectedItems).some(
                    (items) => items && items.length > 0
                  )
                }
              >
                {isEditMode ? "Delete Selected Items" : "Delete All"}
              </button>
              <button className="delete-all-btn1" onClick={handleEditClick}>
                {isEditMode ? "Cancel" : "Edit"}
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
                    className={`media-item ${
                      isEditMode &&
                      selectedItems.translations.includes(item._id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      isEditMode && handleItemSelect("translations", item._id)
                    }
                  >
                    <p>Original Text: {item.original_text}</p>
                    <p>Translated Text: {item.translated_text}</p>
                    <p className="timestamp">
                      {new Date(item.timestamp * 1000).toLocaleString()}
                    </p>
                    <button
                      className="copy-bttn-profile"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.translated_text, item._id);
                      }}
                    >
                      {copiedIds.has(item._id) ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))
              ) : (
                <p>No translations found.</p>
              )}
            </div>
            <div className="btn-div-profile">
              <button
                className="delete-all-btn"
                onClick={isEditMode ? handleDeleteSelected : handleDeleteAll}
                disabled={
                  isEditMode &&
                  !Object.values(selectedItems).some(
                    (items) => items && items.length > 0
                  )
                }
              >
                {isEditMode ? "Delete Selected Items" : "Delete All"}
              </button>
              <button className="delete-all-btn1" onClick={handleEditClick}>
                {isEditMode ? "Cancel" : "Edit"}
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
                    className={`media-item ${
                      isEditMode &&
                      selectedItems.documentation.includes(doc.file_id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      isEditMode &&
                      handleItemSelect("documentation", doc.file_id)
                    }
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
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(doc.summary, doc.file_id);
                          }}
                        >
                          {copiedIds.has(doc.file_id) ? "Copied!" : "Copy"}
                        </button>
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
                onClick={isEditMode ? handleDeleteSelected : handleDeleteAll}
                disabled={
                  isEditMode &&
                  !Object.values(selectedItems).some(
                    (items) => items && items.length > 0
                  )
                }
              >
                {isEditMode ? "Delete Selected Items" : "Delete All"}
              </button>
              <button className="delete-all-btn1" onClick={handleEditClick}>
                {isEditMode ? "Cancel" : "Edit"}
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
            <h2 className="popup-title">
              Trash ({Object.values(trashCounts).reduce((a, b) => a + b, 0)}{" "}
              items)
            </h2>
            <div className="media-list">
              {/* Images Section */}
              {trashData.images && trashData.images.length > 0 && (
                <div className="trash-section">
                  <h3>Deleted Images ({trashData.images.length})</h3>
                  {trashData.images.map((item) =>
                    item && item.file_id ? ( // Add validation check
                      <div key={item._id} className="media-item">
                        <img
                          src={`http://localhost:5000/media/file/${item.file_id}`}
                          alt={item.filename || "Deleted image"}
                          className="media-thumbnail"
                          onError={(e) => {
                            console.error("Error loading image:", e);
                            e.target.src = "fallback-image-url";
                          }}
                        />
                        <div className="media-details">
                          <p>
                            <strong>Filename:</strong> {item.filename}
                          </p>
                          <p>
                            <strong>Extracted Text:</strong>{" "}
                            {item.extracted_text}
                          </p>
                          <p>
                            <strong>Deleted on:</strong>{" "}
                            {new Date(item.deleted_at * 1000).toLocaleString()}
                          </p>
                          <button
                            className="copy-bttn-profile"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.extracted_text, item._id);
                            }}
                          >
                            {copiedIds.has(item._id) ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Videos Section */}
              {trashData.audios && trashData.audios.length > 0 && (
                <div className="trash-section">
                  <h3>Deleted Audios ({trashData.audios.length})</h3>
                  {trashData.audios.map((audio) => (
                    <div key={audio._id} className="media-item">
                      <div className="audio-container">
                        <audio
                          controls
                          className="media-player"
                          onError={(e) => {
                            console.error("Error loading audio:", e);
                            e.target.src = "fallback-audio-url";
                          }}
                        >
                          <source
                            src={`http://localhost:5000/media/file/${audio.file_id}`}
                            type={audio.content_type || "audio/mpeg"}
                          />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <div className="media-details">
                        <p>
                          <strong>Filename:</strong> {audio.filename}
                        </p>
                        <p>
                          <strong>Extracted Text:</strong>{" "}
                          {audio.extracted_text}
                        </p>
                        <p>
                          <strong>Deleted on:</strong>{" "}
                          {new Date(audio.deleted_at * 1000).toLocaleString()}
                        </p>
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(audio.extracted_text, audio.file_id);
                          }}
                        >
                          {copiedIds.has(audio.file_id) ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {trashData.videos && trashData.videos.length > 0 && (
                <div className="trash-section">
                  <h3>Deleted Videos ({trashData.videos.length})</h3>
                  {trashData.videos.map((video) => (
                    <div key={video._id} className="media-item">
                      <div className="video-container">
                        <video
                          controls
                          className="media-thumbnail"
                          onError={(e) => {
                            console.error("Error loading video:", e);
                            e.target.src = "fallback-video-url";
                          }}
                        >
                          <source
                            src={`http://localhost:5000/media/file/${video.file_id}`}
                            type={video.content_type || "video/mp4"}
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="media-details">
                        <p>
                          <strong>Filename:</strong> {video.filename}
                        </p>
                        <p>
                          <strong>Extracted Text:</strong>{" "}
                          {video.extracted_text}
                        </p>
                        <p>
                          <strong>Deleted on:</strong>{" "}
                          {new Date(video.deleted_at * 1000).toLocaleString()}
                        </p>
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(video.extracted_text, video._id);
                          }}
                        >
                          {copiedIds.has(video._id) ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Translations Section */}
              {trashData.translations.length > 0 && (
                <div className="trash-section">
                  <h3>
                    Deleted Translations ({trashData.translations.length})
                  </h3>
                  {trashData.translations.map((item) => (
                    <div key={item._id} className="media-item">
                      <div className="translation-details">
                        <p>
                          <strong>Original Text:</strong> {item.original_text}
                        </p>
                        <p>
                          <strong>Translated Text:</strong>{" "}
                          {item.translated_text}
                        </p>
                        <p>
                          <strong>Deleted on:</strong>{" "}
                          {new Date(item.deleted_at * 1000).toLocaleString()}
                        </p>
                        <button
                          className="copy-bttn-profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.translated_text, item._id);
                          }}
                        >
                          {copiedIds.has(item._id) ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documentation Section */}
              {trashData.documentation.length > 0 && (
                <div className="trash-section">
                  <h3>Deleted Synopsis ({trashData.documentation.length})</h3>
                  {trashData.documentation.map((item) => (
                    <div key={item._id} className="media-item">
                      <div className="documentation-details">
                        <h4>{item.filename}</h4>
                        {item.content_type &&
                        item.content_type.includes("pdf") ? (
                          <iframe
                            src={`http://localhost:5000/media/file/${item.file_id}`}
                            width="100%"
                            height="200px"
                            title="PDF Preview"
                            className="pdf-preview"
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000/media/file/${item.file_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            View Original Document
                          </a>
                        )}
                        <div className="text-content">
                          <p>
                            <strong>Original Text:</strong> {item.original_text}
                          </p>
                          <p>
                            <strong>Summary:</strong> {item.summary}
                          </p>
                          <p>
                            <strong>Deleted on:</strong>{" "}
                            {new Date(item.deleted_at * 1000).toLocaleString()}
                          </p>
                          <button
                            className="copy-bttn-profile"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.summary, item._id);
                            }}
                          >
                            {copiedIds.has(item._id) ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {Object.values(trashData).every((arr) => arr.length === 0) && (
                <p>No items in trash</p>
              )}
            </div>
            <button
              className="delete-all-btn-new"
              onClick={handlePermanentDelete}
              disabled={
                Object.values(trashCounts).reduce((a, b) => a + b, 0) === 0
              }
            >
              Delete All Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
