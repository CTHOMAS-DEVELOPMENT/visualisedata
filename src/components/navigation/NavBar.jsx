import { Link } from 'react-router-dom';
import { useContext } from 'react';
import UserContext from '../../UserContext.js';
import './NavBar.css';

const NavBar = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="navbar">
      <ul>
        <li><Link to="/">My App</Link></li>
        {user && <li><Link to="/dbview">View DB*</Link></li>}
        {user && <li><Link to="/jsonview">View JSON Structure</Link></li>} {/* Add a navigation link for JsonView */}
      </ul>
      <ul>
        {user ? (
          <>
            <li><Link to="/profile">{user.name}</Link></li>
            <li><Link to="/logout">Logout</Link></li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
      </ul>
    </div>
  );
};

export default NavBar;
