import React, { useState, useEffect } from 'react';
import './Profile.css';
import User from '../../assets/assets/user.png';
import Navbar from '../../components/Navbar/Navbar';
import { FaEnvelope, FaPhone, FaPen, FaTimes, FaTrash } from 'react-icons/fa';
import ImgtoTxt from '../../assets/assets/Image to Text.png';
import VidtoTxt from '../../assets/assets/Video to Text.png';
import AudtoTxt from '../../assets/assets/Audio to Text.png';
import LangTranslator from '../../assets/assets/Language Translator.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import defaultpic from '../../assets/user-solid.png';

function ProfileCard() {
    const [profileImage, setProfileImage] = useState(defaultpic); // Change initial state to defaultpic
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
    });

    const [uploadCounts, setUploadCounts] = useState({
        imageUploads: 0,
        videoUploads: 0,
        audioUploads: 0,
        langTranslator: 0,
        documentationUploads: 0  // Add this line
    });

    const [activeCard, setActiveCard] = useState(null);
    const [mediaList, setMediaList] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null); // State to store selected media item
    
    const [translations, setTranslations] = useState([]);
    const [showTranslationsPopup, setShowTranslationsPopup] = useState(false);
    const [mediaFiles, setMediaFiles] = useState({
        images: [],
        videos: [],
        audios: []
    });
    
    const [mediaData, setMediaData] = useState({
        images: [],
        videos: [],
        audios: [],
        documentation: [] // Add documentation array
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await axios.get('http://localhost:5000/profile', { withCredentials: true });
                const { email, name, profile_image, phone, city, state } = profileRes.data;

                setFormData({
                    name: name || '',
                    email: email || '',
                    phone: phone || '',
                    city: city || '',
                    state: state || '',
                });

                // Only update profile image if user has uploaded one
                if (profile_image) {
                    setProfileImage(`http://localhost:5000/uploads/${email}/${profile_image}?t=${new Date().getTime()}`); 
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setProfileImage(defaultpic); // Set to default if there's an error
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch profile data including documentation
                const response = await axios.get('http://localhost:5000/user/media', {
                    withCredentials: true
                });
                
                console.log('Media response:', response.data); // Debug log
                
                // Update the mediaData state with documentation
                setMediaData({
                    ...mediaData,
                    documentation: response.data.files?.filter(file => 
                        file.source === 'documentation'
                    ) || []
                });
            } catch (error) {
                console.error('Error fetching media:', error);
            }
        };
      
        fetchData();
    }, []);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(URL.createObjectURL(file));
            const formData = new FormData();
            formData.append('profileImage', file);

            try {
                await axios.post('http://localhost:5000/profile/upload-image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                });
                console.log('Image uploaded successfully');
            } catch (error) {
                console.error('Error uploading profile image:', error);
            }
        }
    };

    const handleEditClick = () => {
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/profile/update', formData, { withCredentials: true });
            console.log('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };


    const fetchTranslations = async () => {
        try {
            const res = await axios.get('http://localhost:5000/uploads/translations', { withCredentials: true });
            setTranslations(res.data);
            setShowTranslationsPopup(true);
        } catch (error) {
            console.error('Error fetching translations:', error);
        }
    };

    const navigateToMediaPage = (mediaType) => {
        navigate(`/media/${mediaType}`);
    };

    // Add new function to handle media view
    const handleMediaView = (mediaType) => {
        setActiveCard(mediaType);
    };

    return (
        <div>
            <Navbar />
            <div className="profile-card">
                <div className="edit-profile" onClick={handleEditClick}>
                    <FaPen />
                    <span>Edit Profile</span>
                </div>
                <div className="profile-image-container">
                    <img src={profileImage} alt="Profile" className="profile-image" />
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
                                    name="name"           // Changed from firstName to name
                                    placeholder="Name"    // Changed placeholder
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
                    <span className="upload-count">{uploadCounts.imageUploads} uploads</span>
                </div>
                <div className="card" onClick={() => handleMediaView("videos")}>
                    <img src={VidtoTxt} alt="" className="card-icon" />
                    <p>Video Uploads</p>
                    <span className="upload-count">{uploadCounts.videoUploads} uploads</span>
                </div>
                <div className="card" onClick={() => handleMediaView("audios")}>
                    <img src={AudtoTxt} alt="" className="card-icon" />
                    <p>Audio Uploads</p>
                    <span className="upload-count">{uploadCounts.audioUploads} uploads</span>
                </div>
                <div
                    className="card"
                    onClick={() => {
                        setActiveCard("langTranslator");
                        const fetchData = async () => {
                            try {
                                const res = await axios.get('http://localhost:5000/uploads/translations', {
                                    withCredentials: true,
                                });
                                setMediaList(res.data);
                            } catch (error) {
                                console.error('Error fetching language translations:', error);
                            }
                        };
                        fetchData();
                    }}
                >
                    <img src={LangTranslator} alt="" className="card-icon" />
                    <p>Language Translator</p>
                    <span className="upload-count">{uploadCounts.langTranslator} translations</span> 
                </div> 
               

                <div className="card" onClick={() => handleMediaView("synopsis")}>
                    <img src={ImgtoTxt} alt="" className="card-icon" />
                    <p>Synopsis uploades</p>
                    <span className="upload-count">
                        {uploadCounts.documentationUploads || 0} summaries
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
                                    <div key={image.file_id} className="media-item">
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
                                mediaData.videos.filter(video => video.source !== 'documentation').map((video) => (
                                    <div key={video.file_id} className="media-item">
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
                                    <div key={audio.file_id} className="media-item">
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
                                mediaList.map((item, index) => (
                                    <div key={index} className="media-item">
                                        <p>Original Text: {item.original_text}</p>
                                        <p>Translated Text: {item.translated_text}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No history found.</p>
                            )}
                        </div>
                        <button className="delete-all-btn">Delete All History</button>
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
                        <div key={doc.file_id} className="media-item">
                            <div className="media-content">
                                <h3>{doc.filename}</h3>
                                <div className="summary-content">
                                    <h4>Summary:</h4>
                                    <p>{doc.summary || doc.extracted_text}</p>
                                    <h4>Original Document:</h4>
                                    {doc.content_type && doc.content_type.includes('pdf') ? (
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
        </div>
    </div>
)}

        </div>
    );
}

export default ProfileCard;
