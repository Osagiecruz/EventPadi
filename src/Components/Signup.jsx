import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../Firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { db } from '../Firebase.jsx';
import { doc, setDoc } from 'firebase/firestore';
import '../Styles/Signup.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Basic info, 2: Email verification
    const [verificationSent, setVerificationSent] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [tempUser, setTempUser] = useState(null);
    const navigate = useNavigate();

    // Predefined list of interests for users to choose from
    const availableInterests = [
        'Technology', 'Music', 'Sports', 'Reading', 'Cooking', 'Travel',
        'Photography', 'Gaming', 'Art', 'Fitness', 'Movies', 'Dancing',
        'Writing', 'Nature', 'Fashion', 'Science', 'History', 'Languages',
        'Volunteering', 'Business', 'Health', 'Education', 'Politics',
        'Environment', 'Cars', 'Pets', 'Gardening', 'Crafts', 'Religion',
        'Philosophy'
    ];

    // Function to get random interests for suggestion
    const getRandomInterests = (count = 10) => {
        const shuffled = [...availableInterests].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const [suggestedInterests] = useState(getRandomInterests());

    const handleInterestToggle = (interest) => {
        setSelectedInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            } else {
                return [...prev, interest];
            }
        });
    };

    const handleInitialSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!username.trim()) {
            setError('Username is required');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (selectedInterests.length < 3) {
            setError('Please select at least 3 interests');
            return;
        }

        try {
            // Create user account
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            setTempUser(userCred.user);

            // Send email verification
            await sendEmailVerification(userCred.user);
            setVerificationSent(true);
            setStep(2);

            // Note: We don't save to Firestore yet - we'll do that after email verification
        } catch (err) {
            setError(err.message);
            console.error("Signup error:", err);
        }
    };

    const checkEmailVerification = async () => {
        if (!tempUser) return;

        setIsVerifying(true);
        setError('');

        try {
            // Reload user to get latest verification status
            await tempUser.reload();
            
            if (tempUser.emailVerified) {
                // Email is verified, now save user data to Firestore
                await setDoc(doc(db, 'users', tempUser.uid), {
                    email: tempUser.email,
                    username: username.trim(),
                    bio: '',
                    interests: selectedInterests,
                    lastUsernameChange: new Date().toISOString(), // Set initial username change date
                    lastUpdated: new Date().toISOString(),
                    uid: tempUser.uid,
                    isOnline: true,
                    lastSeen: new Date().toISOString()
                });

                alert('Account created and verified successfully!');
                navigate('/');
            } else {
                setError('Email not verified yet. Please check your email and click the verification link.');
            }
        } catch (err) {
            setError('Error checking verification status: ' + err.message);
            console.error("Verification check error:", err);
        }

        setIsVerifying(false);
    };

    const resendVerification = async () => {
        if (!tempUser) return;

        try {
            await sendEmailVerification(tempUser);
            alert('Verification email sent again!');
        } catch (err) {
            setError('Error resending verification email: ' + err.message);
        }
    };

    if (step === 1) {
        return (
            <div className="signup-container">
                <h2>Create Account</h2>
                <form onSubmit={handleInitialSignup} className="signup-form">
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />

                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        minLength="6"
                    />

                    <label>Username:</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                        minLength="3"
                        placeholder="Enter your username (min 3 characters)"
                    />

                    <div className="interests-section">
                        <label>Select Your Interests (minimum 3):</label>
                        <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 15px 0' }}>
                            Choose at least 3 interests that describe you:
                        </p>
                        
                        <div className="interests-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '10px',
                            marginBottom: '15px'
                        }}>
                            {suggestedInterests.map((interest) => (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => handleInterestToggle(interest)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '2px solid #ddd',
                                        borderRadius: '20px',
                                        backgroundColor: selectedInterests.includes(interest) ? '#2196F3' : 'white',
                                        color: selectedInterests.includes(interest) ? 'white' : '#333',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        borderColor: selectedInterests.includes(interest) ? '#2196F3' : '#ddd'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!selectedInterests.includes(interest)) {
                                            e.target.style.borderColor = '#2196F3';
                                            e.target.style.color = '#2196F3';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!selectedInterests.includes(interest)) {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.color = '#333';
                                        }
                                    }}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>

                        <p style={{ fontSize: '12px', color: '#666' }}>
                            Selected: {selectedInterests.length} / {suggestedInterests.length}
                            {selectedInterests.length >= 3 && (
                                <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✓ Minimum reached</span>
                            )}
                        </p>

                        {selectedInterests.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <p style={{ fontSize: '12px', color: '#333', marginBottom: '5px' }}>
                                    Your selected interests:
                                </p>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {selectedInterests.join(', ')}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button 
                        type="submit"
                        style={{
                            backgroundColor: selectedInterests.length >= 3 ? '#4CAF50' : '#ccc',
                            cursor: selectedInterests.length >= 3 ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Create Account
                    </button>
                </form>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="signup-container">
                <h2>Verify Your Email</h2>
                <div className="verification-section" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #2196F3',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>📧 Check Your Email</h3>
                        <p style={{ margin: '10px 0', color: '#333' }}>
                            We've sent a verification link to:
                        </p>
                        <p style={{ fontWeight: 'bold', color: '#1976d2', margin: '10px 0' }}>
                            {email}
                        </p>
                        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
                            Click the verification link in your email, then click the button below to complete your registration.
                        </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <button 
                            onClick={checkEmailVerification}
                            disabled={isVerifying}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isVerifying ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginRight: '10px',
                                opacity: isVerifying ? 0.6 : 1
                            }}
                        >
                            {isVerifying ? 'Checking...' : 'I\'ve Verified My Email'}
                        </button>

                        <button 
                            onClick={resendVerification}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Resend Email
                        </button>
                    </div>

                    <div style={{
                        backgroundColor: '#fff3e0',
                        border: '1px solid #ff9800',
                        borderRadius: '6px',
                        padding: '15px',
                        fontSize: '14px',
                        color: '#ef6c00'
                    }}>
                        <strong>Note:</strong> If you don't see the email, check your spam folder. 
                        The verification link will expire in 24 hours.
                    </div>

                    {error && (
                        <p style={{ 
                            color: 'red', 
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#ffebee',
                            border: '1px solid #f44336',
                            borderRadius: '4px'
                        }}>
                            {error}
                        </p>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <button 
                            onClick={() => {
                                setStep(1);
                                setTempUser(null);
                                setVerificationSent(false);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default Signup;