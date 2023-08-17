import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes,  useLocation } from "react-router-dom";
import NavBar from './components/navigation/NavBar';
import ApiInputValidation from './components/admin/ApiInpuValidation'
import Login from './Login';
import UserContext from './UserContext.js';
import DbView from './components/db/DbView.jsx'
import JsonView from './components/viewers/JsonView';
import D3HierachyChart from './components/viewers/D3HierarchyChart';
import D3HierachyChartForce from './components/viewers/D3HierarchyChartForce';

const CustomNavBar = () => {
  const location = useLocation();

  // Conditionally render NavBar based on the current route
  if (location.pathname === '/hierachychart') {
    return null; // Return null to hide NavBar
  }

  return <NavBar />;
};

const Root = () => {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <UserContext.Provider value={{ user, setUser }}>
        <CustomNavBar /> {/* Render the custom NavBar */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={user ? <ApiInputValidation /> : <Login />} />
          <Route path="/apiform" element={<ApiInputValidation />} />
          <Route path="/dbview" element={<DbView />} /> 
          <Route path="/jsonview" element={<JsonView />} /> 
          <Route path="/hierachychart" element={<D3HierachyChart/>} />
          <Route path="/hierachychartforce" element={<D3HierachyChartForce/>} />
        </Routes>
      </UserContext.Provider>
    </Router>
  );
};

export default Root;
