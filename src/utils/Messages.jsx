import React, { useRef, useState, useEffect } from "react"; // <-- ADDED useState and useEffect

export const getErrorForClickObjectNodeOnEditor = (name) =>
  `Info: You clicked on ${name} but this has no data`;
const deriveType = (msg) => {
  const type = msg.split(":")[0].trim();

  switch (type) {
    case "Error":
    case "Warning":
    case "Success":
      return type;
    default:
      return "Info";
  }
};

const Messages = ({ message, isVisible, onOutsideClick, duration = 3 }) => {
  // <-- ADDED duration prop with default value
  const svgRef = useRef(null);
  const titleRef = useRef(null); // <-- REF for the title
  const [titleBBox, setTitleBBox] = useState(null);
  // NEW STATE for countdown
  const [countdown, setCountdown] = useState(duration);
  const mTypeColour = {
    Error: "red",
    Warning: "orange",
    Success: "blue",
    Info: "green",
  };
  const messageColor = mTypeColour[deriveType(message)];
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
  useEffect(() => {
    if (titleRef.current) {
      setTitleBBox(titleRef.current.getBBox());
    }
  }, [message]);
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
          stroke={messageColor}
          strokeWidth="5"
        />

{titleBBox && (
  <rect
    x={titleBBox.x - (titleBBox.width * 0.15) / 2}  // A bit of padding
    y={titleBBox.y - titleBBox.height * 0.5}  // Move it up by half the height
    width={titleBBox.width + titleBBox.width * 0.15} // Including the padding
    height={titleBBox.height * 1.618} // Making it 1.618 times larger
    fill="white"
    rx={titleBBox.width * 0.15}  // 15% of the rectangle's width for rounded corners
    ry={titleBBox.width * 0.15}  // Same for y-radius
  />
)}

<text
  ref={titleRef}
  x="50%"
  y="5%" 
  dominantBaseline="hanging"
  textAnchor="middle"
  fontSize="250%"
  fill={messageColor}
>
  {deriveType(message)}
</text>

{/* ...rest of the SVG content... */}
This should adjust the rectangle as specified. The text will now appear centered within this expanded rectangle due to the adjustments in the rectangle's y and height properties. The rectangle will also have the rounded corners as you mentioned.







        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="150%"
          fill={messageColor}
        >
          {message}
        </text>

        <text
          x="90%"
          y="90%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="125%" // Adjust size if needed
          fill={messageColor}
        >
          {countdown} {/* <-- Countdown Timer Display */}
        </text>
      </svg>
    </div>
  );
};

export default Messages;
