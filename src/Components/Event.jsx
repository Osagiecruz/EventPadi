import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../Firebase.jsx';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Event() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(
      collection(db, 'events', id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });

    return () => {
      unsubAuth();
      unsubMessages();
    };
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await addDoc(collection(db, 'events', id, 'messages'), {
      text: newMsg,
      user: user?.email || 'Anonymous',
      createdAt: serverTimestamp()
    });
    setNewMsg('');
  };

  return (
    <div className="event-parent">
    <div className="event-container">
      <h2>Event Chat</h2>
      <div className="event-info">
        <p><strong>Event ID:</strong> {id}</p>
        <div className="chat-box">
          {messages.map((msg, index) => {
            const isCurrentUser = msg.user === user?.email;
            const time = msg.createdAt?.toDate
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            return (
              <div
                key={index}
                className={`chat-message ${isCurrentUser ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  <span className="message-text">{msg.text}</span>
                  <div className="message-meta">
                    <small>{isCurrentUser ? 'You' : msg.user} • {time}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Type your message..."
            required
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
    </div>
  );
}
