import { useState } from "react";
import "./ApiInputValidation.css";
const ApiInputValidation = () => {
  const [visualizationName, setVisualizationName] = useState("");
  const [apiCallStatus, setApiCallStatus] = useState("");
  const [testButtonDisabled, setTestButtonDisabled] = useState(true);
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [visualizationNameFilled, setVisualizationNameFilled] = useState(false);
  const [urlError, setUrlError] = useState("");

  const callApi = async (url, apiKey) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "no-cors",
        headers: {
          Authorization: apiKey,
        },
      });

      if (!response.ok) {
        return { error: "API call failed" };
      }

      return { data: await response.json() };
    } catch (error) {
      console.error(error);
      return { error: "An error occurred. Please check the URL and API key." };
    }
  };

  const handleVisualizationNameChange = (e) => {
    setVisualizationName(e.target.value);
    setVisualizationNameFilled(e.target.value.trim() !== "");
  };

  const handleTestClick = async (e) => {
    e.preventDefault();
    setTestButtonDisabled(true);

    const result = await callApi(url, apiKey);

    if (result.data) {
      console.log("result.data",result.data)
      // Save the response to SQLite
      // We send a message to the main process to save the data, passing the necessary parameters
      window.api.send("save-data", {
        url,
        visualizationName,
        data: result.data,
      });
      // Listen for the 'data-saved' message from the main process
      window.api.receive("data-saved", () => {
        //setApiSuccess(true);
        setApiCallStatus("API call successful");
        //setViewDbButtonDisabled(false);
      });
    } else {
      //setApiSuccess(false);
      setApiCallStatus("API call failed");
      setUrlError(result.error); //Use setUrlError here and anywhere else
    }

    setTestButtonDisabled(false);
  };

  const handleChange = (event) => {
    switch (event.target.name) {
      case "url":
        setUrl(event.target.value);
        break;
      case "apiKey":
        setApiKey(event.target.value);
        break;
      case "visualizationName":
        setVisualizationName(event.target.value);
        break;
      default:
        break;
    }
  };

  const handleBlur = async (event) => {
    if (event.target.name === "url") {
      const url = event.target.value;
      // Simple regex to validate the URL
      const urlPattern = new RegExp(
        "^(https?:\\/\\/)" +
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
          "((\\d{1,3}\\.){3}\\d{1,3}))" +
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+*]*)*" + // Added * to the characters allowed in the path
          "(\\?[;&a-z\\d%_.~+=-]*)?" +
          "(\\#[-a-z\\d_]*)?$",
        "i"
      );
      const isUrlValid = urlPattern.test(url);
      setTestButtonDisabled(!isUrlValid);

      if (isUrlValid) {
        const urlParts = url.split("/");
        const lastSegment = urlParts[urlParts.length - 1];
        setVisualizationName(lastSegment);
        setVisualizationNameFilled(true);
        setUrlError("");
      } else {
        setUrlError("Please enter a valid URL.");
      }
    }
  };

  return (
    <form className="form" onSubmit={handleTestClick}>
      <div className="input-group">
        <label htmlFor="url">URL</label>
        <input
          className="input"
          id="url"
          name="url"
          type="text"
          onChange={handleChange}
          onBlur={handleBlur}
          value={url}
          placeholder="https://example.com/api-endpoint"
        />
        {urlError && <p className="error-message">{urlError}</p>}
      </div>
      <div className="input-group">
        <label htmlFor="apiKey">API Key</label>
        <input
          className="input"
          id="apiKey"
          name="apiKey"
          type="password"
          onChange={handleChange}
          value={apiKey}
          placeholder="Your API key here"
        />
      </div>
      <div className="input-group">
        <label htmlFor="visualizationName">Name your Visualization</label>
        <input
          className="input"
          id="visualizationName"
          name="visualizationName"
          type="text"
          onChange={handleVisualizationNameChange}
          value={visualizationName}
          placeholder="*Enter a name for your visualization"
          disabled={!visualizationNameFilled}
        />
      </div>
      <div className="button-group">
        <button
          className="button"
          onClick={handleTestClick}
          disabled={!visualizationNameFilled || testButtonDisabled}
        >
          Test
        </button>
      </div>
      <div className="status-message">
        <p>{apiCallStatus}</p>
      </div>
    </form>
  );
};

export default ApiInputValidation;
