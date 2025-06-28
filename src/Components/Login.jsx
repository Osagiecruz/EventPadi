import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase.jsx'; // Ensure you have Firebase initialized
import { useNavigate } from 'react-router-dom';
import '../Styles/Login.css'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Use Firebase Auth to sign in
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful');
      navigate('/'); 
    } catch (err) {
      setError(err.message);
    }

    // console.log('Logging in with:', { email, password});
    //TODO: intergrate with Firebase/Auth API later
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label>Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Login</button>


      </form>
      
    </div>
  )
}

// export default Login
