import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase.jsx'; // Ensure you have Firebase initialized
import '../Styles/Home.css'; // Import your CSS styles for Home
// import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  // const navigate = useNavigate();

  // Function to get 6 random events sorted by date
  const getRandomEventsByDate = (eventsList, count = 6) => {
    if (eventsList.length <= count) {
      return eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  
  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...eventsList];
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Take first 6 and sort by date
  return shuffled
      .slice(0, count)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };  

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setEvents(eventsList);
        setFiltered(eventsList);
        
        // Set 6 random events for initial display
        const randomEvents = getRandomEventsByDate(eventsList);
        setDisplayedEvents(randomEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    fetchEvents();
  }, []);


    const handleFilter = (value) => {
    setCategory(value);
    applyFilters(value, search);
    };

    const handleSearch = (value) => {
    setSearch(value);
    applyFilters(category, value);
  };

  const applyFilters = (categoryValue, searchValue) => {
    let filteredEvents = [...events];
    if (categoryValue !== 'All') {
      filteredEvents = filteredEvents.filter(e => e.category === categoryValue);
    }
    if (searchValue.trim()) {
      const lower = searchValue.toLowerCase();
      filteredEvents = filteredEvents.filter(
        e =>
          e.title.toLowerCase().includes(lower) ||
          e.location.toLowerCase().includes(lower)
      );
    }
    setFiltered(filteredEvents);

     // Update displayed events based on filters
    const randomFilteredEvents = getRandomEventsByDate(filteredEvents);
    setDisplayedEvents(randomFilteredEvents);
  };

  const categories = ['All', 'Music', 'Tech', 'Sports', 'Social'];
    
  //   if (value === 'All') {
  //     setFiltered(events);
  //   } else {
  //     const filteredEvents = events.filter(e => e.category === value);
  //     setFiltered(filteredEvents);
  //   }
  // };

  // const categories = ['All', 'Music', 'Tech', 'Sports', 'Social'];

    // Simulated event data
  //   setEvents([
  //     { id: '1', title: 'Jazz Concert', date: '2025-07-01', location: 'Lagos' },
  //     { id: '2', title: 'Tech Meetup', date: '2025-07-05', location: 'Abuja' },
  //   ]);
  // }, []);

//   return (
//     <div className="home-container">
//       <h2>Upcoming Events</h2>
//       <Link to="/createevent">+ Create Event</Link>
//       <div className="event-list">
//         {events.length === 0 && <p>No events yet. Be the first to create one!</p>}
//         {events.map(event => (
//           <div key={event.id} className="event-card">
//             <h3>{event.title}</h3>
//             <p>{event.date} - {event.location}</p>
//             <p>Category: {event.category}</p>
//             <Link to={`/event/${event.id}`}>Join with Others</Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

return (
    <div className="home-container">
      <h2>Upcoming Events</h2>
      <Link to="/createevent" className="create-event-btn">
              <strong>+ Create Event</strong>
      </Link>

      <div className="filter">
        <label><strong>Category:</strong> </label>
        <select value={category} onChange={(e) => handleFilter(e.target.value)}>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by title or location"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="event-list">
        {displayedEvents.length === 0 && <p>No matching events found.</p>}
        {displayedEvents.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            {/* <p>{event.date} - {event.location}</p> */}
            
            <p className="event-date-location">
              <span className="date">{event.date}</span> - 
              <span className="location">{event.location}</span>
            </p>


            <p><strong>Category:</strong> {event.category}</p>
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
            <Link to={`/event/${event.id}`}>Join with Others</Link>
      </div>
  ))}
      </div>

      {/* Load More Button - only show if there are more events than displayed */}
      {filtered.length > displayedEvents.length && (
        <div className="load-more-container" style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link 
            to="/allevents" 
            className="load-more-btn"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            Load More Events
          </Link>
        </div>
        )}
    </div>
  );
}