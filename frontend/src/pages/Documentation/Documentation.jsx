import React, { useRef, useState } from 'react';
import './Documentation.css'; // Assuming you're using this for CSS
import Navbar from '../../components/Navbar/Navbar'; // Make sure this path is correct

function VideoToText() {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(''); // Track the type of media (video or document)
  const [convertedText, setConvertedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      setConvertedText('');
      setIsVisible(false);

      if (fileType.startsWith('video/')) {
        setMediaType('video');
        setMedia(URL.createObjectURL(file));
      } else if (fileType === 'application/pdf') {
        setMediaType('document');
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

  const handleConvert = () => {
    if (media) {
      setConvertedText('This is a simulated result of the converted text from the uploaded media.');
      setIsVisible(true);
    } else {
      alert('Please upload a file first!');
    }
  };

  const handleClear = () => {
    setMedia(null);
    setMediaType('');
    setConvertedText('');
    setIsVisible(false);
  };

  const handleDelete = () => {
    setConvertedText('');
  };

  return (
    <div>
      <Navbar />
      <div className={`main-container ${isVisible ? 'moved' : ''}`}>
        <h1>Summarize Your File</h1>

        {/* Converted Text Section */}
        <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
          <h3>KEY NOTES.</h3>
          {convertedText ? (
            <div className="converted-text">
              <p>{convertedText}</p>
              <button className="copy-btn">Copy</button>
            </div>
          ) : (
            <p>No text converted yet.</p>
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
          <button onClick={handleDelete} className="delete-btn">Delete</button>
          <button onClick={handleClear} className="clear-btn">Clear</button>
        </div>
      </div>
    </div>
  );
}

export default VideoToText;
