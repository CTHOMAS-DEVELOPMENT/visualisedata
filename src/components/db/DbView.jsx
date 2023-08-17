import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DbView = () => {
  const navigate = useNavigate();
  const [dbData, setDbData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDeletedId, setLastDeletedId] = useState(null);
  useEffect(() => {
    // This function sets up a listener for the data and fetches the initial data
    const listener = (data) => {
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
      } else {
        setDbData(data);
        setIsLoading(false);
      }
    };

    window.api.receive("data-received", listener);
    fetchData(); // Fetch initial data

    return () => {
      window.api.remove("data-received", listener);
    };
  }, []);
  useEffect(() => {
    if (lastDeletedId !== null) {
      fetchData();
    }
  }, [lastDeletedId]);
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      window.api.send("get-data"); // Request to get data
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };
  const deleteRecord = async (id) => {
    if (
      window.confirm(
        `Are you sure you want to delete the record with ID ${id}? This action cannot be undone?`
      )
    ) {
      window.api.send("delete-record", id);

      setLastDeletedId(id);

    }
  };

  return (
    <div>
      <h1>DB Data</h1>
      <button type="button" onClick={() => navigate("/")}>
        Back to Admin
      </button>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : dbData.length > 0 ? (
        dbData.map((data, index) => (
          <div key={index}>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <button type="button" onClick={() => deleteRecord(data.id)}>
              Delete This Record
            </button>
          </div>
        ))
      ) : (
        <p>No data in the database.</p>
      )}
      <button type="button" onClick={() => navigate("/")}>
        Back to Admin
      </button>
    </div>
  );
};

export default DbView;
