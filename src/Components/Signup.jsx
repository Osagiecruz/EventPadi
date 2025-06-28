import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase.jsx'; // Ensure you have Firebase initialized
import { useNavigate } from 'react-router-dom';
import { db } from '../Firebase.jsx';
import { doc, setDoc } from 'firebase/firestore';
import '../Styles/Signup.css'; // Import your CSS styles for Signup

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();


    const handleSignup = async (e) => {
    e.preventDefault(); // ✅ Prevent default first
    setError('');
    try {
      // ✅ Create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
    //   console.log("User created:", userCred.user);

      // ✅ Save user info in Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        bio: '',
        interests: [],
      });

       alert('Account created successfully');
       navigate('/'); // give Firebase time to update auth state

    } catch (err) {
      setError(err.message);
       console.error("Signup error:", err); // Log for debugging
    }
  };

//     const handleSignup = async (e) => {
//        await createUserWithEmailAndPassword(auth, email, password);
//        await setDoc(doc(db, 'users', email), {
//         email,
//         bio: '',
//         interests: []
//        }),

//     e.preventDefault();
//     setError('');
//     try {
//         // Use Firebase Auth to create a new user
//         await createUserWithEmailAndPassword(auth, email, password);
//         alert('Account created successfully');
//         navigate('/');
//     } catch (err) {
//         setError(err.message);
//     }
// };


  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSignup} className="signup-form">
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label>Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Sign Up</button>
      </form>
    </div>
  )
}

export default Signup
