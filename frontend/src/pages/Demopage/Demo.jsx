import React from "react";
import { Link } from "react-router-dom";
import "./Demo.css";
import landscape from '../../assets/landscape-1.png';
import Navbar from '../../components/Navbar/Navbar';

import ImgtoTxt from '../../assets/assets/Image to Text.png';
import VidtoTxt from '../../assets/assets/Video to Text.png';
import AudtoTxt from '../../assets/assets/Audio to Text.png';
import LangTranslator from '../../assets/assets/Language Translator.png';

export const Demo = () => {
  return (
    <div>
      <div> <Navbar /></div>

      <div className="cnt">

        <div className="container">

          <div className="card">
            <div className="imgbox" data-text="Image to Text">
              <img className="logo" src={ImgtoTxt} alt="Image to Text" />
            </div>
            <div className="content">
              <div>
                <h3>Image to Text</h3>
                <p>It converts an image into text</p>
                <Link to="/image-to-text">Convert</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="imgbox" data-text="Video to Text">
              <img className="logo" src={VidtoTxt} alt="Video to Text" />
            </div>
            <div className="content">
              <div>
                <h3>Video to Text</h3>
                <p>It converts a video into text</p>
                <Link to="/video-to-text">Convert</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="imgbox" data-text="Audio to Text">
              <img className="logo" src={AudtoTxt} alt="Audio to Text" />
            </div>
            <div className="content">
              <div>
                <h3>Audio to Text</h3>
                <p>It converts audio into text</p>
                <Link to="/audio-to-text">Convert</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="imgbox" data-text="Language Translator">
              <img className="logo" src={LangTranslator} alt="Language Translator" />
            </div>
            <div className="content">
              <div>
                <h3>Language Translator</h3>
                <p>It translates any language</p>
                <Link to="/language-translator">Translate</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Demo;

