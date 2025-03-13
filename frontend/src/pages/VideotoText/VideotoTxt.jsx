import React, { useRef, useState } from 'react';
import './VideotoTxt.css';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';

function VideoToText() {
  const [media, setMedia] = useState(null);
  const [convertedText, setConvertedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // New state for copy functionality
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

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
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

        console.log("Response from server:", response.data); // Add this line for debugging

        if (response.data && response.data.extracted_text) {
          setConvertedText(response.data.extracted_text);
          setIsVisible(true);
          setTimeout(scrollToBottom, 100);
        } else {
          console.error("No extracted text in response:", response);
          alert("No text could be extracted from the video.");
        }
      } catch (error) {
        console.error("Error converting media:", error);
        console.error("Error response:", error.response); // Add this line for debugging
        alert(error.response?.data?.error || "An error occurred during conversion.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please upload a video first!');
    }
  };

  const handleClear = () => {
    setMedia(null);
    setConvertedText('');
    setIsVisible(false);
    fileInputRef.current.value = null;
  };

  const handleCopy = () => {
    if (convertedText) {
      navigator.clipboard.writeText(convertedText)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 1000); // Reset after 1 second
        })
        .catch(() => {
          alert('Failed to copy text');
        });
    }
  };

  return (
    <div>
      <Navbar />
      <div className="main-container">
        <h1>Video to Text Converter</h1>
        
        <div className="video-area" onClick={handlePlaceholderClick}>
          {media ? (
            <video src={URL.createObjectURL(media)} controls className="uploaded-media" />
          ) : (
            <div className="placeholder">
              <span>+ Add Video</span>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />

        <div className="buttons">
          <button onClick={handleConvert} className="convert-btn" disabled={!media || isLoading}>
            {isLoading ? "Processing..." : "Convert"}
          </button>
          <button onClick={handleClear} className="clear-btn" disabled={!media && !convertedText}>
            Clear
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="converted-text-section1v">
          <h3>Here is the converted text</h3>
          <button
            className={`copy-btn1v ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
          {isLoading ? (
            <p>Processing video, please wait...</p>
          ) : (
            convertedText ? (
              <div className="converted-text1v">
                <p>{convertedText}</p>
              </div>
            ) : (
              <p>No text converted yet.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default VideoToText;