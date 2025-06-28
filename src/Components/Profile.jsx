import React, { useEffect, useState } from 'react';
import { auth } from '../Firebase.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../Firebase.jsx';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import '../Styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        // console.log('Current user:', currentUser.uid);
        try {
          // const docRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(docRef);
          // console.log('Document exists:', snap.exists());
          
          if (snap.exists()) {
            const data = snap.data();
            // console.log('Profile data:', data);
            setProfileData(data);
            setBio(data.bio || '');
            setInterests(data.interests ? data.interests.join(', ') : '');
            setIsEditing(false); // Profile exists, so not in editing mode initially
          } else {
            console.log('No document found for user:', currentUser.uid);
            // Create a basic profile document if it doesn't exist
            setProfileData({});
            setBio('');
            setInterests('');
            setIsEditing(true); // No profile exists, so start in editing mode
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      } else {
        setUser(null);
        setProfileData(null);
        setBio('');
        setInterests('');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) {
      alert('No user logged in');
      return;
    }
    
    // console.log('Saving profile...');
    // console.log('Current user:', user);
    // console.log('User UID:', user.uid);
    // console.log('Bio:', bio);
    // console.log('Interests:', interests);
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const profileData = {
        email: user.email,
        bio: bio || '',
        interests: interests ? interests.split(',').map(item => item.trim()).filter(item => item !== '') : [],
        lastUpdated: new Date().toISOString(),
        uid: user.uid,
      };
      
      console.log('Profile data to save:', profileData);
      console.log('Document reference:', docRef);
      
      // Try setDoc first (it works for both creating and updating)
      await setDoc(docRef, profileData, { merge: true });
      console.log('Profile saved successfully with setDoc');
      
      setProfileData(profileData);
      setIsEditing(false); // Exit editing mode after successful save
      alert('Profile saved successfully!');
      
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules.');
      } else if (error.code === 'unauthenticated') {
        alert('User not authenticated. Please log in again.');
      } else {
        alert(`Error saving profile: ${error.message}`);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to original values
    setBio(profileData?.bio || '');
    setInterests(profileData?.interests ? profileData.interests.join(', ') : '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Please log in to view your profile</h2>
      </div>
    );
  }
  
  return (
    <div className="profile-parent">
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-info">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.uid}</p>
        <p><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</p>
        
        <div>
          <label>Bio:</label>
          <textarea 
            value={bio} 
            onChange={e => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            style={{width: '100%', margin: '5px 0'}}
            disabled={!isEditing}
            className={!isEditing ? 'readonly-textarea' : ''}
          />
        </div>
        
        <div>
          <label>Interests (comma-separated):</label>
          <textarea 
            value={interests} 
            onChange={e => setInterests(e.target.value)}
            placeholder="e.g., Music, Technology, Sports"
            rows={2}
            style={{width: '100%', margin: '5px 0'}}
            disabled={!isEditing}
            className={!isEditing ? 'readonly-textarea' : ''}
          />
        </div>
        
        <div style={{marginTop: '15px'}}>
          {isEditing ? (
            <div>
              <button 
                onClick={handleSave} 
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Profile
              </button>
              {profileData && Object.keys(profileData).length > 0 && (
                <button 
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={handleEdit}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
        
        {profileData === null && (
          <p style={{color: 'orange', marginTop: '10px'}}>
            No profile data found. Fill out the form above to create your profile.
          </p>
        )}
      </div>
    </div>
    </div>
  );
};

export default Profile;


//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async currentUser => {
//       if (currentUser) {
//         setUser(currentUser);
//         console.log('Current user:', currentUser.email); // Debug log
//         try {
//           const docRef = doc(db, 'users', currentUser.email);
//           const snap = await getDoc(docRef);
//           console.log('Document exists:', snap.exists()); // Debug log
          
//           if (snap.exists()) {
//             const data = snap.data();
//             console.log('Profile data:', data); // Debug log
//             setProfileData(data);
//             setBio(data.bio || '');
//             setInterests(data.interests ? data.interests.join(', ') : '');
//           } else {
//             console.log('No document found for user:', currentUser.email);
//             // Create a basic profile document if it doesn't exist
//             setProfileData({});
//             setBio('');
//             setInterests('');
//           }
//         } catch (error) {
//           console.error('Error fetching profile data:', error);
//         }
//       } else {
//         setUser(null);
//         setProfileData(null);
//         setBio('');
//         setInterests('');
//       }
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, []);


//     const handleSave = async () => {
//     if (!user) {
//       alert('No user logged in');
//       return;
//     }
    
//     console.log('Saving profile...'); // Debug log
    
//     try {
//       const docRef = doc(db, 'users', user.email);
//       const profileData = {
//         email: user.email,
//         bio: bio,
//         interests: interests.split(',').map(item => item.trim()).filter(item => item !== ''),
//         lastUpdated: new Date().toISOString()
//       };
      
//       console.log('Profile data to save:', profileData); // Debug log
      
//       // Try to update first, if it fails, create the document
//       try {
//         await updateDoc(docRef, profileData);
//         console.log('Profile updated successfully');
//       } catch (updateError) {
//         console.log('Update failed, creating new document:', updateError);
//         // Document doesn't exist, create it
//         profileData.createdAt = new Date().toISOString();
//         await setDoc(docRef, profileData);
//         console.log('Profile created successfully');
//       }
      
//       setProfileData(profileData);
//       alert('Profile saved successfully!');
      
//     } catch (error) {
//       console.error('Error saving profile:', error);
//       alert('Error saving profile. Check console for details.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="profile-container">
//         <h2>Loading profile...</h2>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="profile-container">
//         <h2>Please log in to view your profile</h2>
//       </div>
//     );
//   }

  
//   return (
//     <div className="profile-container">
//       <h2>My Profile</h2>
//       <div className="profile-info">
//         <p><strong>Email:</strong> {user.email}</p>
//         <p><strong>User ID:</strong> {user.uid}</p>
//         <p><strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}</p>
        
//         <div>
//           <label>Bio:</label>
//           <textarea 
//             value={bio} 
//             onChange={e => setBio(e.target.value)}
//             placeholder="Tell us about yourself..."
//             rows={4}
//             style={{width: '100%', margin: '5px 0'}}
//           />
//         </div>
        
//         <div>
//           <label>Interests (comma-separated):</label>
//           <textarea 
//             value={interests} 
//             onChange={e => setInterests(e.target.value)}
//             placeholder="e.g., Music, Technology, Sports"
//             rows={2}
//             style={{width: '100%', margin: '5px 0'}}
//           />
//         </div>
        
//         <button onClick={handleSave} style={{marginTop: '10px'}}>
//           Save Profile
//         </button>
        
//         {profileData === null && (
//           <p style={{color: 'orange', marginTop: '10px'}}>
//             No profile data found. Fill out the form above to create your profile.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Profile;
