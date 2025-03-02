import React, { useRef, useState } from 'react';
import axios from 'axios';
import './Documentation.css'; // Assuming you're using this for CSS
import Navbar from '../../components/Navbar/Navbar'; // Make sure this path is correct

function VideoToText() {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(''); // Track the type of media (video or document)
  const [convertedText, setConvertedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // New state for copy functionality
  const fileInputRef = useRef(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      setConvertedText('');
      setIsVisible(false);

      if (fileType.startsWith('video/') || fileType === 'application/pdf') {
        setMediaType(fileType.startsWith('video/') ? 'video' : 'document');
        setMedia(URL.createObjectURL(file));
      } else {
        alert('Unsupported file type! Please upload a video or a PDF document.');
        setMedia(null);
        setMediaType('');
      }
    }
  };

  const handlePlaceholderClick = () => {
    fileInputRef.current.click();
  };

  const handleConvert = async () => {
    if (!fileInputRef.current.files[0]) {
      alert('Please upload a file first!');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      const file = fileInputRef.current.files[0];
      formData.append('file', file);
      formData.append('source', 'documentation'); // Add this line to identify documentation uploads

      console.log('Uploading file:', file.name, 'Type:', file.type); // Debug log

      const response = await axios.post('http://localhost:5000/process-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        timeout: 120000 // Increase timeout to 2 minutes
      });

      console.log('Server response:', response.data); // Debug log

      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data && response.data.extracted_text) {
        setConvertedText(response.data.extracted_text);
        setIsVisible(true);
      } else {
        throw new Error('No text extracted from the file');
      }
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred during processing';
      alert(`Error processing file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMedia(null);
    setMediaType('');
    setConvertedText('');
    setIsVisible(false);
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
      <div className={`main-container ${isVisible ? 'moved' : ''}`}>
        <h1>Summarize Your File</h1>

        {/* Converted Text Section */}
        <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
          <h3>KEY NOTES.</h3>
          <button
            className={`copy-btn ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
          {isLoading ? (
            <p>Processing...</p>
          ) : (
            convertedText ? (
              <div className="converted-text">
                <p>{convertedText}</p>
              </div>
            ) : (
              <p>No text converted yet.</p>
            )
          )}
        </div>

        {/* Media Upload Section */}
        <div className={`video-area ${isVisible ? 'moved' : ''}`} onClick={handlePlaceholderClick}>
          {media ? (
            mediaType === 'video' ? (
              <video src={media} controls className="uploaded-media" />
            ) : (
              <iframe
                src={media}
                title="Uploaded Document"
                className="uploaded-media"
                frameBorder="0"
              />
            )
          ) : (
            <div className="placehold">
              <span>+ Add File (Video or PDF)</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="video/*,application/pdf" // Allow videos and PDFs
          ref={fileInputRef}
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />

        {/* Buttons */}
        <div className={`buttons ${isVisible ? 'moved' : ''}`}>
          <button onClick={handleConvert} className="convert-btn">Convert</button>
          <button onClick={handleClear} className="clear-btn">Clear</button>
        </div>
      </div>
    </div>
  );
}

export default VideoToText;