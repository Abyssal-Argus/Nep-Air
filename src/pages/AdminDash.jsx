import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from "../firebase";
import './AdminDash.css';

const AdminDash = () => {
  const [users, setUsers] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
      showNotification('Error fetching users!', 'error');
    }
  };

  const fetchPendingAdmins = async () => {
    try {
      const adminsCollection = collection(db, 'users');
      const adminsSnapshot = await getDocs(adminsCollection);
      const adminsData = adminsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'admin' && user.status === 'pending');
      setPendingAdmins(adminsData);
    } catch (error) {
      console.error("Error fetching pending admins:", error);
      showNotification('Error fetching pending admins!', 'error');
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleApprove = async (id) => {
    try {
      const adminDoc = doc(db, 'users', id);
      await updateDoc(adminDoc, { status: 'approved' });
      setPendingAdmins(pendingAdmins.filter(admin => admin.id !== id));
      showNotification('Admin approved successfully!', 'success');
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error approving admin:", error);
      showNotification('Error approving admin!', 'error');
    }
  };

  const handleRemoveUser = async (id) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        const userDoc = doc(db, 'users', id);
        await deleteDoc(userDoc);
        setUsers(users.filter(user => user.id !== id));
        showNotification('User removed successfully!', 'success');
      } catch (error) {
        console.error("Error removing user:", error);
        showNotification('Error removing user!', 'error');
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingAdmins();
  }, []);

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { title: "Total Users", value: users.length, icon: "👥", color: "#3498db" },
    { title: "Active Users", value: users.filter(u => u.status === 'approved').length, icon: "✅", color: "#2ecc71" },
    { title: "Pending Admins", value: pendingAdmins.length, icon: "⏳", color: "#f39c12" },
    { title: "Admins", value: users.filter(u => u.role === 'admin' && u.status === 'approved').length, icon: "👑", color: "#9b59b6" }
  ];

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage your users and admin approvals</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index} style={{"--card-color": stat.color}}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <h3>{stat.title}</h3>
                <p>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Pending Admins
            {pendingAdmins.length > 0 && (
              <span className="badge">{pendingAdmins.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="table-container">
                <div className="table-header">
                  <h2>User Management</h2>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-message">No users found</td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`role-badge ${user.role}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.status}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="action-btn remove"
                                onClick={() => handleRemoveUser(user.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="table-container">
                <h2>Admin Approvals</h2>
                {pendingAdmins.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No pending admin approvals at this time.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Request Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingAdmins.map(admin => (
                          <tr key={admin.id}>
                            <td>{admin.firstName} {admin.lastName}</td>
                            <td>{admin.email}</td>
                            <td>{new Date(admin.createdAt?.toDate() || new Date()).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="approve-btn"
                                onClick={() => handleApprove(admin.id)}
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        <footer className="admin-footer">
          <p>© 2025 Admin Dashboard • All rights reserved</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDash;