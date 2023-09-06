import React, { useEffect, useRef, useState } from "react";
import { select, hierarchy, tree, linkVertical } from "d3";
import { useNavigate, useLocation } from "react-router-dom";
import {
  convertToHierarchyData,
  exportToPDF,
  findStringInData,
} from "../../utils/hierarchyUtils";
import Messages, {
  getErrorForClickObjectNodeOnEditor,
} from "../../utils/Messages";
import "./D3HierarchyChart.css";
function checkIfAttributeInExpandingObject(obj, targetName) {
  for (let propName in obj) {
    if (propName === targetName) {
      return true;
    }
  }
  return false;
}
function getObjectsNameValuePair(inputString) {
  // Find the index of the left-most colon
  const colonIndex = inputString.indexOf(":");

  // If there's no colon, return an appropriate message or do nothing
  if (colonIndex === -1) {
    //console.log("No colon found in the string.");
    return null;
  }

  // Split the string into two parts based on the left-most colon
  const name = inputString.substring(0, colonIndex).trim();
  const value = inputString.substring(colonIndex + 1).trim();

  // Log the results
  //console.log("Name:", name);
  //console.log("Value:", value);
  return { name: name, value: value };
}
const sortObjectKeys = (obj) => {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
};
const findIndexOfMatchingObject = (array, obj) => {
  const sortedObjectStr = JSON.stringify(sortObjectKeys(obj));
  for (let i = 0; i < array.length; i++) {
    if (JSON.stringify(sortObjectKeys(array[i])) === sortedObjectStr) {
      return i;
    }
  }

  return -1; // Return -1 if no match is found
};

function formatWideTexts(textElem, circleDiameter, d) {
  // If textElem is a D3 selection, get the underlying DOM node
  const actualTextElem = textElem.node ? textElem.node() : textElem;
  const bbox = actualTextElem.getBBox();
  if (bbox.width > 1.5 * circleDiameter) {
    const maxWidth = 1.5 * circleDiameter;
    const words = d.data.name.split(" ");
    let currentLine = "";
    let currentLineWidth = 0;
    let lines = [];

    words.forEach((word) => {
      const wordWidth = getWidthOfWordInSVG(word, textElem.node());
      if (currentLineWidth + wordWidth <= maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
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

    select(textElem.node()).selectAll("tspan").remove();

    lines.forEach((line, index) => {
      select(textElem.node())
        .append("tspan")
        .text(line)
        .attr("x", 0)
        .attr("dy", index === 0 ? 0 : "1.2em");
    });
  }
}

function getWidthOfWordInSVG(word, textElement) {
  // Temporarily set the text element's content to the word
  textElement.textContent = word;
  const width = textElement.getBBox().width;
  // Reset the text content
  textElement.textContent = "";
  return width;
}
function updateDataWithUserInput(dataUnderEdit, allData, svgReference) {
  let allDataObjects = null;
  try {
    //This is all the objects from the api call
    allDataObjects = JSON.parse(allData);
    //console.log("allDataObjects[0]", allDataObjects[0])
  } catch (error) {
    //Add to our messaging component
    console.log("1 Use message component", error);
  }
  //Ordered/matching circles and text
  const nodeElements = svgReference.querySelectorAll("g.node");
  const textElements = svgReference.querySelectorAll("g.node text");
  //console.log("dataUnderEdit", dataUnderEdit)
  //Process the rootItems with the main index
  const updatedWithIndexRootItems = dataUnderEdit.map((dataLine) => {
    //Find line in allData
    let rootItem = null;
    let indexFound = 0;
    try {
      //console.log("Potential failure:",dataLine)
      //These rootItem objects have the attributes containing any changes [{...},{...},{...}]
      rootItem = JSON.parse(dataLine);
      //console.log("rootItem", rootItem)

      //GetIndex of object, which matches the order of all objects
      indexFound = findIndexOfMatchingObject(allDataObjects, rootItem);
      //999 Use the new data to update the all data object
      //console.log("Found object is ",allDataObjects[indexFound]);
      rootItem.parentIndex = indexFound;
    } catch (error) {
      console.log("2* Use message component", error);
    }
    return rootItem;
  });
  //console.log("updatedWithIndexRootItems",  updatedWithIndexRootItems)

  // Log the depth of each node
  //   Node 4 depth: 2
  // id: 48
  // Node 5 depth: 2
  // title: hi there
  //Declare new object

  const newObject = { depth: 0 };
  let replacementNewDataObjects = [];
  let next = Object.create(newObject);
  //console.log("nodeElements.length", nodeElements.length)
  nodeElements.forEach((nodeElement, index) => {
    next.depth = nodeElement.getAttribute("data-depth");
    // console.log(`Node ${index} depth ${next.depth}`);
    // console.log(textElements[index].textContent);

    const nameValueContent = getObjectsNameValuePair(
      textElements[index].textContent
    );
    //Has the 'next' object already got this attribute?
    if (
      nameValueContent &&
      !checkIfAttributeInExpandingObject(next, nameValueContent.name)
    ) {
      // console.log(
      //   "Add item to growing object",
      //   "Name:" + nameValueContent.name,
      //   "Value:" + nameValueContent.value
      // );
      next[nameValueContent.name] = nameValueContent.value;
    } else {
      if (nameValueContent) {
        console.log("This attribute is for a new Object");
        replacementNewDataObjects.push(next); //Push the completed Object
        // console.log(
        //   "Created new replacementNewDataObjects contains",
        //   replacementNewDataObjects.length
        // );
        next = Object.create(newObject);
        // //console.log("****Added item at start", "Name:"+nameValueContent.name, "Value:"+nameValueContent.value)
        // next[nameValueContent.name]=nameValueContent.value;
      } else {
        //
        // console.log(
        //   "Do we need a new object? This is a Node with no data",
        //   textElements[index].textContent
        // );
      }
    }
  });
  //Push last object
  replacementNewDataObjects.push(next);
  //console.log("replacementNewDataObjects", replacementNewDataObjects.length);
  return replacementNewDataObjects;
}

const D3HierarchyChart = () => {
  const svgRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(0.7); // default aspect ratio
  const navigate = useNavigate();
  const handleAspectRatioChange = (event) => {
    setAspectRatio(parseFloat(event.target.value));
  };

  const makeTextEditable = (event, d, node) => {
    const target = select(event.currentTarget);
    const textElem = target.select("text");
    const bbox = textElem.node().getBBox();
    const currentText = textElem.text();

    let prefix = "";
    let textAfterColon = currentText;

    if (currentText.includes(":")) {
      const parts = currentText.split(":");
      prefix = parts[0];
      textAfterColon = parts[1].trim();
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

    input.addEventListener("blur", function () {
      const newValue = this.value;
      const fullValue = prefix ? `${prefix}: ${newValue}` : newValue;
      d.data.name = fullValue;
      textElem.text(fullValue).style("display", "");

      const circleDiameter = 2 * parseFloat(target.select("circle").attr("r"));

      // Call the formatWideTexts function to format wide texts
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
      //console.log("dataForTree", JSON.stringify(dataForTree));

      // Function to calculate the node size based on the level

      const svg = select(svgRef.current);
      const containerWidth = svg.node().getBoundingClientRect().width;
      const width = containerWidth;
      const height = containerWidth * aspectRatio;

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
        .attr("fill", "steelblue");

      node
        .selectAll("text")
        .data((d) => [d])
        .join((enter) => {
          let texts = enter
            .append("text")
            .attr("text-anchor", "middle")
            .text((d) => {
              const regex = /:(\s*\{.*\})$/;

              //Example: d.data.name rating: {"rate":3.8,"count":679}
              if (regex.test(d.data.name)) {
                const returnValue = d.data.name.split(":")[0].trim();
                // console.log(
                //   "d.data.name found = " + d.data.name,
                //   "returnValue = " + returnValue
                // );
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
          //console.log(getErrorForClickObjectNodeOnEditor(d.data.name));
          setMessage(getErrorForClickObjectNodeOnEditor(d.data.name));
          setIsVisible(true);
        }
      });

      svg.selectAll("circle").lower();
      svg.selectAll("text").raise();
    }
  }, [treeData, size, aspectRatio]);

  const goToMenu = () => {
    navigate("/apiform");
  };

  return (
    <>
      <label htmlFor="aspectRatio">Aspect Ratio:</label>
      <select
        id="aspectRatio"
        value={aspectRatio}
        onChange={handleAspectRatioChange}
      >
        <option value="0.5">50%</option>
        <option value="0.7">70%</option>
        <option value="1">100%</option>
        <option value="2">200% (Height is double the width)</option>
        <option value="3">300% (Height is three times the width)</option>
      </select>
      <button className="menu-button" onClick={goToMenu}>
        &lt;- Menu
      </button>
      <svg ref={svgRef} className="hierarchy-chart" />
      {hasChanges && ( // <-- Conditional rendering
        <button
          onClick={() => {
            const dataString = treeData.data;
            //console.log("dataString.length", dataString.length)
            const dataUnderEdit = [];
            //console.log("treeData.response.length",treeData.response.length)
            let value = "";
            treeData.response.forEach((responseItem) => {
              //console.log("***1 treeData responseItem", responseItem);
              value = findStringInData(responseItem, dataString);
              //console.log("***findStringInData returned", value);
              //999 debug value
              dataUnderEdit.push(value);
            });
            //Modified total data headed for the database
            const updatedData = updateDataWithUserInput(
              dataUnderEdit,
              treeData.data,
              svgRef.current
            );
            console.log("replacementNewDataObjects",updatedData)
            // Use the altered data under edit to update the data attribute of saved responses
            //console.log("updatedData",updatedData);
            setHasChanges(false); // Reset the state after saving
          }}
          className="save-button"
        >
          Save
        </button>
      )}
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
    </>
  );
};

export default D3HierarchyChart;
