import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDash from "./pages/AdminDash";
import HealthAlert from "./pages/HealthAlert";
import EducationModule from "./pages/EducationModule";
import UserProfile from "./pages/UserProfile";
import UserDashboard from "./pages/UserDashboard";
import ReportPollutionPage from "./pages/ReportPollutionPage";
import KhaltiPayment from "./pages/KhaltiPayment";
import Navbar from "./components/Navbar";
import "./App.css";
import AOS from "aos";
import "aos/dist/aos.css";

// City Pages
import Kathmandu from "./pages/cities/Kathmandu";
import Pokhara from "./pages/cities/Pokhara";
import Janakpur from "./pages/cities/Janakpur";
import Butwal from "./pages/cities/Butwal";
import Bhaktapur from "./pages/cities/Bhaktapur";
import Nepalgunj from "./pages/cities/Nepalgunj";
import Mahendranagar from "./pages/cities/Mahendranagar";
import Biratnagar from "./pages/cities/Biratnagar";
import Birgunj from "./pages/cities/Birgunj";
import Dharan from "./pages/cities/Dharan";

function App() {
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/healthalert" element={<HealthAlert />} />
        <Route path="/khalti-payment" element={<KhaltiPayment />} />
        <Route path="/education" element={<EducationModule />} />
        <Route path="/userprofile" element={<UserProfile />} />
        <Route path="/userdashboard" element={<UserDashboard />} />
        <Route path="/report" element={<ReportPollutionPage />} />

        {/* Admin Routes */}
        <Route path="/admindash" element={<AdminDash />} />

        {/* City Routes */}
        <Route path="/kathmandu" element={<Kathmandu />} />
        <Route path="/pokhara" element={<Pokhara />} />
        <Route path="/janakpur" element={<Janakpur />} />
        <Route path="/butwal" element={<Butwal />} />
        <Route path="/bhaktapur" element={<Bhaktapur />} />
        <Route path="/nepalgunj" element={<Nepalgunj />} />
        <Route path="/mahendranagar" element={<Mahendranagar />} />
        <Route path="/biratnagar" element={<Biratnagar />} />
        <Route path="/birgunj" element={<Birgunj />} />
        <Route path="/dharan" element={<Dharan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;