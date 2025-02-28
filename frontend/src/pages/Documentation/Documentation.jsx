import React, { useRef, useState, useEffect } from 'react';
import './Documentation.css';
import Navbar from '../../components/Navbar/Navbar';

function Documentation() {
  const [pdf, setPdf] = useState(null);
  const [convertedText, setConvertedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]); // ✅ State for fetched summaries
  const fileInputRef = useRef(null);

  useEffect(() => {
    // ✅ Fetch stored summaries from backend
    const fetchSummaries = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-summaries");
        const data = await response.json();
        setSummaries(data);
      } catch (error) {
        console.error("Error fetching summaries:", error);
      }
    };

    fetchSummaries();
  }, []);

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdf(file);
      setConvertedText('');
      setIsVisible(false);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handlePlaceholderClick = () => {
    fileInputRef.current.click();
  };

  const handleConvert = async () => {
    if (!pdf) {
      alert("Please upload a PDF file first!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);

    try {
      const response = await fetch("http://localhost:5000/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unknown error occurred.");
      }

      const data = await response.json();
      setConvertedText(`Summary: ${data.summary}\n\nKey Points:\n- ${data.keypoints.replace(/\n/g, "\n- ")}`);
      setIsVisible(true);
    } catch (error) {
      console.error("Error:", error);
      alert(`Failed to process the file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPdf(null);
    setConvertedText('');
    setIsVisible(false);
  };

  return (
    <div>
      <Navbar />
      <div className={`main-container ${isVisible ? 'moved' : ''}`}>
        <h1>Summarize Your PDF</h1>

        {/* Loading Indicator ✅ */}
        {loading && <p style={{ color: 'black' }}>Processing PDF, please wait...</p>}

        {/* Converted Text Section */}
        <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
          <h3>Summary & Key Points</h3>
          {convertedText ? (
            <div className="converted-text">
              <pre>{convertedText}</pre>
              <button className="copy-btn">Copy</button>
            </div>
          ) : (
            <p>No text converted yet.</p>
          )}
        </div>

        {/* Previously Stored Summaries ✅ */}
        <div className="stored-summaries">
          <h3>Previously Summarized PDFs</h3>
          {summaries.length > 0 ? (
            <ul>
              {summaries.map((summary, index) => (
                <li key={index}>
                  <strong>{summary.filename}</strong>
                  <p>{summary.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No summaries available yet.</p>
          )}
        </div>

        {/* PDF Upload Section */}
        <div className={`pdf-area ${isVisible ? 'moved' : ''}`} onClick={handlePlaceholderClick}>
          {pdf ? <p>{pdf.name}</p> : <div className="placeholder"><span>+ Add PDF</span></div>}
        </div>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handlePdfUpload}
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

export default Documentation;
