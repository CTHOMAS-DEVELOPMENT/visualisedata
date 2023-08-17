import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from './UserContext.js';
const Login = () => {
    const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('X');
  const [password, setPassword] = useState('Y');

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Add authentication logic here
  
    // If authentication successful, redirect to the home page
    setUser(username);
    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}

export default Login;
