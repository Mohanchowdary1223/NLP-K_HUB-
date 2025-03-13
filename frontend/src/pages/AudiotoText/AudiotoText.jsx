import React, { useRef, useState } from 'react';
import './AudiotoText.css'; // Assuming you're using this for CSS
import Navbar from '../../components/Navbar/Navbar'; // Ensure this path is correct

function AudioToText() {
    const [audio, setAudio] = useState(null);
    const [convertedText, setConvertedText] = useState('');
    const [classifiedData, setClassifiedData] = useState({});
    const [translatedText, setTranslatedText] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('en'); // Default language: English
    const [isCopied, setIsCopied] = useState(false); // New state for copy functionality
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        setAudio(file); // Store as file object for backend
        setConvertedText('');
        setClassifiedData({});
        setTranslatedText('');
        setIsVisible(false);
    };

    const handlePlaceholderClick = () => {
        fileInputRef.current.click();
    };

    const handleAudioConvert = async () => {
        if (!audio) {
            alert('Please upload an audio file first!');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('audio', audio);

        try {
            const response = await fetch('http://localhost:5000/upload-audio', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error converting audio to text');
            }

            setConvertedText(data.extracted_text);
            setClassifiedData(data.classified_data);
            setIsVisible(true);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error processing the audio file.');
        } finally {
            setLoading(false);
        }
    };

    const handleLiveRecording = async () => {
        setIsRecording(true);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/record-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_language: targetLanguage }),
            });

            if (response.ok) {
                const data = await response.json();
                setConvertedText(data.extracted_text); // Show transcription
                setIsVisible(true); // Make sidebar visible
                setTimeout(scrollToBottom, 100);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing live audio.');
        } finally {
            setIsRecording(false);
            setLoading(false);
        }
    };

    const handleClear = () => {
        setAudio(null);
        setConvertedText('');
        setClassifiedData({});
        setTranslatedText('');
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
            <div className="main-container">
                <h1>Audio to Text Converter</h1>
                
                <div className="audio-area" onClick={handlePlaceholderClick}>
                    {audio ? (
                        <div className="audio-preview">
                            <audio src={URL.createObjectURL(audio)} controls className='auido-view'/>
                        </div>
                    ) : (
                        <div className="placeholder">
                            <span>+ Add Audio</span>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={handleAudioUpload}
                    style={{ display: 'none' }}
                />

                {loading && <p className="loading-text">Processing audio, please wait...</p>}

                <div className="buttons">
                    <button onClick={handleAudioConvert} className="convert-btn" disabled={!audio || loading}>
                        {loading ? "Converting..." : "Convert"}
                    </button>
                    <button onClick={handleLiveRecording} className="live-record-btn" disabled={isRecording || loading}>
                        {isRecording ? "Recording..." : "Record Live"}
                    </button>
                    <button onClick={handleClear} className="clear-btn" disabled={!audio && !convertedText}>
                        Clear
                    </button>
                </div>
            </div>

            {isVisible && (
                <div className="converted-text-section1a">
                    <h3>Here is the converted text</h3>
                    <button
                        className={`copy-btn1a ${isCopied ? 'copied' : ''}`}
                        onClick={handleCopy}
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                    {convertedText ? (
                        <div className="converted-text1a">
                            <p>{convertedText}</p>
                            {Object.keys(classifiedData).length > 0 && (
                                <div className="classified-dataa">
                                    <h4>Classified Information:</h4>
                                    <ul>
                                        {Object.entries(classifiedData).map(([category, text]) => (
                                            <li key={category}>
                                                <strong>{category}:</strong> {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>No text converted yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default AudioToText;