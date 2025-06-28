import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase.jsx';
import '../Styles/AllEvents.css'; // Updated CSS filename

export default function AllEvents() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, title, location
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);

  // Function to get random events and paginate them
  const getRandomEventsPaginated = (eventsList, page, perPage) => {
    if (eventsList.length === 0) return [];
    
    // Shuffle array using Fisher-Yates algorithm
    const shuffled = [...eventsList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Sort by date after shuffling
    const sortedShuffled = shuffled.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    return sortedShuffled.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filtered.length / eventsPerPage);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Sort by date initially
        const sortedEvents = eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setEvents(sortedEvents);
        setFiltered(sortedEvents);
        
        // Set initial displayed events for first page
        const initialDisplayed = getRandomEventsPaginated(sortedEvents, 1, eventsPerPage);
        setDisplayedEvents(initialDisplayed);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [eventsPerPage]);

  // Update displayed events when page changes
  useEffect(() => {
    const newDisplayed = getRandomEventsPaginated(filtered, currentPage, eventsPerPage);
    setDisplayedEvents(newDisplayed);
  }, [currentPage, filtered, eventsPerPage]);

  const handleFilter = (value) => {
    setCategory(value);
    setCurrentPage(1); // Reset to first page when filtering
    applyFilters(value, search, sortBy);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
    applyFilters(category, value, sortBy);
  };

  const handleSort = (value) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting
    applyFilters(category, search, value);
  };

  const applyFilters = (categoryValue, searchValue, sortValue) => {
    let filteredEvents = [...events];
    
    // Filter by category
    if (categoryValue !== 'All') {
      filteredEvents = filteredEvents.filter(e => e.category === categoryValue);
    }
    
    // Filter by search term
    if (searchValue.trim()) {
      const lower = searchValue.toLowerCase();
      filteredEvents = filteredEvents.filter(
        e =>
          e.title.toLowerCase().includes(lower) ||
          e.location.toLowerCase().includes(lower)
      );
    }
    
    // Sort results
    filteredEvents.sort((a, b) => {
      switch (sortValue) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });
    
    setFiltered(filteredEvents);
    // Update displayed events for current page will be handled by useEffect
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const categories = ['All', 'Music', 'Tech', 'Sports', 'Social'];

  if (loading) {
    return (
      <div className="allevents-container">
        <h2>Loading Events...</h2>
      </div>
    );
  }



  return (
    <div className="allevents-container">
      <div className="allevents-header">
        <h2>All Events ({filtered.length})</h2>
        <Link to="/" className="back-home-btn">← Back to Home</Link>
      </div>
      
      <Link to="/createevent" className="create-event-btn">
        <strong>+ Create Event</strong>
      </Link>

      <div className="filter-controls">
        <div className="filter-group">
          <label><strong>Category:</strong> </label>
          <select value={category} onChange={(e) => handleFilter(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label><strong>Sort by:</strong> </label>
          <select value={sortBy} onChange={(e) => handleSort(e.target.value)}>
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="location">Location</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <input
            type="text"
            placeholder="Search by title or location"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pagination Info */}
      {filtered.length > 0 && (
        <div className="pagination-info">
          <p>
            Showing {Math.min((currentPage - 1) * eventsPerPage + 1, filtered.length)} - {Math.min(currentPage * eventsPerPage, filtered.length)} of {filtered.length} events 
            (Page {currentPage} of {totalPages})
          </p>
        </div>
      )}

      <div className="event-list">
        {displayedEvents.length === 0 && !loading && (
          <div className="no-events">
            <p>No matching events found.</p>
            {search || category !== 'All' ? (
              <button 
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setCurrentPage(1);
                  // This will trigger the useEffect to update filtered and displayedEvents
                }}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        )}
        
        {displayedEvents.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p className="event-date-location">
              <span className="date">{event.date}</span> - 
              <span className="location">{event.location}</span>
            </p>
            <p className="event-category">
              <strong>Category:</strong> {event.category}
            </p>
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
            <Link to={`/event/${event.id}`} className="join-btn">
              Join with Others
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="pagination-btn prev-btn"
          >
            ← Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="pagination-btn next-btn"
          >
            Next →
          </button>
        </div>
      )}
    
    </div>
  );
}