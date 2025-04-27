import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import './UserDashboard.css';

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [currentAQI, setCurrentAQI] = useState(0);
  const [aqiLevel, setAqiLevel] = useState('');
  const [averages, setAverages] = useState({});
  const [yearlyData, setYearlyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2023');
  const [years, setYears] = useState([]);

  const getPollutantYearlyComparison = () => {
    return yearlyData.map(data => ({
      name: data.year,
      pm25: data.pm25,
      pm10: data.pm10,
      o3: data.o3,
      no2: data.no2,
      so2: data.so2,
      co: data.co
    }));
  };

  const cityColors = {
    'Kathmandu': '#1E88E5',
    'Bhaktapur': '#FF5722',
    'Biratnagar': '#4CAF50',
    'Dharan': '#FFC107',
    'Butwal': '#9C27B0',
    'Mepalgunj': '#795548',
    'Mahendranagar': '#607D8B',
    'Janakpur': '#E91E63',
    'Bharatpur': '#03A9F4',
    'Birgunj': '#FF9800'
  };

  const pollutantLabels = {
    'pm25': 'PM2.5',
    'pm10': 'PM10',
    'o3': 'Ozone (O₃)',
    'no2': 'Nitrogen Dioxide (NO₂)',
    'so2': 'Sulfur Dioxide (SO₂)',
    'co': 'Carbon Monoxide (CO)',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/Historicaldataofcities.csv');
        const csvText = await response.text();
        
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        let parsedData = [];
        const uniqueCities = new Set();
        const uniqueYears = new Set();
        
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const values = rows[i].split(',');
          const rowData = {};
          
          headers.forEach((header, index) => {
            if (header.trim() === 'Date') {
              const dateObj = new Date(values[index]);
              rowData[header.trim()] = dateObj;
              uniqueYears.add(dateObj.getFullYear().toString());
            } else if (header.trim() === 'City') {
              rowData[header.trim()] = values[index].trim();
              uniqueCities.add(values[index].trim());
            } else {
              rowData[header.trim()] = parseFloat(values[index]);
            }
          });
          
          parsedData.push(rowData);
        }
        
        const sortedYears = Array.from(uniqueYears).sort();
        setYears(sortedYears);
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[sortedYears.length - 1]);
        }
        
        const averagesByCity = {};
        Array.from(uniqueCities).forEach(city => {
          const cityData = parsedData.filter(data => data.City === city);
          const cityAverages = {};
          
          ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'].forEach(pollutant => {
            const values = cityData.map(data => data[pollutant]).filter(val => !isNaN(val));
            cityAverages[pollutant] = values.length ? 
              Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
          });
          
          averagesByCity[city] = cityAverages;
        });
        
        const yearlyStats = Array.from(uniqueYears).map(year => {
          const yearData = parsedData.filter(item => item.Date.getFullYear().toString() === year);
          const pollutantSums = {
            pm25: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0
          };
          const pollutantCounts = {
            pm25: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0
          };
          
          yearData.forEach(data => {
            Object.keys(pollutantLabels).forEach(pollutant => {
              if (!isNaN(data[pollutant])) {
                pollutantSums[pollutant] += data[pollutant];
                pollutantCounts[pollutant]++;
              }
            });
          });
          
          const averages = {};
          Object.keys(pollutantLabels).forEach(pollutant => {
            averages[pollutant] = pollutantCounts[pollutant] ? 
              Math.round(pollutantSums[pollutant] / pollutantCounts[pollutant]) : 0;
          });
          
          return {
            year,
            ...averages
          };
        });
        
        setYearlyData(yearlyStats);
        setAverages(averagesByCity);
        setCities(Array.from(uniqueCities));
        setAirQualityData(parsedData);
        
        if (averagesByCity[selectedCity]) {
          const pm25Value = averagesByCity[selectedCity].pm25;
          setCurrentAQI(calculateAQI(pm25Value));
          setAqiLevel(getAQILevel(calculateAQI(pm25Value)));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading CSV data:", error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (averages[selectedCity]) {
      const pm25Value = averages[selectedCity].pm25;
      setCurrentAQI(calculateAQI(pm25Value));
      setAqiLevel(getAQILevel(calculateAQI(pm25Value)));
    }
  }, [selectedCity, averages]);

  const calculateAQI = (pm25) => {
    if (pm25 <= 12) {
      return Math.round((50 - 0) / (12 - 0) * (pm25 - 0) + 0);
    } else if (pm25 <= 35.4) {
      return Math.round((100 - 51) / (35.4 - 12.1) * (pm25 - 12.1) + 51);
    } else if (pm25 <= 55.4) {
      return Math.round((150 - 101) / (55.4 - 35.5) * (pm25 - 35.5) + 101);
    } else if (pm25 <= 150.4) {
      return Math.round((200 - 151) / (150.4 - 55.5) * (pm25 - 55.5) + 151);
    } else if (pm25 <= 250.4) {
      return Math.round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201);
    } else if (pm25 <= 350.4) {
      return Math.round((400 - 301) / (350.4 - 250.5) * (pm25 - 250.5) + 301);
    } else {
      return Math.round((500 - 401) / (500.4 - 350.5) * (pm25 - 350.5) + 401);
    }
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#4caf50';
    if (aqi <= 100) return '#ffeb3b';
    if (aqi <= 150) return '#ff9800';
    if (aqi <= 200) return '#f44336';
    if (aqi <= 300) return '#9c27b0';
    return '#7e0023';
  };
  
  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const filterDataByTimeframe = () => {
    if (!airQualityData.length) return [];
    
    const currentYear = parseInt(selectedYear);
    const filteredByCity = airQualityData.filter(data => data.City === selectedCity);
    
    // Filter by year first
    const filteredByYear = filteredByCity.filter(data => 
      data.Date.getFullYear() === currentYear
    );
    
    if (!filteredByYear.length) return [];
    
    const sortedData = [...filteredByYear].sort((a, b) => a.Date - b.Date);
    
    if (selectedTimeframe === 'month') {
      const monthlyData = [];
      const monthsMap = {};
      
      sortedData.forEach(data => {
        const month = data.Date.getMonth();
        const key = `${month}`;
        
        if (!monthsMap[key]) {
          monthsMap[key] = {
            name: getMonthName(month),
            month,
            count: 0,
            pm25: 0,
            pm10: 0,
            o3: 0,
            no2: 0,
            so2: 0,
            co: 0
          };
        }
        
        monthsMap[key].count++;
        monthsMap[key].pm25 += data.pm25 || 0;
        monthsMap[key].pm10 += data.pm10 || 0;
        monthsMap[key].o3 += data.o3 || 0;
        monthsMap[key].no2 += data.no2 || 0;
        monthsMap[key].so2 += data.so2 || 0;
        monthsMap[key].co += data.co || 0;
      });
      
      Object.keys(monthsMap).forEach(key => {
        const item = monthsMap[key];
        monthlyData.push({
          name: item.name,
          pm25: Math.round(item.pm25 / item.count),
          pm10: Math.round(item.pm10 / item.count),
          o3: Math.round(item.o3 / item.count),
          no2: Math.round(item.no2 / item.count),
          so2: Math.round(item.so2 / item.count),
          co: Math.round(item.co / item.count),
          month: item.month
        });
      });
      
      return monthlyData.sort((a, b) => a.month - b.month);
    } else if (selectedTimeframe === 'week') {
      // Return the most recent week of data
      return sortedData.slice(-7);
    }
    
    return [];
  };

  const getPollutantComparisonData = () => {
    if (!cities.length || !averages) return [];
    
    return cities.map(city => ({
      name: city,
      value: averages[city] ? averages[city][selectedPollutant] : 0,
      color: cityColors[city] || '#000000'
    }));
  };

  const getPollutantRadarData = () => {
    if (!selectedCity || !averages[selectedCity]) return [];
    
    return Object.keys(pollutantLabels).map(key => ({
      subject: pollutantLabels[key],
      A: averages[selectedCity][key] || 0,
      fullMark: 400
    }));
  };

  const getDataByYear = () => {
    if (!yearlyData.length) return [];
    
    // Get the year-specific data
    const yearData = yearlyData.find(data => data.year === selectedYear);
    if (!yearData) return [];
    
    // Transform it into an array format for the charts
    return Object.keys(pollutantLabels).map(key => ({
      name: pollutantLabels[key],
      value: yearData[key] || 0
    }));
  };

  const getHealthRecommendation = (aqiLevel) => {
    switch(aqiLevel) {
      case 'Good':
        return 'Air quality is satisfactory. Enjoy your normal outdoor activities.';
      case 'Moderate':
        return 'Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.';
      case 'Unhealthy for Sensitive Groups':
        return 'People with respiratory or heart conditions, children and older adults should reduce prolonged outdoor exertion.';
      case 'Unhealthy':
        return 'Everyone may begin to experience health effects. Sensitive groups should avoid prolonged outdoor exertion.';
      case 'Very Unhealthy':
        return 'Health alert: everyone may experience more serious health effects. Avoid outdoor activities.';
      case 'Hazardous':
        return 'Health warnings of emergency conditions. The entire population is more likely to be affected. Stay indoors.';
      default:
        return 'No specific recommendations available.';
    }
  };

  const timeframeData = filterDataByTimeframe();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading air quality data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      
      
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="city-select">City</label>
          <select 
            id="city-select" 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="pollutant-select">Pollutant</label>
          <select 
            id="pollutant-select" 
            value={selectedPollutant} 
            onChange={(e) => setSelectedPollutant(e.target.value)}
          >
            {Object.entries(pollutantLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="timeframe-select">Timeframe</label>
          <select 
            id="timeframe-select" 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="month">Monthly</option>
            <option value="week">Weekly</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="year-select">Year</label>
          <select 
            id="year-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="aqi-card">
            <div className="aqi-header">Current Air Quality</div>
            <div className="aqi-display">
              <div className="aqi-value" style={{ color: getAQIColor(currentAQI) }}>
                {currentAQI}
              </div>
              <div className="aqi-label" style={{ color: getAQIColor(currentAQI) }}>{aqiLevel}</div>
            </div>
            <div className="aqi-city">{selectedCity}</div>
            <div className="aqi-recommendation">
              {getHealthRecommendation(aqiLevel)}
            </div>
          </div>
          
          <div className="chart-card">
            <h3>{pollutantLabels[selectedPollutant]} Trends ({selectedYear})</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={timeframeData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPollutant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1E88E5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={selectedPollutant} 
                    stroke="#1E88E5" 
                    fill="url(#colorPollutant)" 
                    fillOpacity={1}
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-card">
            <h3>City Comparison ({pollutantLabels[selectedPollutant]})</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={getPollutantComparisonData()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                  <XAxis type="number" stroke="#666" />
                  <YAxis dataKey="name" type="category" stroke="#666" width={80} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {getPollutantComparisonData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Yearly Analysis for {selectedYear}</h2>
          <div className="dashboard-grid">
            <div className="chart-card yearly-chart">
              <h3>Pollutant Comparison ({selectedYear})</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDataByYear()} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1E88E5" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Pollutant Distribution ({selectedCity})</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart outerRadius={90} data={getPollutantRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar 
                      name={selectedCity} 
                      dataKey="A" 
                      stroke="#1E88E5" 
                      fill="#1E88E5" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Yearly Pollutant Trends</h2>
          <div className="yearly-comparison">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getPollutantYearlyComparison()} barSize={15}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="pm25" name="PM2.5" fill="#1E88E5" />
                <Bar dataKey="pm10" name="PM10" fill="#4CAF50" />
                <Bar dataKey="o3" name="O₃" fill="#FFC107" />
                <Bar dataKey="no2" name="NO₂" fill="#FF5722" />
                <Bar dataKey="so2" name="SO₂" fill="#9C27B0" />
                <Bar dataKey="co" name="CO" fill="#607D8B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Historical Trends</h2>
          <div className="dashboard-grid">
            <div className="chart-card full-width">
              <h3>Monthly Trends for {selectedYear}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeframeData}>
                    <defs>
                      <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1E88E5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pm25" 
                      name="PM2.5" 
                      stroke="#1E88E5" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pm10" 
                      name="PM10" 
                      stroke="#4CAF50" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-footer">
          <p>Data source: Historical Air Quality Data of Cities in Nepal</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;