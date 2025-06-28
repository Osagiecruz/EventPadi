import React, { useEffect, useState } from 'react';
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
  getDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

  // Check if user is registered for this event
  const checkRegistration = async (currentUser, eventData) => {
    if (!currentUser || !eventData) return false;
    
    const registeredUsers = eventData.registeredUsers || [];
    return registeredUsers.includes(currentUser.uid);
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
          
          if (currentUser && event) {
            const registered = await checkRegistration(currentUser, event);
            setIsRegistered(registered);
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

        // Check registration status
        if (user) {
          const registered = await checkRegistration(user, eventData);
          setIsRegistered(registered);
        }

        // Set up messages listener only if user exists and will be checked for registration
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

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubMessages) unsubMessages();
      if (unsubEvent) unsubEvent();
    };
  }, [id, user?.uid]); // Added user.uid as dependency

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

      await addDoc(collection(db, 'events', id, 'messages'), {
        text: newMsg.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
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

  // Loading state
  if (loading) {
    return (
      <div className="event-parent">
        <div className="event-container">
          <h2>Loading Event...</h2>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className="event-parent">
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
      <div className="event-parent">
        <div className="event-container">
          <h2>{event?.title || 'Event Chat'}</h2>
          <div className="access-denied">
            <p>You must be logged in to access this event chat.</p>
            <Link to="/login" className="login-btn">Log In</Link>
            <Link to="/" className="back-btn">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  // Not registered for event
  if (!isRegistered) {
    return (
      <div className="event-parent">
        <div className="event-container">
          <h2>{event?.title || 'Event Chat'}</h2>
          <div className="access-denied">
            <p>You must be registered for this event to access the chat.</p>
            <p>Please go back to the events page and register first.</p>
            <Link to="/" className="back-btn">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface (only shown to registered users)
  return (
    <div className="event-parent">
      <div className="event-container">
        <div className="event-header">
          <h2>{event?.title || 'Event Chat'}</h2>
          <Link to="/" className="back-btn">← Back to Events</Link>
        </div>
        
        <div className="event-info">
          {event && (
            <div className="event-details">
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Category:</strong> {event.category}</p>
              {event.description && (
                <p><strong>Description:</strong> {event.description}</p>
              )}
              <p><strong>Registered Users:</strong> {event.registeredUsers?.length || 0}</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="chat-box">
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
                      <span className="message-text">{msg.text}</span>
                      <div className="message-meta">
                        <small>
                          {isCurrentUser ? 'You' : (msg.userName || msg.userEmail)} • {time}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <form onSubmit={handleSend} className="chat-form">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type your message..."
              disabled={sendingMessage}
              required
            />
            <button 
              type="submit" 
              disabled={sendingMessage || !newMsg.trim()}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}