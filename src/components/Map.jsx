import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Info from "./Info";
import { useNavigate } from "react-router-dom";

// Fix for default icon issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function Map({ showInfo, setShowInfo }) {
  const navigate = useNavigate();

  // Add more Nepal-focused locations with descriptions
  const locations = [
    { 
      name: "Kathmandu", 
      coords: [27.7172, 85.324], 
      path: "/kathmandu",
      description: "The capital city of Nepal, known for its rich history, temples, and vibrant culture."
    },
    { 
      name: "Janakpur", 
      coords: [26.7288, 85.9263], 
      path: "/janakpur",
      description: "A historical city famous for Janaki Mandir and its cultural significance in Hindu mythology."
    },
    { 
      name: "Pokhara", 
      coords: [28.2096, 83.9856], 
      path: "/pokhara",
      description: "A scenic city located near the Annapurna mountain range, popular for trekking and adventure sports."
    },
    { 
      name: "Butwal", 
      coords: [27.7006, 83.4483], 
      path: "/butwal",
      description: "A major commercial hub in the Terai region of Nepal."
    },
    { 
      name: "Bhaktapur", 
      coords: [27.6722, 85.4279], 
      path: "/bhaktapur",
      description: "A UNESCO World Heritage Site known for its well-preserved ancient architecture."
    },
    { 
      name: "Nepalgunj", 
      coords: [28.05, 81.6167], 
      path: "/nepalgunj",
      description: "A gateway to western Nepal and nearby pilgrimage sites."
    },
    { 
      name: "Mahendranagar", 
      coords: [28.9634, 80.1838], 
      path: "/mahendranagar",
      description: "A border town in the far-western region of Nepal."
    },
    { 
      name: "Biratnagar", 
      coords: [26.4525, 87.2718], 
      path: "/biratnagar",
      description: "An industrial hub in eastern Nepal and the second-largest city in the country."
    },
    { 
      name: "Birgunj", 
      coords: [27.0167, 84.8667], 
      path: "/birgunj",
      description: "A major trade and transit point between Nepal and India."
    },
    { 
      name: "Dharan", 
      coords: [26.8129, 87.2832], 
      path: "/dharan",
      description: "A hill station and educational hub in eastern Nepal."
    },
 
    { 
      name: "Chitwan National Park", 
      coords: [27.5833, 84.4167], 
      path: "/chitwan",
      description: "A UNESCO World Heritage Site famous for its wildlife, including Bengal tigers and one-horned rhinos."
    },
  ];

  const handleMarkerClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {showInfo && (
        <div className="info-container">
          <Info setShowInfo={setShowInfo} />
        </div>
      )}
      <MapContainer center={[27.7172, 85.324]} zoom={7} className="frame">
        {/* Use a Nepal-focused tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((location, index) => (
          <Marker 
            key={index} 
            position={location.coords}
            eventHandlers={{
              click: () => handleMarkerClick(location.path),
            }}
          >
            <Popup>
              <div>
                <h3>{location.name}</h3>
                <p>{location.description}</p>
                <button 
                  style={{ cursor: "pointer", padding: "5px 10px", background: "#007bff", color: "white", border: "none", borderRadius: "5px" }} 
                  onClick={() => handleMarkerClick(location.path)}
                >
                  Learn More
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}

export default Map;