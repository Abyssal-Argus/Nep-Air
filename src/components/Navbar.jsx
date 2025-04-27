import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FaUserCircle, FaSearch, FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.png"; // Using your logo from assets
import { useLocation } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const navRef = useRef(null);

  const cities = [
    { name: "Kathmandu", path: "/kathmandu" },
    { name: "Pokhara", path: "/pokhara" },
    { name: "Janakpur", path: "/janakpur" },
    { name: "Butwal", path: "/butwal" },
    { name: "Bhaktapur", path: "/bhaktapur" },
    { name: "Nepalgunj", path: "/nepalgunj" },
    { name: "Mahendranagar", path: "/mahendranagar" },
    { name: "Biratnagar", path: "/biratnagar" },
    { name: "Birgunj", path: "/birgunj" },
    { name: "Dharan", path: "/dharan" }
  ];

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredCities.length > 0) {
        handleSearch(filteredCities[0].path);
      } else if (searchQuery.trim() !== '') {
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchQuery("");
        setShowSuggestions(false);
      }
    }
  };

  const handleSearch = (cityPath) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(cityPath);
    closeMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsLoggedIn(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.firstName} ${userData.lastName}`);
          setUserRole(userData.role);
        }
      } else {
        setIsLoggedIn(false);
        setUserName(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserName(null);
      setUserRole(null);
      setIsLoggedIn(false);
      closeMenu();
      alert("You have been logged out successfully.");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = () => {
    closeMenu();
    navigate(userRole === "admin" ? "/admindash" : "/userprofile");
  };

  const handleDashboardClick = () => {
    closeMenu();
    navigate(userRole === "admin" ? "/admindash" : "/userdashboard");
  };

  const handleNavLinkClick = (path) => {
    closeMenu();
    navigate(path);
  };


// Then inside your Navbar component:
const location = useLocation();

// Helper function to check if path matches
const isActive = (path) => {
  return location.pathname === path;
};

  return (
    <header className="navbar-container" ref={navRef}>
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo-section" onClick={() => navigate("/")}>
            <img src={logo} alt="NepAir Logo" className="logo-icon" />
            <span className="logo-text">NepAir</span>
          </div>

          <div className="search-container">
            <div className="search-section" ref={searchRef}>
              <div className={`search-bar ${isSearchFocused ? 'focused' : ''}`}>
                {/* <FaSearch className="search-icon" /> */}
                <input
                  type="text"
                  placeholder="Search location or city"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setShowSuggestions(searchQuery.length > 0);
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="suggestions-dropdown">
                    {filteredCities.map((city) => (
                      <div
                        key={city.name}
                        className="suggestion-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearch(city.path)}
                      >
                        {city.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <div className="desktop-nav">
            <div className="nav-links">
              <button className={`nav-link ${isActive("/") ? 'active' : ''}`} onClick={() => handleNavLinkClick("/")}>
                Home
              </button>
              <button   className={`nav-link ${
              isActive("/admindash") || isActive("/userdashboard") ? 'active' : ''
              }`}  onClick={handleDashboardClick}>
                Dashboard
              </button>
              <button className={`nav-link ${isActive("/education") ? 'active' : ''}`} onClick={() => handleNavLinkClick("/education")}>
                Education
              </button>
              <button className={`nav-link ${isActive("/healthalert") ? 'active' : ''}`} onClick={() => handleNavLinkClick("/healthalert")}>
                HealthAlert
              </button>
              <button className={`nav-link ${isActive("/report") ? 'active' : ''}`} onClick={() => handleNavLinkClick("/report")}>
                Report
              </button>
            </div>

            <div className="auth-section">
              {isLoggedIn ? (
                <div className="user-profile">
                  <button 
                    className="profile-button" 
                    onClick={handleProfileClick}
                    aria-label="User profile"
                  >
                    <FaUserCircle className="user-icon" />
                    {userName && userRole && (
                      <div className="user-details">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">{userRole}</span>
                      </div>
                    )}
                  </button>
                  <button 
                    className="auth-button logout" 
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  className="auth-button login" 
                  onClick={() => {
                    closeMenu();
                    navigate("/login");
                  }}
                  aria-label="Login"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          <button 
            className={`hamburger ${menuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes className="hamburger-icon" /> : <FaBars className="hamburger-icon" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${menuOpen ? 'active' : ''}`}>
          <div className="mobile-nav-content">
            <div className="mobile-search-container">
              <div className="search-section" ref={searchRef}>
                <div className="search-bar">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search location or city"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="mobile-nav-links">
              <button className={`nav-link ${isActive("/") ? 'active' : ''}`}  onClick={() => handleNavLinkClick("/")}>
                Home
              </button>
              <button
                className={`nav-link ${
                  isActive("/admindash") || isActive("/userdashboard") ? 'active' : ''
                }`}
               onClick={handleDashboardClick}>
                Dashboard
              </button>
              <button className={`nav-link ${isActive("/education") ? 'active' : ''}`}  onClick={() => handleNavLinkClick("/education")}>
                Education
              </button>
              <button className={`nav-link ${isActive("/healthalert") ? 'active' : ''}`}  onClick={() => handleNavLinkClick("/healthalert")}>
                HealthAlert
              </button>
              <button className={`nav-link ${isActive("/report") ? 'active' : ''}`}  onClick={() => handleNavLinkClick("/report")}>
                Report
              </button>
            </div>

            <div className="mobile-auth-section">
              {isLoggedIn ? (
                <>
                  <div className="mobile-user-info">
                    <FaUserCircle className="mobile-user-icon" />
                    <div className="mobile-user-details">
                      <span className="mobile-user-name">{userName || "User"}</span>
                      <span className="mobile-user-role">{userRole || "User"}</span>
                    </div>
                  </div>
                  <div className="mobile-buttons">
                    <button 
                      className="mobile-button profile" 
                      onClick={handleProfileClick}
                    >
                      Profile
                    </button>
                    <button 
                      className="mobile-button logout" 
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  className="mobile-button login" 
                  onClick={() => {
                    closeMenu();
                    navigate("/login");
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;