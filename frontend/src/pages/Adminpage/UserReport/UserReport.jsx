import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { NavLink } from 'react-router-dom';
import './UserReport.css';
import user from '../../../assets/user.png';
import add_icon from '../../../assets/add_icon.png';
import logoImage from "../../../assets/assets/DDLogo1.png";


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const UserReport = () => {
  const [userData, setUserData] = useState(null);
  const [uploadsData, setUploadsData] = useState(null);
  const [totalUploadsData, setTotalUploadsData] = useState(null);

  useEffect(() => {
    fetchUserGrowthData();
    fetchUploadsData();
    fetchTotalUploadsData();
  }, []);

  const fetchUserGrowthData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/user-growth?type=overall`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    }
  };

  const fetchUploadsData = async () => {
    try {
      const response = await fetch('http://localhost:5000/media/counts', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUploadsData(data);
      }
    } catch (error) {
      console.error('Error fetching uploads data:', error);
    }
  };

  const fetchTotalUploadsData = async () => {
    try {
      const response = await fetch('http://localhost:5000/total-uploads', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTotalUploadsData(data);
      }
    } catch (error) {
      console.error('Error fetching total uploads data:', error);
    }
  };

  const getChartData = () => {
    if (!userData) return {
      labels: [],
      datasets: [{
        label: 'Total Users',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    };

    return {
      labels: userData.labels,
      datasets: [{
        label: 'Total Users',
        data: userData.userCounts,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    };
  };

  const getFeatureUsageData = () => {
    if (!totalUploadsData) return {
      labels: ['Images', 'Videos', 'Audio', 'Translations', 'Synopsis'],
      datasets: [{
        label: 'Total Uploads',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1
      }]
    };

    return {
      labels: ['Images', 'Videos', 'Audio', 'Translations', 'Synopsis'],
      datasets: [{
        label: 'Total Uploads',
        data: [
          totalUploadsData.image_count || 0,
          totalUploadsData.video_count || 0,
          totalUploadsData.audio_count || 0,
          totalUploadsData.translation_count || 0,
          totalUploadsData.documentation_count || 0,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1
      }]
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Overall User Growth' }
    }
  };

  const featureOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Total Uploads Distribution' }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className='navbar-a'>
          <img src={logoImage} alt="Logo" className="logo-image-admin" />
          <div className="nav-links">
            <NavLink to='/userdata' className="nav-link">Users List</NavLink>
            <NavLink to='/userreport' className="nav-link">Report</NavLink>
            <NavLink to='/' className="home-btn">Logout</NavLink>
          </div>
        </div>
        <div className="report-container">
          <div className="charts-container">
            <div className="chart-wrapper">
              <Line options={options} data={getChartData()} />
            </div>
            <div className="chart-wrapper">
              <Bar options={featureOptions} data={getFeatureUsageData()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReport;
