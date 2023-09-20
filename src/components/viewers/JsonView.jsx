import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactJson from "react-json-view";
import "./JsonView.css";
const JsonView = () => {
  const [dbData, setDbData] = useState([]);
  const [percent, setPercent] = useState(100);
  const navigate = useNavigate();
  const handleHierachyChart = (data, usage = "drag") => {
    let response;
    try {
      response = JSON.parse(data.data);
    } catch (error) {
      console.error("Failed to parse data as JSON: ", data.data);
      return;
    }
    const shuffleArray = (array) => {
      let currentIndex = array.length,
        randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex],
          array[currentIndex],
        ];
      }
      return array;
    };

    // Shuffle the response data and slice it based on the selected percentage
    const responseArray = [];
    if (Array.isArray(response)) {
    } else if (typeof data === "object" && data !== null) {
      responseArray.push(data);
      response = responseArray;
    } else {
      console.log("Unknown data type:", typeof data);
    }
    const reducedData = {
      ...data,
      response: shuffleArray([...response]).slice(
        0,
        Math.ceil(response.length * (percent / 100))
      ),
    };

    // Calculate the size of the nodes based on the number of nodes and the available height
    const sizeOfNode = 500 / reducedData.response.length; // Assuming the available height is 500

    if (usage === "drag") {
      navigate(`/hierachychart`, {
        state: { treeData: reducedData, size: sizeOfNode },
      });
    } else {
      navigate(`/hierachychartforce`, {
        state: { treeData: reducedData, size: sizeOfNode },
      });
    }
  };

  const handlePercentChange = (event) => {
    setPercent(event.target.value);
  };

  useEffect(() => {
    const listener = (data) => {
      if (data.error) {
        console.error(data.error);
      } else {
        setDbData(data);
      }
    };

    window.api.receive("data-received", listener);

    fetchData();

    return () => {
      window.api.remove("data-received", listener);
    };
  }, []);

  const fetchData = async () => {
    window.api.send("get-data"); // Request to get data
  };

  return (
    <div className="container">
      <h1>Select API Call</h1>
      {dbData.map((data, index) => (
        <div key={index} className="card">
          <div className="card-content">
            <h2>{data.visualizationName}</h2>
            <p>{data.url}</p>
            <ReactJson src={data} theme="monokai" collapsed={true} />
          </div>
          <div className="controls">
            <select onChange={handlePercentChange}>
              <option value={100}>100%</option>
              <option value={50}>50%</option>
              <option value={20}>20%</option>
              <option value={5}>5%</option>
              <option value={2}>2%</option>
              <option value={1}>1%</option>
            </select>
            <button onClick={() => handleHierachyChart(data)}>Drag</button>
            <button onClick={() => handleHierachyChart(data, "force")}>
              Force
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JsonView;
