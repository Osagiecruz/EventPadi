import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../Firebase.jsx';
import { useNavigate } from 'react-router-dom';
import '../Styles/CreateEvent.css'


const CreateEvent = () => {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, 'events'), {
           title,
           location,
           date,
           category,
           description,
           createdAt: new Date(). toISOString() 
        });
        alert('Event created!');
        navigate('/');
    };


  return (
    <div className="create-event-container">
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmit} className="create-event-form">
            <label>Title:</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required />

            <label>Location:</label>
            <input value={location} onChange={e => setLocation(e.target.value)} required />

            <label>Date:</label>
            <input value={date} onChange={e => setDate(e.target.value)} required />

            <label>Category:</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
               <option value="Music">Music</option>
               <option value="Tech">Tech</option>
               <option value="Sports">Sports</option>
               <option value="Social">Social</option>
            </select>
            {/* <input value={category} onChange={e => setCategory(e.target.value)} required /> */}

            <label>Description:</label>
            <input value={description} onChange={e => setDescription(e.target.value)} required />

            <button type="submit">Create Event</button>

        </form>
      
    </div>
  );
};

export default CreateEvent
