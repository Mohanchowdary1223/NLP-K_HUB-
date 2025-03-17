import React, { useState } from 'react';
import './Contact.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import contactpageA from '../../assets/assets/contactpageA.mp4';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });

    const [responseMessage, setResponseMessage] = useState('');
    const [responseType, setResponseType] = useState(''); // "success" or "error"

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/submit-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // This ensures cookies are sent for authentication
                body: JSON.stringify({
                    name: formData.name,
                    message: formData.message,
                    timestamp: Math.floor(Date.now() / 1000)
                    // Removed email from payload since we'll use the authenticated user's email
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setResponseMessage('Your message has been submitted successfully!');
                setResponseType('success');
                setFormData({ name: '', email: '', message: '' }); // Clear form
            } else {
                setResponseMessage(result.error || 'Failed to submit the form. Please make sure you are logged in.');
                setResponseType('error');
            }
        } catch (error) {
            console.error('Error submitting the form:', error);
            setResponseMessage('An unexpected error occurred. Please try again later.');
            setResponseType('error');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="contact-video-container">
                <video className="contact-video" autoPlay loop muted>
                    <source src={contactpageA} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="contact-container">
                <div className="contact-content">
                    {/* Left Side: Contact Details */}
                    <div className="contact-left-side">
                        <div className="contact-detail address">
                            <FaMapMarkerAlt className="icon" />
                            <div className="contact-topic">Address</div>
                            <div className="contact-text text-one">KIET HUB</div>
                            <div className="contact-text text-two">Korangi</div>
                        </div>

                        <div className="contact-detail phone">
                            <FaPhoneAlt className="icon" />
                            <div className="contact-topic">Phone</div>
                            <div className="contact-text text-one">+91 7673978153</div>
                            <div className="contact-text text-two">+91 9876543211</div>
                        </div>

                        <div className="contact-detail email">
                            <FaEnvelope className="icon" />
                            <div className="contact-topic">Email</div>
                            <div className="contact-text text-one">datadialect.com</div>
                            <div className="contact-text text-two">krishna@gmail.com</div>
                        </div>
                    </div>

                    {/* Right Side: Contact Form */}
                    <div className="contact-right-side">
                        <div className="contact-topic-text">Send us a message</div>
                        <p className="contact-description">
                            If you have any work or queries, you can send us a message from here.
                        </p>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="contact-input-box">
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                    className="contact-input"
                                    required
                                />
                            </div>
                            <div className="contact-input-box">
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Your logged in email will be used"
                                    className="contact-input"
                                    disabled
                                    required
                                />
                            </div>
                            <div className="contact-input-box message-box">
                                <textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Enter your message"
                                    className="contact-textarea"
                                    required
                                ></textarea>
                            </div>
                            <div className="contact-button">
                                <button type="submit" className="contact-submit-btn">Send Now</button>
                            </div>
                        </form>

                        {responseMessage && (
                            <p className={`response-message ${responseType === 'success' ? 'success' : 'error'}`}>
                                {responseMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="map-section">
                <div className="map-container">
                    <h3 className="map-title">Our Location</h3>
                    <iframe
                        className="map-iframe"
                        title="Google Map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3819.2809637276446!2d82.23772427418872!3d16.812412083979993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a38205e52dbce3d%3A0x794aa1538de4100f!2sKiet%20College!5e0!3m2!1sen!2sin!4v1742193265602!5m2!1sen!2sin"
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                    ></iframe>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Contact;
