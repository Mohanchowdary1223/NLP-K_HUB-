import React, { useRef, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar'; 
import './ImgtoText.css'; 

function ImageToText() {
    const [image, setImage] = useState(null);
    const [convertedText, setConvertedText] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState('simple');
    const [isCopied, setIsCopied] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
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
        if (!image) {
            alert('Please upload an image first!');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('model', model);

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
            // Add scroll after text is set
            setTimeout(scrollToBottom, 100); // Small delay to ensure state is updated
            
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

    const handleCopy = () => {
        if (convertedText) {
            navigator.clipboard.writeText(convertedText)
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1500);
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
                <h1>Image to Text Converter</h1>

                <div className="model-selection">
                    <label htmlFor="model">Choose OCR Model:</label>
                    <select 
                        id="model" 
                        value={model} 
                        onChange={(e) => setModel(e.target.value)} 
                        className="select-model-lable"
                    >
                        <option value="simple">Simple OCR</option>
                        <option value="gemini">Gemini OCR</option>
                        <option value="tableocr">Table OCR</option>
                    </select>
                </div>

                <div className="image-area" onClick={handlePlaceholderClick}>
                    {image ? (
                        <img 
                            src={URL.createObjectURL(image)} 
                            alt="Uploaded" 
                            className="uploaded-image" 
                        />
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
                />

                {loading && <p>Converting image, please wait...</p>}

                <div className="buttons">
                    <button onClick={handleConvert} className="convert-btn">Convert</button>
                    <button onClick={handleClear} className="clear-btn">Clear</button>
                </div>
            </div>
            <div className='r'>
                            
            {isVisible && (
                <div className="converted-text-section1">
                    <h3>Here is the converted text</h3>
                    <button
                        className={`copy-btn1 ${isCopied ? 'copied' : ''}`}
                        onClick={handleCopy}
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                    {convertedText ? (
                        <div className="converted-text1">
                            <p>{convertedText}</p>
                        </div>
                    ) : (
                        <p>No text converted yet.</p>
                    )}
                </div>
            )}

            </div>

        </div>
    );
}

export default ImageToText;