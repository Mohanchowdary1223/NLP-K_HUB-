import React, { useRef, useState } from 'react';
import './ImgtoText.css'; // Assuming you're using this for CSS
import Navbar from '../../components/Navbar/Navbar'; // Make sure this path is correct

function ImageToText() {
    const [image, setImage] = useState(null);
    const [convertedText, setConvertedText] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState('simple'); // New state for model selection
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setImage(file); // Keep file as a blob for backend upload
        setConvertedText('');
        setIsVisible(false);
    };

    const handlePlaceholderClick = () => {
        fileInputRef.current.click();
    };

    const handleConvert = async () => {
        if (!image) {
            alert('Please upload an image first!');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('model', model); // Append selected model to form data

        try {
            const response = await fetch('http://localhost:5000/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                mode: 'cors'
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to convert image');
            }

            if (result.error) {
                throw new Error(result.error);
            }

            setConvertedText(result.extracted_text || '');
            setIsVisible(true);
            
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error converting image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setImage(null);
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
                <h1>Image to Text Converter</h1>

                {/* Model Selection Dropdown */}
                <div className="model-selection">
                    <label htmlFor="model">Choose OCR Model:</label>
                    <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="simple">Simple OCR</option>
                        <option value="gemini">Gemini OCR</option>
                        <option value="tableocr">Table OCR</option>
                    </select>
                </div>

                {/* Converted Text Section */}
                <div className={`converted-text-section ${isVisible ? 'visible' : ''}`}>
                    <h3>Here is the converted text</h3>
                    <button 
                         className="copy-btn"
                         onClick={() => navigator.clipboard.writeText(convertedText)}
                     >
                         Copy
                     </button>
                    {convertedText ? (
                         
                        <div className="converted-text">
                            <p>{convertedText}</p>
                           
                        </div>
                    ) : (
                        <p>No text converted yet.</p>
                    )}
                </div>

                {/* Image Upload Section */}
                <div className={`image-area ${isVisible ? 'moved' : ''}`} onClick={handlePlaceholderClick}>
                    {image ? (
                        <img src={URL.createObjectURL(image)} alt="Uploaded" className="uploaded-image" />
                    ) : (
                        <div className="placeholder">
                            <span>+ Add Image</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />

                {/* Loading Indicator */}
                {loading && <p>Converting image, please wait...</p>}

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

export default ImageToText;