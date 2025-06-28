import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase.jsx';
import { useNavigate, Link } from 'react-router-dom'; // Added Link import
import { useAuth } from '../Context/AuthContext'; // Add this import
import '../Styles/Login.css'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get current user from context

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Set loading to true
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful');
      navigate('/'); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Reset loading state
    }
  };


  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} // Disable during loading
        />

        <label>Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} // Disable during loading
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

       {/* Add navigation links */}
      <div className="login-links">
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p>
          <Link to="/">← Back to Events</Link>
        </p>
      </div>
      
    </div>
  )
}

// export default Login
