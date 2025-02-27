import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landingpage from './pages/Landingpage/Landingpage';
import Navbar from './components/Navbar/Navbar';
import Demopage from './pages/Demopage/Demo';
import ImageToText from './pages/ImagetoText/ImgtoText';
import VideoToText from './pages/VideotoText/VideotoTxt';
import AudioToText from './pages/AudiotoText/AudiotoText';
import LanguageTranslator from './pages/LangTranslator/LangTranslator';
import Aboutpage from './pages/Aboutpage/Aboutpage';
import Documentation from './pages/Documentation/Documentation';
import ContactPage from './pages/Contactpage/Contact';
import Profilepage from './pages/Profilepage/Profile';
import Userdata from './pages/Adminpage/UserData/UserData';
import Userreport from './pages/Adminpage/UserReport/UserReport';

function App() {
  return (

    <Routes>
      <Route path='/' element={<Landingpage />} />
      <Route path='/userdata' element={<Userdata />} />
      <Route path='/userreport' element={<Userreport />} />
      <Route path='/about' element={<Aboutpage />} />
      <Route path='/demo' element={<Demopage />} />
      <Route path="/image-to-text" element={<ImageToText/>} />
      <Route path="/video-to-text" element={<VideoToText/>} />
      <Route path="/audio-to-text" element={<AudioToText/>} />
      <Route path="/language-translator" element={<LanguageTranslator/>} />
      <Route path='/documentation' element={<Documentation />} />
      <Route path='/contact' element={<ContactPage />} />
      <Route path='/profile' element={<Profilepage/>} />
    </Routes>



  );

}

export default App;
