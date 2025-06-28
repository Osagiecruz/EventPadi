import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';
import Event from './Components/Event';
import Header from './Components/Header';
import Signup from './Components/Signup'; 
import Login from './Components/Login';
import Profile from './Components/Profile';
import PrivateRoute from './Components/PrivateRoute';
import CreateEvent from './Components/CreateEvent';
import AllEvents from "./Components/AllEvents"; 


import './Styles/index.css'
import './Styles/Header.css';
import './Styles/Signup.css';
import './Styles/Login.css';
import './Styles/Profile.css';
import './Styles/Event.css';
import './Styles/CreateEvent.css';
import './Styles/AllEvents.css';

// export default function App() {

// const App = () => {

  function App() {

  
  return (
    <Router>
       <Header />
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/allevents" element={
        <PrivateRoute>
          <AllEvents />
        </PrivateRoute>
      } />
     <Route path="/profile" element={
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
      } />
     <Route path="/event/:id" element={
      <PrivateRoute>
      <Event />
      </PrivateRoute>
      } />
      <Route path="/createevent" element={
      <PrivateRoute>
      <CreateEvent />
      </PrivateRoute>
      } />
     </Routes>
    </Router>
  );
};

export default App
