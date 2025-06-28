import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../Firebase.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Import auth context
import '../Styles/CreateEvent.css';

const CreateEvent = () => {
    const { currentUser } = useAuth(); // Get current user
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!currentUser) {
        return (
            <div className="create-event-container">
                <div className="auth-required">
                    <h2>Authentication Required</h2>
                    <p>You must be logged in to create an event.</p>
                    <div className="auth-buttons">
                        <Link to="/login" className="auth-btn">Login</Link>
                        <Link to="/signup" className="auth-btn">Sign Up</Link>
                    </div>
                    <Link to="/" className="back-link">← Back to Events</Link>
                </div>
            </div>
        );
    }

    // Validate form data
    const validateForm = () => {
        if (!title.trim()) {
            setError('Event title is required');
            return false;
        }
        if (!location.trim()) {
            setError('Event location is required');
            return false;
        }
        if (!date) {
            setError('Event date is required');
            return false;
        }
        if (!category) {
            setError('Event category is required');
            return false;
        }
        if (!description.trim()) {
            setError('Event description is required');
            return false;
        }

        // Validate date is not in the past
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (selectedDate < today) {
            setError('Event date cannot be in the past');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            // Create event with proper security fields
            const eventData = {
                title: title.trim(),
                location: location.trim(),
                date,
                category,
                description: description.trim(),
                createdAt: new Date().toISOString(),
                createdBy: currentUser.uid, // Required for security rules
                creatorInfo: {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'Anonymous',
                },
                registeredUsers: [currentUser.uid], // Creator is automatically registered
                registeredUsersInfo: [{
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'Anonymous',
                    registeredAt: new Date().toISOString(),
                    role: 'creator'
                }],
                status: 'active', // active, cancelled, completed
                maxParticipants: null, // Can be set later if needed
                tags: [], // For future filtering
                updatedAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'events'), eventData);
            
            alert('Event created successfully!');
            navigate('/');
            
        } catch (error) {
            console.error('Error creating event:', error);
            setError('Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today) for date input
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="create-event-container">
            <div className="create-event-header">
                <h2>Create New Event</h2>
                <Link to="/" className="back-link">← Back to Events</Link>
            </div>

            {/* User info display */}
            <div className="creator-info">
                <p>Creating as: <strong>{currentUser.displayName || currentUser.email}</strong></p>
            </div>

            {/* Error display */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="create-event-form">
                <div className="form-group">
                    <label htmlFor="title">Event Title: *</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter event title"
                        maxLength="100"
                        required
                    />
                    <small>{title.length}/100 characters</small>
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location: *</label>
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter event location"
                        maxLength="100"
                        required
                    />
                    <small>{location.length}/100 characters</small>
                </div>

                <div className="form-group">
                    <label htmlFor="date">Date: *</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={getMinDate()}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category: *</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="Music">Music</option>
                        <option value="Tech">Tech</option>
                        <option value="Sports">Sports</option>
                        <option value="Social">Social</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description: *</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your event..."
                        rows="4"
                        maxLength="500"
                        required
                    />
                    <small>{description.length}/500 characters</small>
                </div>

                <div className="form-actions">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? 'Creating Event...' : 'Create Event'}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="cancel-btn"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Form guidelines */}
            <div className="form-guidelines">
                <h4>Event Guidelines:</h4>
                <ul>
                    <li>Provide clear and accurate event information</li>
                    <li>Choose an appropriate category for better discoverability</li>
                    <li>As the creator, you'll be automatically registered for the event</li>
                    <li>You can manage your event after creation</li>
                </ul>
            </div>
        </div>
    );
};

export default CreateEvent;