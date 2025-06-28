import React, { useEffect, useState } from 'react';
import { auth } from '../Firebase.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../Firebase.jsx';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import '../Styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userEvents, setUserEvents] = useState({ present: [], past: [] });
  const [eventsLoading, setEventsLoading] = useState(false);

  // Online/Offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user's registered events
  const fetchUserEvents = async (userId) => {
    setEventsLoading(true);
    try {
      // First, try to get all events where user is registered (without orderBy to avoid index requirement)
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('registeredUsers', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const events = [];
      const currentDate = new Date();
      
      querySnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        events.push(eventData);
      });

      // Sort events by date manually (since we can't use orderBy with array-contains without index)
      events.sort((a, b) => {
        const dateA = new Date(a.eventDate || a.date || 0);
        const dateB = new Date(b.eventDate || b.date || 0);
        return dateB - dateA; // Descending order (newest first)
      });

      // Separate events into present/future and past
      const presentEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate || event.date);
        return eventDate >= currentDate;
      });

      const pastEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate || event.date);
        return eventDate < currentDate;
      });

      setUserEvents({ present: presentEvents, past: pastEvents });
    } catch (error) {
      console.error('Error fetching user events:', error);
      // If events collection doesn't exist or has different structure, handle gracefully
      setUserEvents({ present: [], past: [] });
    }
    setEventsLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        
        try {
          const snap = await getDoc(docRef);
          
          if (snap.exists()) {
            const data = snap.data();
            setProfileData(data);
            setBio(data.bio || '');
            setUsername(data.username || '');
            setInterests(data.interests ? data.interests.join(', ') : '');
            setIsEditing(false);
          } else {
            console.log('No document found for user:', currentUser.uid);
            setProfileData({});
            setBio('');
            setUsername('');
            setInterests('');
            setIsEditing(true);
          }

          // Fetch user's registered events
          await fetchUserEvents(currentUser.uid);
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      } else {
        setUser(null);
        setProfileData(null);
        setBio('');
        setUsername('');
        setInterests('');
        setUserEvents({ present: [], past: [] });
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) {
      alert('No user logged in');
      return;
    }
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const profileData = {
        email: user.email,
        username: username || '',
        bio: bio || '',
        interests: interests ? interests.split(',').map(item => item.trim()).filter(item => item !== '') : [],
        lastUpdated: new Date().toISOString(),
        uid: user.uid,
        isOnline: isOnline,
        lastSeen: new Date().toISOString()
      };
      
      console.log('Profile data to save:', profileData);
      
      await setDoc(docRef, profileData, { merge: true });
      console.log('Profile saved successfully');
      
      setProfileData(profileData);
      setIsEditing(false);
      alert('Profile saved successfully!');
      
    } catch (error) {
      console.error('Detailed error:', error);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules.');
      } else if (error.code === 'unauthenticated') {
        alert('User not authenticated. Please log in again.');
      } else {
        alert(`Error saving profile: ${error.message}`);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setBio(profileData?.bio || '');
    setUsername(profileData?.username || '');
    setInterests(profileData?.interests ? profileData.interests.join(', ') : '');
    setIsEditing(false);
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Please log in to view your profile</h2>
      </div>
    );
  }
  
  return (
    <div className="profile-parent">
      <div className="profile-container">
        {/* Left Side - Profile Information */}
        <div className="profile-left">
          <h2>My Profile</h2>
          
          {/* Online Status Indicator */}
          <div className="online-status" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
            padding: '8px 12px',
            backgroundColor: isOnline ? '#e8f5e8' : '#ffe8e8',
            borderRadius: '6px',
            border: `2px solid ${isOnline ? '#4CAF50' : '#f44336'}`
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#4CAF50' : '#f44336',
              marginRight: '8px',
              animation: isOnline ? 'pulse 2s infinite' : 'none'
            }}></span>
            <span style={{
              color: isOnline ? '#2e7d32' : '#c62828',
              fontWeight: 'bold'
            }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="profile-info">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</p>
            
            <div>
              <label>Username:</label>
              <input 
                type="text"
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username..."
                style={{
                  width: '100%', 
                  margin: '5px 0',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                disabled={!isEditing}
                className={!isEditing ? 'readonly-input' : ''}
              />
            </div>
            
            <div>
              <label>Bio:</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                style={{width: '100%', margin: '5px 0'}}
                disabled={!isEditing}
                className={!isEditing ? 'readonly-textarea' : ''}
              />
            </div>
            
            <div>
              <label>Interests (comma-separated):</label>
              <textarea 
                value={interests} 
                onChange={e => setInterests(e.target.value)}
                placeholder="e.g., Music, Technology, Sports"
                rows={2}
                style={{width: '100%', margin: '5px 0'}}
                disabled={!isEditing}
                className={!isEditing ? 'readonly-textarea' : ''}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              {isEditing ? (
                <div>
                  <button 
                    onClick={handleSave} 
                    style={{
                      marginRight: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Profile
                  </button>
                  {profileData && Object.keys(profileData).length > 0 && (
                    <button 
                      onClick={handleCancel}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleEdit}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {profileData === null && (
              <p style={{color: 'orange', marginTop: '10px'}}>
                No profile data found. Fill out the form above to create your profile.
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Events Section */}
        <div className="profile-right">
          <div className="events-section">
            <h3>My Events</h3>
            
            {eventsLoading ? (
              <p>Loading events...</p>
            ) : (
              <div>
                {/* Present/Future Events */}
                <div className="present-events" style={{marginBottom: '20px'}}>
                  <h4 style={{color: '#2196F3', marginBottom: '10px'}}>
                    Upcoming Events ({userEvents.present.length})
                  </h4>
                  {userEvents.present.length === 0 ? (
                    <p style={{color: '#666', fontStyle: 'italic'}}>
                      No upcoming events registered.
                    </p>
                  ) : (
                    <div className="events-list">
                      {userEvents.present.map((event) => (
                        <div 
                          key={event.id} 
                          className="event-card"
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '10px',
                            backgroundColor: '#f9f9f9'
                          }}
                        >
                          <h5 style={{margin: '0 0 5px 0', color: '#333'}}>
                            {event.title || event.name || 'Untitled Event'}
                          </h5>
                          <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666'}}>
                            📅 {formatEventDate(event.eventDate || event.date)}
                          </p>
                          {event.location && (
                            <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666'}}>
                              📍 {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#777'}}>
                              {event.description.length > 100 
                                ? `${event.description.substring(0, 100)}...` 
                                : event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Events */}
                <div className="past-events">
                  <h4 style={{color: '#9E9E9E', marginBottom: '10px'}}>
                    Past Events ({userEvents.past.length})
                  </h4>
                  {userEvents.past.length === 0 ? (
                    <p style={{color: '#666', fontStyle: 'italic'}}>
                      No past events found.
                    </p>
                  ) : (
                    <div className="events-list">
                      {userEvents.past.slice(0, 5).map((event) => (
                        <div 
                          key={event.id} 
                          className="event-card"
                          style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '10px',
                            backgroundColor: '#f5f5f5',
                            opacity: 0.8
                          }}
                        >
                          <h5 style={{margin: '0 0 5px 0', color: '#666'}}>
                            {event.title || event.name || 'Untitled Event'}
                          </h5>
                          <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#999'}}>
                            📅 {formatEventDate(event.eventDate || event.date)}
                          </p>
                          {event.location && (
                            <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#999'}}>
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                      ))}
                      {userEvents.past.length > 5 && (
                        <p style={{color: '#999', fontStyle: 'italic', textAlign: 'center'}}>
                          And {userEvents.past.length - 5} more past events...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .readonly-input {
          background-color: #f5f5f5 !important;
          cursor: not-allowed !important;
        }
        
        .readonly-textarea {
          background-color: #f5f5f5 !important;
          cursor: not-allowed !important;
        }
        `}
      </style>
    </div>
  );
};

export default Profile;