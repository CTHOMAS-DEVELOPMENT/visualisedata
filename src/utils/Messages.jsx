import React, { useRef, useState, useEffect } from "react"; // <-- ADDED useState and useEffect

export const getErrorForClickObjectNodeOnEditor = (name) =>
  `Error: You clicked on ${name} but this has no data`;
  const deriveType = (msg) => {
    const type = msg.split(':')[0].trim();
  
    switch (type) {
      case "Error":
      case "Warning":
      case "Info":
        return type;
      default:
        return "Information";
    }
  };
const Messages = ({ message, isVisible, onOutsideClick, duration = 3 }) => {
  // <-- ADDED duration prop with default value
  const svgRef = useRef(null);

  // NEW STATE for countdown
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    if (countdown <= 0) {
      onOutsideClick(); // makes the message disappear
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer); // cleanup the timeout if the component is unmounted
  }, [countdown, onOutsideClick]);
  useEffect(() => {
    setCountdown(duration);
  }, [isVisible, duration]);
  const handleOutsideClick = (event) => {
    if (svgRef.current && !svgRef.current.contains(event.target)) {
      onOutsideClick();
    }
  };

  if (!isVisible) return null;

  const containerHeight = window.innerHeight;
  const containerWidth = window.innerWidth;

  const svgWidth = containerWidth * 0.6;
  const svgHeight =
    containerWidth > containerHeight ? svgWidth * 0.618 : svgWidth * 1.618;

  const topPosition = containerHeight / 2 - svgHeight / 2 + "px";
  const leftPosition = containerWidth / 2 - svgWidth / 2 + "px";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={handleOutsideClick}
    >
      <svg width={svgWidth} height={svgHeight} ref={svgRef}>
        <rect
          width="100%"
          height="100%"
          fill="white"
          stroke="black"
          strokeWidth="5"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="150%"
        >
          {message}
        </text>
        <text
          x="90%"
          y="90%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="125%" // Adjust size if needed
        >
          {countdown} {/* <-- Countdown Timer Display */}
        </text>
      </svg>
    </div>
  );
};

export default Messages;
