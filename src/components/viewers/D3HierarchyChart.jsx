import React, { useEffect, useRef, useState } from "react";
import { select, hierarchy, tree, linkVertical } from "d3";
import {} from "d3";
import { useNavigate, useLocation } from "react-router-dom";
import {
  convertToHierarchyData,
  exportToPDF,
  findStringInData,
  updateDataWithUserInput,
  formatWideTexts,
  getWidthOfWordInSVG,
} from "../../utils/hierarchyUtils";
import Messages, {
  getErrorForClickObjectNodeOnEditor,
} from "../../utils/Messages";
import "./D3HierarchyChart.css";

const D3HierarchyChart = () => {
  const svgRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [zoomTo, setZoomTo] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [zoomValueRange, setoomValueRange] = useState(
    Array.from({ length: 21 }, (_, i) => i)
  );

  const navigate = useNavigate();
  const handleAspectRatioChange = (event) => {
    const newZoomTo = parseFloat(event.target.value);
    setZoomTo(newZoomTo);
  };

  const makeTextEditable = (event, d, node) => {
    const target = select(event.currentTarget);
    const textElem = target.select("text");
    const bbox = textElem.node().getBBox();
    let lines = [];
    textElem.selectAll("tspan").each(function () {
      lines.push(select(this).text());
    });
    let multilineText = lines.join(" ");
    const currentText = textElem.text();
    let prefix = "";
    let parts = currentText.split(/:(.+)/);
    let textAfterColon = parts[1].trim();

    if (currentText.includes(":")) {
      //That's the same for multiline
      prefix = parts[0];

      if (multilineText && multilineText.includes(":")) {
        parts = multilineText.split(/:(.+)/);
        textAfterColon = parts[1].trim();
      } else {
        if (multilineText) {
          textAfterColon = multilineText.trim();
        }
      }
    }

    textElem.style("display", "none");
    target.select("circle").style("display", "none");

    const input = target
      .append("foreignObject")
      .attr("width", bbox.width + 10) // add a little padding
      .attr("height", bbox.height)
      .attr("x", bbox.x)
      .attr("y", bbox.y)
      .append("xhtml:input")
      .attr("value", textAfterColon)
      .attr("style", `width: ${bbox.width + 10}px;`) // use the width of the text element
      .node();

    input.focus();
    input.select(); // To highlight the text in the input
    input.addEventListener("input", function (e) {
      setInputValue(e.target.value);
    });
    input.addEventListener("blur", function () {
      const newValue = this.value;
      const fullValue = prefix ? `${prefix}: ${newValue}` : newValue;
      d.data.name = fullValue;
      textElem.text(fullValue).style("display", "");

      const circleDiameter = 2 * parseFloat(target.select("circle").attr("r"));

      formatWideTexts(textElem, circleDiameter, d);

      setHasChanges(true);
      target.select("foreignObject").remove();
      target.select("circle").style("display", "");
    });

    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const newValue = this.value;

        // Join the prefix (if any) with the new value from the input
        const fullValue = prefix ? `${prefix}: ${newValue}` : newValue;

        d.data.name = fullValue;
        textElem.text(fullValue).style("display", "");
        setHasChanges(true);
        target.select("foreignObject").remove();
        target.select("circle").style("display", "");
      }
    });
  };

  useEffect(() => {
    if (treeData) {
      const dataForTree = convertToHierarchyData(treeData);
      const root = hierarchy(dataForTree);

      // Function to calculate the node size based on the level

      const svg = select(svgRef.current);
      const containerWidth = svg.node().getBoundingClientRect().width;
      const width = containerWidth;
      const height = containerWidth * zoomTo;
      let rectSize = width * 0.2;
      svg.attr("viewBox", `0 0 ${width} ${height}`);
      const maxDepth = root.height;
      const levelHeight = height / maxDepth;
      const treeLayout = tree().size([height, width]);
      treeLayout(root);
      let maxNodesAtLevel = 0;
      root.each((node) => {
        if (!node.depth) return;
        maxNodesAtLevel = Math.max(
          maxNodesAtLevel,
          root.descendants().filter((d) => d.depth === node.depth).length
        );
      });
      const linkGenerator = linkVertical()
        .x((d) => d.y)
        .y((d) => d.x);

      svg
        .selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", linkGenerator)
        .attr("transform", `translate(4,0)`)
        .attr("fill", "none")
        .attr("stroke", "#e80000")
        .attr("stroke-width", "5");

      const node = svg
        .selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .attr("data-depth", (d) => d.depth)
        .on("mousedown", (event, d) => {
          const container = svg.node().closest("div");

          const onMouseMove = (event) => {
            const x = event.clientX - container.getBoundingClientRect().left;
            const y = event.clientY - container.getBoundingClientRect().top;

            d.x = y;
            d.y = x;

            svg
              .selectAll(".node")
              .attr("transform", (d) => `translate(${d.y},${d.x})`);

            svg.selectAll(".link").attr("d", linkGenerator);
          };

          const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
          
        });
      node
        .append("circle")
        .attr(
          "r",
          (d) => ((maxDepth - d.depth + 1) * levelHeight) / maxNodesAtLevel
        )
        .attr("fill", "steelblue")
        .attr("stroke", "grey") // Grey border
        .attr("stroke-width", "2"); // Border width

      node
        .selectAll("text")
        .data((d) => [d])
        .join((enter) => {
          let texts = enter
            .append("text")
            .attr("text-anchor", "middle")
            .text((d) => {
              const regex = /:(\s*\{.*\})$/;

              if (regex.test(d.data.name)) {
                //const returnValue = d.data.name.split(":")[0].trim();
                const returnValue = d.data.name.split(/:(.+)/)[0].trim();
                return returnValue; // retain only the text before the colon
              } else {
                return d.data.name; // retain the entire text
              }
            });

          // Adjust the y position based on the bounding box
          texts.each(function (d, i) {
            let bbox = this.getBBox();
            const that = this;
            select(this).attr("dy", bbox.height / 2);

            /*Calculate here if the text exceeds 1.5X Width of the underlying circle*/
            const circleRadius =
              ((maxDepth - d.depth + 1) * levelHeight) / maxNodesAtLevel;
            if (bbox.width > 1.5 * 2 * circleRadius) {
              const maxWidth = 1.5 * 2 * circleRadius;
              const words = d.data.name.split(" ");
              let currentLine = "";
              let currentLineWidth = 0;
              let lines = [];
              /*Iterate over each word and construct lines that do not exceed the maxWidth*/
              words.forEach((word) => {
                const wordWidth = getWidthOfWordInSVG(word, that);
                if (currentLineWidth + wordWidth <= maxWidth) {
                  currentLine += (currentLine ? " " : "") + word; // if there's already content in the current line, add a space before the new word
                  currentLineWidth += wordWidth;
                } else {
                  lines.push(currentLine);
                  currentLine = word;
                  currentLineWidth = wordWidth;
                }
              });

              if (currentLine) {
                lines.push(currentLine);
              }

              // Now, we'll adjust the rendering logic
              select(that).selectAll("tspan").remove(); // remove any existing tspans (in case this logic runs multiple times)

              lines.forEach((line, index) => {
                select(that)
                  .append("tspan")
                  .text(line)
                  .attr("x", 0)
                  .attr("dy", index === 0 ? 0 : "1.2em"); // position the lines below each other
              });
            }
          });

          return texts;
        });

      node.on("click", (event, d) => {
        if (d.data.name.includes(":")) {
          setMessage("");
          setIsVisible(false);
          makeTextEditable(event, d, node);
        } else {
          setMessage(getErrorForClickObjectNodeOnEditor(d.data.name));
          setIsVisible(true);
        }
      });

      svg.selectAll("circle").lower();
      svg.selectAll("text").raise();


      rectSize = svg.node().getBoundingClientRect().width * 0.2;
      // Add this block to add a small blue rectangle
      svg
      .append("rect")
      .attr("y", height - (rectSize )) // Position it at the bottom
      .attr("x", 0) // Position it at the left edge
      .attr("width", rectSize) // 20% of the width of the main SVG
      .attr("height", rectSize)
      .attr("fill", "blue");

    }
  }, [treeData, size, zoomTo]);
  useEffect(() => {
    const handleUpdateResponse = (message) => {
      setMessage(`Information:${message}`);
      setIsVisible(true);
    };

    window.api.receive("update-data-response", handleUpdateResponse);

    return () => {
      window.api.remove("update-data-response", handleUpdateResponse); // If you've implemented a remove function.
    };
  }, []);

  useEffect(() => {
    // (4) Dragging functionality for the 'action navigation rectangle'
    // Dragging logic should be added here
  }, []);
  const goToMenu = () => {
    navigate("/apiform");
  };
  return (
    <div className="hierarchy-chart">
      {!treeData ? (
        <div>Loading...</div>
      ) : (
        <svg id="mainSVG" ref={svgRef} className="hierarchy-chart">
          <defs>
            <radialGradient id="ballGradient" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffcc00" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff9800" stopOpacity="1" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {hasChanges && ( // <-- Conditional rendering
        <button
          onClick={() => {
            const dataString = treeData.data;
            const dataUnderEdit = [];
            let value = "";
            treeData.response.forEach((responseItem) => {
              value = findStringInData(responseItem, dataString);
              dataUnderEdit.push(value);
            });
            //Modified total data headed for the database
            const updatedData = updateDataWithUserInput(
              dataUnderEdit,
              treeData.data,
              svgRef.current
            );

            window.api.send("update-data-request", {
              url: treeData.url,
              visualizationName: treeData.visualizationName,
              data: updatedData,
            });

            setHasChanges(false); // Reset the state after saving
          }}
          className="save-button"
        >
          Save
        </button>
      )}
      <button className="menu-button" onClick={goToMenu}>
        &lt;- Menu
      </button>
      <button
        onClick={() => {
          if (svgRef && svgRef.current) {
            exportToPDF(
              svgRef.current,
              treeData.visualizationName,
              treeData.url
            );
          }
        }}
        className="convert-button"
      >
        Convert to a PDF
      </button>

      <Messages
        message={message}
        isVisible={isVisible}
        onOutsideClick={() => setIsVisible(false)}
      />
      <div>{inputValue}</div>
      <h1 className="fontHeader">
        {treeData?.visualizationName || "Loading..."}
      </h1>
      <h3>{treeData.url}</h3>
      <label htmlFor="zoomTo">Aspect Ratio:</label>
      <select
        id="zoomTo"
        value={zoomTo}
        onChange={handleAspectRatioChange}
      >
        {zoomValueRange.map((ratio) => (
          <option key={ratio} value={ratio}>
            {ratio}X
          </option>
        ))}
      </select>
    </div>
  );
};

export default D3HierarchyChart;
