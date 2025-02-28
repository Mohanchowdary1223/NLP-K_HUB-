import React, { useRef, useState } from 'react';
import './AudiotoText.css'; // Assuming you're using this for CSS
import Navbar from '../../components/Navbar/Navbar'; // Ensure this path is correct

function AudioToText() {
    const [audio, setAudio] = useState(null);
    const [convertedText, setConvertedText] = useState('');
    const [classifiedData, setClassifiedData] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);

    // 🔹 Handle Audio File Upload
    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        setAudio(file); 
        setConvertedText('');
        setClassifiedData({});
        setIsVisible(false);
    };

    const handlePlaceholderClick = () => {
        fileInputRef.current.click();
    };

    // 🔹 Send Uploaded Audio File to Backend (with improved error handling)
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

            // ✅ Fix: Check if response is HTML (not JSON)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error("Server returned an invalid response. Please check backend logs.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error converting audio to text');
            }

            setConvertedText(data.extracted_text || '');
            setClassifiedData(data.classified_data || {});
            setIsVisible(true);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error processing the audio file.');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Start Live Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Please allow microphone access to record.');
        }
    };

    // 🔹 Stop Recording and Send to Backend
    const stopRecording = async () => {
        setIsRecording(false);
        setLoading(true);

        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) return;

        mediaRecorder.stop();
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recorded_audio.wav');

            try {
                const response = await fetch('http://localhost:5000/upload-audio', {
                    method: 'POST',
                    body: formData,
                });

                // ✅ Fix: Check if response is HTML (not JSON)
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error("Server returned an invalid response. Please check backend logs.");
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error converting audio to text');
                }

                setConvertedText(data.extracted_text || '');
                setClassifiedData(data.classified_data || {});
                setIsVisible(true);
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Error processing the recorded audio.');
            } finally {
                setLoading(false);
            }
        };
    };

    // 🔹 Clear Audio Data
    const handleClear = () => {
        setAudio(null);
        setConvertedText('');
        setClassifiedData({});
        setIsVisible(false);
    };

    // 🔹 Delete Extracted Text
    const handleDelete = () => {
        setConvertedText('');
        setClassifiedData({});
        setIsVisible(false);
    };

    return (
        <div>
            <Navbar />

            <div className="main-container">
                <h1>Audio to Text Converter</h1>

                {/* Converted Text Section */}
                <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
                    <h3>Here is the converted text</h3>
                    {convertedText ? (
                        <div className="converted-text">
                            <p>{convertedText}</p>
                            {Object.keys(classifiedData).length > 0 && (
                                <div>
                                    <h4>Classified Data:</h4>
                                    <ul>
                                        {Object.entries(classifiedData).map(([category, text]) => (
                                            <li key={category}>
                                                <strong>{category}:</strong> {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button 
                                className="copy-btn" 
                                onClick={() => navigator.clipboard.writeText(convertedText)}
                            >
                                Copy
                            </button>
                        </div>
                    ) : (
                        <p>No text converted yet.</p>
                    )}
                </div>

                {/* Audio Upload Section */}
                <div className="audio-area" onClick={handlePlaceholderClick}>
                    {audio ? <p>{audio.name}</p> : <div className="placeholder"><span>+ Add Audio</span></div>}
                </div>
                <input
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={handleAudioUpload}
                    style={{ display: 'none' }}
                />

                {/* Loading Indicator */}
                {loading && <p>Processing audio, please wait...</p>}

                {/* Buttons */}
                <div className="buttons">
                    <button onClick={handleAudioConvert} className="convert-btn">
                        Convert
                    </button>
                    {!isRecording ? (
                        <button onClick={startRecording} className="live-record-btn">
                            Record Live Audio
                        </button>
                    ) : (
                        <button onClick={stopRecording} className="stop-btn">
                            Stop Recording
                        </button>
                    )}
                    <button onClick={handleDelete} className="delete-btn">
                        Delete
                    </button>
                    <button onClick={handleClear} className="clear-btn">
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AudioToText;
