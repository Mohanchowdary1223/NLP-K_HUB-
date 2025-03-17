import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import "./Aboutpage.css";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ImgtoTxt from "../../assets/assets/ImgtoText.png";
import VidtoTxt from "../../assets/assets/videotoTxt.png";
import AudtoTxt from "../../assets/assets/AudiotoTxt.png";
import LangT from "../../assets/assets/LangTranslator.png";
import DATA from "../../assets/assets/DATAPICTURE.jpg";
import Icon1 from "../../assets/assets/Icon1.png";
import Icon2 from "../../assets/assets/Icon2.png";
import Icon3 from "../../assets/assets/Icon3.png";

const Aboutpage = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isBelowHeroOnTop, setIsBelowHeroOnTop] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const backgroundSection = document.querySelector(".background-section");
      const rect = backgroundSection.getBoundingClientRect();

      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        const scaleValue = 1 + (scrollY - backgroundSection.offsetTop) * 0.0015;
        controls.start({ scale: Math.min(Math.max(scaleValue, 1), 1.1) });
      } else {
        controls.start({ scale: 1 });
      }

      if (rect.bottom <= 0) {
        setIsBelowHeroOnTop(true);
      } else {
        setIsBelowHeroOnTop(false);
      }

      const images = document.querySelectorAll(".expertise-item img");
      images.forEach((image, index) => {
        const rect = image.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (isVisible) {
          setActiveIndex(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [controls]);

  useEffect(() => {
    const icons = document.querySelectorAll(".icon-image");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          } else {
            entry.target.classList.remove("animate");
          }
        });
      },
      { threshold: 0.5 }
    );

    icons.forEach((icon) => observer.observe(icon));

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Navbar />
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Collect, Connect, Collaborate through Data</h1>
          <p>
            Transforming how we understand the world by capturing and analyzing
            data to create impactful change.
            <br />
          </p>
          <Link to="/contact">
            <button className="cta-button">
              GET IN TOUCH <span>&#8594;</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Bottom Section */}
      <div className={`below-hero-section ${isBelowHeroOnTop ? "on-top" : ""}`}>
        <div className="image-video-container">
          <div className="image-section">
            <img src={Icon1} alt="Icon 1" className="icon-image" id="icon1" />
            <img src={Icon3} alt="Icon 3" className="icon-image" id="icon2" />
            <img src={DATA} alt="Partnership Graphic" className="hero-image" />
          </div>
          <div className="text-section">
            <h2>Your Strategic Partner in Data Dialect!</h2>
            <img src={Icon2} alt="Icon 2" className="icon-image" id="icon3" />
            <p>
              Storing data ensures easy access to valuable information whenever
              needed, enabling efficient decision-making and continuity. It
              provides a secure foundation for analyzing past trends, predicting
              future outcomes, and preserving knowledge. Proper data storage
              also supports collaboration and compliance by maintaining accurate
              records for reference and accountability.
            </p>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-box">
            <Link to="/image-to-text">
              <h3>Img2Txt</h3>
              <p>
                <strong>From Image to Insight</strong>
                <br />
                Converting images to text with precision using advanced AI
                technology.
              </p>
            </Link>
          </div>
          <div className="stat-box">
            <Link to="/video-to-text">
              <h3>Vid2Txt</h3>
              <p>
                <strong>Capturing Video in Words</strong>
                <br />
                Converting videos into text accurately with advanced AI
                technology.
              </p>
            </Link>
          </div>
          <div className="stat-box">
            <Link to="/audio-to-text">
              <h3>Aud2Txt</h3>
              <p>
                <strong>Turning Sound into Text</strong>
                <br />
                Transforming audio into text efficiently using cutting-edge AI
                tools.
              </p>
            </Link>
          </div>
          <div className="stat-box">
            <Link to="/language-translator">
              <h3>TransLang</h3>
              <p>
                <strong>Bridging Language Gaps</strong>
                <br />
                Bridging language gaps through seamless and precise AI
                translations
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Background Section */}
      <div className="background-section">
        <motion.div
          className="background-image"
          initial={{ scale: 1 }}
          animate={controls}
          transition={{ duration: 0.3 }}
        />
        <h2 className="background-heading">Our Expertise</h2>
      </div>

      {/* Expertise Sections */}
      <div className="expertise-section">
        <div className="expertise-item">
          <div className="left-content">
            <h2>Img2Txt</h2>
            <p>
              Unlock the potential of decentralized finance with rigorous
              research into ZK Proofs, Consensus, Tokenomics, and more.
            </p>
            <Link to="/image-to-text">
              <button className="cta-button">
                Learn More <span>&#8594;</span>
              </button>
            </Link>
          </div>
          <div className="right-image">
            <img
              src={ImgtoTxt}
              alt="Research Expertise"
              className={activeIndex === 0 ? "active" : ""}
            />
          </div>
        </div>

        <div className="expertise-item">
          <div className="left-content">
            <h2>Vid2Txt</h2>
            <p>
              Build scalable, secure, and user-friendly decentralized
              applications that empower users globally.
            </p>
            <Link to="/video-to-text">
              <button className="cta-button">
                Learn More <span>&#8594;</span>
              </button>
            </Link>
          </div>
          <div className="right-image">
            <img
              src={VidtoTxt}
              alt="Development Expertise"
              className={activeIndex === 1 ? "active" : ""}
            />
          </div>
        </div>

        <div className="expertise-item">
          <div className="left-content">
            <h2>Aud2Txt</h2>
            <p>
              Transform your Web3 vision into reality with our expert consulting
              services tailored to your needs.
            </p>
            <Link to="/audio-to-text">
              <button className="cta-button">
                Learn More <span>&#8594;</span>
              </button>
            </Link>
          </div>
          <div className="right-image">
            <img
              src={AudtoTxt}
              alt="Consulting Expertise"
              className={activeIndex === 2 ? "active" : ""}
            />
          </div>
        </div>

        <div className="expertise-item">
          <div className="left-content">
            <h2>LingoFlow</h2>
            <p>
              Take your blockchain projects to the next level with solutions
              designed to scale and succeed in the real world.
            </p>
            <Link to="/language-translator">
              <button className="cta-button">
                Learn More <span>&#8594;</span>
              </button>
            </Link>
          </div>
          <div className="right-image">
            <img
              src={LangT}
              alt="Scaling Expertise"
              className={activeIndex === 3 ? "active" : ""}
            />
          </div>
        </div>
      </div>

      <div className="hero-container">
        <h4 className="hero-title">
          A <span className="highlight">synopsis is a brief summary</span> of a
          larger work, capturing its main points, themes, and key elements to
          provide a <span className="highlight"> quick overview 
          </span> of the plot, characters, or central ideas.
        </h4>
        <Link to="/documentation">
          <button className="cta-button-doc">
            Wanna Try <span>&#8594;</span>
          </button>
        </Link>
      </div>

      <Footer />
    </div>
  );
};

export default Aboutpage;
