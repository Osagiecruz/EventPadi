import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../Firebase.jsx'; // Ensure you have Firebase initialized
import { onAuthStateChanged, signOut } from 'firebase/auth';
import '../Styles/Header.css';


// export default function Header() {

function Header () {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };


  return (
    <header className="header">
      <h1 className="header-title">EventPadi</h1>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} style={{marginLeft: '10px', cursor: 'pointer', background: 'black', color: '#1e90ff', border: 'none'}}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/signup">Signup</Link>
            <Link to="/login">Login</Link>
          </>
        )}  
        {/* <Link to="/profile">Profile</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/login">Login</Link> */}
      </nav>
    </header>
  );
}

export default Header;