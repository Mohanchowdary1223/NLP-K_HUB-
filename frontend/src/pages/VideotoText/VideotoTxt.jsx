import React, { useRef, useState } from 'react';
import './VideotoTxt.css';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';

function VideoToText() {
  const [media, setMedia] = useState(null);
  const [convertedText, setConvertedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setConvertedText('');
      setIsVisible(false);
    }
  };

  const handlePlaceholderClick = () => {
    fileInputRef.current.click();
  };

  const handleConvert = async () => {
    if (media) {
      const formData = new FormData();
      formData.append('media', media);

      setIsLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/convert-video', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status === 200) {
          setConvertedText(response.data.extracted_text || 'No text extracted');
          setIsVisible(true);
        } else {
          console.error("Unexpected response:", response);
          alert("Conversion failed. Please try again.");
        }
      } catch (error) {
        console.error("Error converting media:", error);
        if (error.response && error.response.status === 404) {
          alert("Endpoint not found. Ensure the backend server is running.");
        } else {
          alert("An error occurred during conversion. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please upload an image or video first!');
    }
  };

  const handleClear = () => {
    setMedia(null);
    setConvertedText('');
    setIsVisible(false);
    fileInputRef.current.value = null;
  };

  const handleDelete = () => {
    setConvertedText('');
  };

  return (
    <div>
      <Navbar />

      <div className={`main-container ${isVisible ? 'moved' : ''}`}>
        <h1>Video to Text Converter</h1>

        <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
          <h3>Here is the converted text</h3>
          {convertedText ? (
            <div className="converted-text">
              <p>{convertedText}</p>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(convertedText)}>Copy</button>
            </div>
          ) : (
            <p>No text converted yet.</p>
          )}
        </div>

        <div className={`video-area ${isVisible ? 'moved' : ''}`} onClick={handlePlaceholderClick}>
          {media ? (
            media.type.startsWith('video') ? (
              <video src={URL.createObjectURL(media)} controls className="uploaded-media" />
            ) : (
              <img src={URL.createObjectURL(media)} alt="Uploaded" className="uploaded-image" />
            )
          ) : (
            <div className="placeholder">
              <span>+ Add Video</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />

        <div className={`buttons ${isVisible ? 'moved' : ''}`}>
          <button onClick={handleConvert} className="convert-btn" disabled={!media || isLoading}>
            {isLoading ? "Converting..." : "Convert"}
          </button>
          <button onClick={handleDelete} className="delete-btn" disabled={!convertedText}>
            Delete
          </button>
          <button onClick={handleClear} className="clear-btn" disabled={!media && !convertedText}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoToText;
