import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MediaPage.css"; // Ensure you include the CSS file for styles
import Navbar from "../../components/Navbar/Navbar";

const MediaPage = () => {
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [audios, setAudios] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [selectedType, setSelectedType] = useState("");

    useEffect(() => {
        // Fetch media files
        const fetchMedia = async () => {
            try {
                const imageRes = await axios.get("http://localhost:5000/uploads/images", { withCredentials: true });
                const videoRes = await axios.get("http://localhost:5000/uploads/videos", { withCredentials: true });
                const audioRes = await axios.get("http://localhost:5000/uploads/audios", { withCredentials: true });
                setImages(imageRes.data);
                setVideos(videoRes.data);
                setAudios(audioRes.data);
            } catch (error) {
                console.error("Error fetching media files:", error);
            }
        };

        fetchMedia();
    }, []);

    const handleMediaClick = (media, type) => {
        setSelectedMedia(media);
        setSelectedType(type);
    };

    return (
        <>
        <Navbar />

        <div className="media-page">
            <h1>Media Files</h1>

            {/* Images Section */}
            <section>
                <h2>Images</h2>
                <div className="media-grid">
                    {images.map((image, index) => (
                        <div key={index} className="media-item">
                            <img
                                src={image}
                                alt={`Image ${index}`}
                                className="media-thumbnail"
                                onClick={() => handleMediaClick(image, "image")}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Videos Section */}
            <section>
                <h2>Videos</h2>
                <div className="media-grid">
                    {videos.map((video, index) => (
                        <div key={index} className="media-item">
                            <video
                                className="media-thumbnail"
                                onClick={() => handleMediaClick(video, "video")}
                                controls
                                src={video}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Audios Section */}
            <section>
                <h2>Audios</h2>
                <ul className="media-list">
                    {audios.map((audio, index) => (
                        <li key={index} className="media-audio" onClick={() => handleMediaClick(audio, "audio")}>
                            {audio.split('/').pop()} {/* Display only the filename */}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Selected Media Viewer */}
            {selectedMedia && (
                <div className="media-viewer">
                    <h3>Preview: {selectedMedia.split('/').pop()}</h3>
                    {selectedType === "image" && (
                        <img src={selectedMedia} alt="Selected" />
                    )}
                    {selectedType === "video" && (
                        <video controls src={selectedMedia} />
                    )}
                    {selectedType === "audio" && (
                        <audio controls src={selectedMedia} />
                    )}
                    <button onClick={() => setSelectedMedia(null)}>Close</button>
                </div>
            )}
        </div>
        </>
    );
};

export default MediaPage;
