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

function ProfileCard() {
    const [profileImage, setProfileImage] = useState(User);
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
    });

    const [activeCard, setActiveCard] = useState(null);
    const [mediaList, setMediaList] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null); // State to store selected media item
    
    const [translations, setTranslations] = useState([]);
    const [showTranslationsPopup, setShowTranslationsPopup] = useState(false);
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

                if (profile_image) {
                    setProfileImage(`http://localhost:5000/uploads/${email}/${profile_image}?t=${new Date().getTime()}`); 
                }

                const statsRes = await axios.get('http://localhost:5000/profile-stats', { withCredentials: true });
                const { image_count, video_count, audio_count, translation_count } = statsRes.data;

                setUploadCounts({
                    imageUploads: image_count,
                    videoUploads: video_count,
                    audioUploads: audio_count,
                    langTranslator: translation_count,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
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
                <div className="card" onClick={() => navigateToMediaPage("images")}>
                    <img src={ImgtoTxt} alt="" className="card-icon" />
                    <p>Image Uploads</p>
                    <span className="upload-count">{uploadCounts.imageUploads} uploads</span>
                </div>
                <div className="card" onClick={() => navigateToMediaPage("videos")}>
                    <img src={VidtoTxt} alt="" className="card-icon" />
                    <p>Video Uploads</p>
                    <span className="upload-count">{uploadCounts.videoUploads} uploads</span>
                </div>
                <div className="card" onClick={() => navigateToMediaPage("audios")}>
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
               
            </div>
            
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
        </div>
    );
}

export default ProfileCard;
