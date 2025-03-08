import React, { useState } from 'react';
import './LangTranslator.css';
import { FaExchangeAlt, FaTrash, FaCheck, FaCopy } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';

function LangTranslator() {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en'); // Default to English
  const [targetLang, setTargetLang] = useState('te'); // Default to Telugu
  const [isCopied, setIsCopied] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) {
      // Don't send empty text
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/translate', {
        text,
        sourceLang,
        targetLang
      }, {
        withCredentials: true,  // Add this to handle cookies/session
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.translated_text) {
        setTranslatedText(response.data.translated_text);
      } else {
        setTranslatedText('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText(error.response?.data?.error || 'Error: Unable to translate');
    }
  };

  const clearText = () => {
    setText('');
    setTranslatedText('');
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText)
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
    <div className="page-container">
      <Navbar />
      <div className="translator-container">
        <h1 className="translator-title">Language Translator</h1>

        <div className="language-selectors">
          {/* Source Language Selector */}
          <select
            className="language-dropdown"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="pa">Punjabi</option>
            <option value="mr">Marathi</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="nl">Dutch</option>
            <option value="sv">Swedish</option>
            <option value="ru">Russian</option>
            <option value="uk">Ukrainian</option>
            <option value="el">Greek</option>
            <option value="tr">Turkish</option>
            <option value="ar">Arabic</option>
            <option value="he">Hebrew</option>
            <option value="fa">Persian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="vi">Vietnamese</option>
            <option value="th">Thai</option>
            <option value="id">Indonesian</option>
            <option value="ms">Malay</option>
            <option value="sw">Swahili</option>
            <option value="am">Amharic</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="zu">Zulu</option>
            <option value="af">Afrikaans</option>
            <option value="ha">Hausa</option>
            <option value="so">Somali</option>
            <option value="xh">Xhosa</option>
          </select>

          <FaExchangeAlt className="exchange-icon" onClick={() => {
            // Swap source and target languages
            const tempLang = sourceLang;
            setSourceLang(targetLang);
            setTargetLang(tempLang);
            setTranslatedText(''); // Clear translation on swap
          }} />

          {/* Target Language Selector */}
          <select
            className="language-dropdown"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="pa">Punjabi</option>
            <option value="mr">Marathi</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="nl">Dutch</option>
            <option value="sv">Swedish</option>
            <option value="ru">Russian</option>
            <option value="uk">Ukrainian</option>
            <option value="el">Greek</option>
            <option value="tr">Turkish</option>
            <option value="ar">Arabic</option>
            <option value="he">Hebrew</option>
            <option value="fa">Persian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="vi">Vietnamese</option>
            <option value="th">Thai</option>
            <option value="id">Indonesian</option>
            <option value="ms">Malay</option>
            <option value="sw">Swahili</option>
            <option value="am">Amharic</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="zu">Zulu</option>
            <option value="af">Afrikaans</option>
            <option value="ha">Hausa</option>
            <option value="so">Somali</option>
            <option value="xh">Xhosa</option>
          </select>
        </div>

        <div className="text-areas">
          <textarea
            className="text-input"
            placeholder="Enter text or copy text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="translated-text">
            <p>{translatedText || "Translated Text"}</p>
          </div>
        </div>

        <div className="action-buttons">
          <button className="translate-button" onClick={handleTranslate}>
            <FaCheck /> Translate
          </button>
          <button className="clear-button" onClick={clearText}>
            <FaTrash /> Clear
          </button>
          <button className={`copy-button ${isCopied ? 'copied' : ''}`} onClick={handleCopy}>
            <FaCopy /> {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LangTranslator;