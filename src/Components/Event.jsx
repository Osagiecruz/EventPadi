import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../Firebase.jsx';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Emoji picker data
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '🥰', '😍', '🤗', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😔', '😢', '😭', '😤', '😡', '🤔', '🙄', '😴', '🤯'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤝', '🙏'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🎯', '🎳', '🎮', '🎲', '🎪', '🎨', '🎭', '🎪', '🎼', '🎵', '🎶']
};

// Countdown Component
const EventCountdown = ({ eventDate, eventTime }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEventStarted: false,
    isEventPassed: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Parse the event date and time
      let eventDateTime;
      
      try {
        if (eventTime) {
          // If event has a specific time, combine date and time
          eventDateTime = new Date(`${eventDate} ${eventTime}`);
        } else {
          // If no specific time, assume event starts at beginning of the day
          eventDateTime = new Date(eventDate);
          eventDateTime.setHours(0, 0, 0, 0);
        }
        
        const now = new Date();
        const difference = eventDateTime.getTime() - now.getTime();

        if (difference > 0) {
          // Event is in the future
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          setTimeLeft({
            days,
            hours,
            minutes,
            seconds,
            isEventStarted: false,
            isEventPassed: false
          });
        } else if (difference > -86400000) {
          // Event started today (within 24 hours ago)
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isEventStarted: true,
            isEventPassed: false
          });
        } else {
          // Event has passed (more than 24 hours ago)
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isEventStarted: false,
            isEventPassed: true
          });
        }
      } catch (error) {
        console.error('Error parsing event date:', error);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isEventStarted: false,
          isEventPassed: false
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, eventTime]);

  const getCountdownStatus = () => {
    if (timeLeft.isEventPassed) {
      return { text: 'Event has ended', className: 'countdown-ended' };
    } else if (timeLeft.isEventStarted) {
      return { text: 'Event is live now!', className: 'countdown-live' };
    } else if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes <= 30) {
      return { text: 'Starting very soon!', className: 'countdown-urgent' };
    } else if (timeLeft.days === 0) {
      return { text: 'Starting today!', className: 'countdown-today' };
    } else {
      return { text: 'Countdown to event', className: 'countdown-normal' };
    }
  };

  const status = getCountdownStatus();

  if (timeLeft.isEventPassed) {
    return (
      <div className="countdown-container">
        <div className="countdown-header">
          <span className="countdown-icon">🏁</span>
          <span className={`countdown-status ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>
    );
  }

  if (timeLeft.isEventStarted) {
    return (
      <div className="countdown-container">
        <div className="countdown-header">
          <span className="countdown-icon live-pulse">🔴</span>
          <span className={`countdown-status ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      <div className="countdown-header">
        <span className="countdown-icon">⏰</span>
        <span className={`countdown-status ${status.className}`}>
          {status.text}
        </span>
      </div>
      <div className="countdown-display">
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.days}</span>
          <span className="countdown-label">Days</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Hours</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Minutes</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Seconds</span>
        </div>
      </div>
    </div>
  );
};

// Profile Modal Component - Updated for better dark mode visibility
const ProfileModal = ({ user, onClose, currentUserId }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', user.userId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        // Fetch user's events
        const eventsQuery = query(
          collection(db, 'events'),
          where('registeredUsers', 'array-contains', user.userId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserEvents(events);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user.userId]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Loading Profile...</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Profile</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <h4>{user.userName}</h4>
            
            {userProfile && (
              <div className="profile-details">
                {userProfile.bio && (
                  <div className="bio-section">
                    <h5>Bio</h5>
                    <p className="bio-text">{userProfile.bio}</p>
                  </div>
                )}
                {userProfile.interests && userProfile.interests.length > 0 && (
                  <div className="interests-section">
                    <h5>Interests</h5>
                    <div className="interests-tags">
                      {userProfile.interests.map((interest, index) => (
                        <span key={index} className="interest-tag">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="events-section">
              <h5>Events ({userEvents.length})</h5>
              {userEvents.length > 0 ? (
                <div className="events-list">
                  {userEvents.map(event => (
                    <div key={event.id} className="event-item">
                      <strong className="event-title">{event.title}</strong>
                      <span className="event-date">{event.date}</span>
                      <span className="event-location">{event.location}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-events">No events registered</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Emoji Picker Component
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys');

  return (
    <div className="emoji-picker">
      <div className="emoji-categories">
        {Object.keys(EMOJI_CATEGORIES).map(category => (
          <button
            key={category}
            className={`emoji-category ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            className="emoji-button"
            onClick={() => onEmojiSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Online Users Component
const OnlineUsers = ({ users, onUserClick, currentUserId }) => {
  return (
    <div className="online-users-sidebar">
      <h4>Registered Users ({users.length})</h4>
      <div className="users-list">
        {users.map(user => (
          <div key={user.userId} className="user-item" onClick={() => onUserClick(user)}>
            <div className="user-avatar">
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.userName}</span>
              <div className="user-status">
                <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
                <span className="status-text">
                  {user.isOnline ? 'Online' : `Last seen ${user.lastSeen}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Event() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const chatBoxRef = useRef(null);

  // Check if user is registered for this event
  const checkRegistration = async (currentUser, eventData) => {
    if (!currentUser || !eventData) return false;
    
    const registeredUsers = eventData.registeredUsers || [];
    return registeredUsers.includes(currentUser.uid);
  };

  // Update user's last seen timestamp
  const updateLastSeen = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastSeen: serverTimestamp(),
        isOnline: true
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  // Set user offline when leaving
  const setUserOffline = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  // Fetch registered users with their online status
  const fetchRegisteredUsers = async (eventData) => {
    if (!eventData || !eventData.registeredUsers) return;

    try {
      const users = [];
      for (const userId of eventData.registeredUsers) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          users.push({
            userId,
            userName: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
            userEmail: userData.email,
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen?.toDate ? 
              userData.lastSeen.toDate().toLocaleString() : 'Never'
          });
        }
      }
      setRegisteredUsers(users);
    } catch (error) {
      console.error('Error fetching registered users:', error);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMsg(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    let unsubAuth;
    let unsubMessages;
    let unsubEvent;

    const setupListeners = async () => {
      try {
        // Auth state listener
        unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          
          if (currentUser) {
            // Update user's online status
            await updateLastSeen(currentUser.uid);
            
            if (event) {
              const registered = await checkRegistration(currentUser, event);
              setIsRegistered(registered);
            }
          }
        });

        // Fetch event data first
        const eventRef = doc(db, 'events', id);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        const eventData = { id: eventSnap.id, ...eventSnap.data() };
        setEvent(eventData);

        // Fetch registered users
        await fetchRegisteredUsers(eventData);

        // Check registration status
        if (user) {
          const registered = await checkRegistration(user, eventData);
          setIsRegistered(registered);
        }

        // Set up messages listener
        const q = query(
          collection(db, 'events', id, 'messages'),
          orderBy('createdAt', 'asc')
        );

        unsubMessages = onSnapshot(q, 
          (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMessages(msgs);
          },
          (error) => {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages');
          }
        );

        setLoading(false);

      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('Failed to load event data');
        setLoading(false);
      }
    };

    setupListeners();

    // Set user offline when component unmounts
    return () => {
      if (user) {
        setUserOffline(user.uid);
      }
      if (unsubAuth) unsubAuth();
      if (unsubMessages) unsubMessages();
      if (unsubEvent) unsubEvent();
    };
  }, [id, user?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMsg.trim()) return;
    
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    if (!isRegistered) {
      setError('You must be registered for this event to send messages');
      return;
    }

    try {
      setSendingMessage(true);
      setError('');

      // Get user's display name from users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const displayName = userData?.displayName || user.displayName || user.email?.split('@')[0] || 'Unknown User';

      await addDoc(collection(db, 'events', id, 'messages'), {
        text: newMsg.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: displayName,
        createdAt: serverTimestamp()
      });
      
      setNewMsg('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle user profile click
  const handleUserClick = (selectedUser) => {
    setSelectedUser(selectedUser);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`event-parent ${darkMode ? 'dark-mode' : ''}`}>
        <div className="event-container">
          <h2>Loading Event...</h2>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className={`event-parent ${darkMode ? 'dark-mode' : ''}`}>
        <div className="event-container">
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          <Link to="/" className="back-btn">← Back to Events</Link>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`event-parent ${darkMode ? 'dark-mode' : ''}`}>
        <div className="event-container">
          <h2>{event?.title || 'Event Chat'}</h2>
          <div className="access-denied">
            <p>You must be logged in to access this event chat.</p>
            <Link to="/login" className="login-btn">Log In</Link>
            <Link to="/allevents" className="back-btn">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  // Not registered for event
  if (!isRegistered) {
    return (
      <div className={`event-parent ${darkMode ? 'dark-mode' : ''}`}>
        <div className="event-container">
          <h2>{event?.title || 'Event Chat'}</h2>
          <div className="access-denied">
            <p>You must be registered for this event to access the chat.</p>
            <p>Please go back to the events page and register first.</p>
            <Link to="/allevents" className="back-btn">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface (only shown to registered users)
  return (
    <div className={`event-parent ${darkMode ? 'dark-mode' : ''}`}>
      <div className="event-container">
        <div className="event-header">
          <h2>{event?.title || 'Event Chat'}</h2>
          <div className="header-controls">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <Link to="/allevents" className="back-btn">← Back to Events</Link>
          </div>
        </div>
        
        <div className="event-main">
          <OnlineUsers 
            users={registeredUsers}
            onUserClick={handleUserClick}
            currentUserId={user?.uid}
          />
          
          <div className="chat-section">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="chat-box" ref={chatBoxRef}>
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Be the first to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.userId === user?.uid;
                  const time = msg.createdAt?.toDate
                    ? msg.createdAt.toDate().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    : '';
                  
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message ${isCurrentUser ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-header">
                          {!isCurrentUser && (
                            <div className="message-user">
                              <button 
                                className="profile-icon"
                                onClick={() => handleUserClick({
                                  userId: msg.userId,
                                  userName: msg.userName,
                                  userEmail: msg.userEmail
                                })}
                                title="View Profile"
                              >
                                👤
                              </button>
                              <span className="user-name">{msg.userName}</span>
                            </div>
                          )}
                        </div>
                        <span className="message-text">{msg.text}</span>
                        <div className="message-meta">
                          <small>
                            {isCurrentUser ? 'You' : ''} {time && `• ${time}`}
                          </small>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <form onSubmit={handleSend} className="chat-form">
              <div className="input-container">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sendingMessage}
                  required
                />
                <button 
                  type="button"
                  className="emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add Emoji"
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <EmojiPicker 
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
              <button 
                type="submit" 
                disabled={sendingMessage || !newMsg.trim()}
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>

          <div className="event-details-sidebar">
            <h4>Event Details</h4>
            {event && (
              <div className="event-info-card">
                {/* Countdown Section */}
                <EventCountdown 
                  eventDate={event.date} 
                  eventTime={event.time}
                />
                
                <div className="detail-item">
                  <span className="detail-label">📅 Date:</span>
                  <span className="detail-value">{event.date}</span>
                </div>
                {event.time && (
                  <div className="detail-item">
                    <span className="detail-label">🕐 Time:</span>
                    <span className="detail-value">{event.time}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">📍 Location:</span>
                  <span className="detail-value">{event.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🏷️ Category:</span>
                  <span className="detail-value">{event.category}</span>
                </div>
                {event.description && (
                  <div className="detail-item description">
                    <span className="detail-label">📝 Description:</span>
                    <p className="detail-value">{event.description}</p>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">👥 Registered:</span>
                  <span className="detail-value">{event.registeredUsers?.length || 0} users</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedUser && (
        <ProfileModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          currentUserId={user?.uid}
        />
      )}
    </div>
  );
}