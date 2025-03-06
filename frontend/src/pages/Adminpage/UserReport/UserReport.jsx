import React, { useState } from 'react';
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
  const [reportType, setReportType] = useState('overall');

  const getChartData = () => {
    const periods = {
      weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      monthly: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      overall: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    };
    return {
      labels: periods[reportType],
      datasets: [{
        label: 'Total Users',
        data: reportType === 'weekly' 
          ? [65, 75, 85, 95, 80, 70, 90]
          : reportType === 'monthly'
          ? [280, 320, 350, 300]
          : [1200, 1500, 1800, 2200, 2500, 2800],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    };
  };

  const getFeatureUsageData = () => {
    const periods = {
      weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      monthly: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      overall: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    };
    return {
      labels: periods[reportType],
      datasets: [
        { label: 'Image to Text', data: reportType === 'weekly' ? [45, 55, 65, 75, 60, 50, 70] : reportType === 'monthly' ? [200, 240, 270, 220] : [800, 1000, 1200, 1500, 1700, 1900], backgroundColor: 'rgba(255, 99, 132, 0.5)' },
        { label: 'Video to Text', data: reportType === 'weekly' ? [35, 45, 55, 65, 50, 40, 60] : reportType === 'monthly' ? [180, 220, 250, 200] : [600, 800, 1000, 1300, 1500, 1700], backgroundColor: 'rgba(54, 162, 235, 0.5)' },
        { label: 'Audio to Text', data: reportType === 'weekly' ? [25, 35, 45, 55, 40, 30, 50] : reportType === 'monthly' ? [160, 200, 230, 180] : [400, 600, 800, 1100, 1300, 1500], backgroundColor: 'rgba(75, 192, 192, 0.5)' },
        { label: 'Language Translation', data: reportType === 'weekly' ? [15, 25, 35, 45, 30, 20, 40] : reportType === 'monthly' ? [140, 180, 210, 160] : [200, 400, 600, 900, 1100, 1300], backgroundColor: 'rgba(153, 102, 255, 0.5)' }
      ]
    };
  };

  const options = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'User Growth' } } };
  const featureOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Feature Usage Statistics' } } };

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
          <div className="report-header">
            <div className="report-tabs">
              <button className={`report-tab ${reportType === 'overall' ? 'active' : ''}`} onClick={() => setReportType('overall')}>Overall Report</button>
              <button className={`report-tab ${reportType === 'monthly' ? 'active' : ''}`} onClick={() => setReportType('monthly')}>Monthly Report</button>
              <button className={`report-tab ${reportType === 'weekly' ? 'active' : ''}`} onClick={() => setReportType('weekly')}>Weekly Report</button>
            </div>
          </div>
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
