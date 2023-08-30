import React, { useEffect, useRef, useState } from "react";
import { select, hierarchy, tree, linkVertical } from "d3";
import { useNavigate, useLocation } from "react-router-dom";
import {
  convertToHierarchyData,
  exportToPDF,
} from "../../utils/hierarchyUtils";
import Messages, { getErrorForClickObjectNodeOnEditor } from "../../utils/Messages";
import "./D3HierarchyChart.css";

//For SVG Editor ?
const logSVG = (svgRef) => {
  const svgContent = svgRef.current.outerHTML;
  console.log(svgContent);
};
function hasSemicolon(d) {
  const containsSemicolon = d.data.name.includes(";");
  if (containsSemicolon) {
    console.log(`Clicked node text contains ';': ${d.data.name}`);
  } else {
    console.log(`Clicked node text does not contain ';': ${d.data.name}`);
  }
  return containsSemicolon;
}
function countAttributes(objString) {
  objString += "";
  const doubleQuoteCount = (objString.match(/":/g) || []).length;
  const singleQuoteCount = (objString.match(/':/g) || []).length;

  return doubleQuoteCount + singleQuoteCount;
}
function updateDataWithUserInput(dataUnderEdit, svgReference) {
  const nodeElements = svgReference.querySelectorAll("g.node");
  const textElements = svgReference.querySelectorAll("g.node text");
  //console.log("dataUnderEdit", dataUnderEdit);

  dataUnderEdit.map((dataLine) => {
    //console.log("countAttributes in dataUnderEdit line",countAttributes(dataLine));
    return dataLine;
  });

  /**
[
    "{\"userId\":8,\"id\":148,\"title\":\"esse quas et quo quasi exercitationem\",\"completed\":false}",
    "{\"userId\":1,\"id\":8,\"title\":\"quo adipisci enim quam ut ab\",\"completed\":true}"
]
*/
  // Log the depth of each node
  nodeElements.forEach((nodeElement, index) => {
    const depth = nodeElement.getAttribute("data-depth");
    //999console.log(`Node ${index} depth: ${depth}`);
    //999console.log(textElements[index].textContent)
  });
  /*
Node 1 depth: 0
Node 2 depth: 1
Node 3 depth: 1
Node 4 depth: 2
Node 5 depth: 2
Node 6 depth: 2
Node 7 depth: 2
Node 8 depth: 2
Node 9 depth: 2
Node 10 depth: 2
Node 11 depth: 2
*/

  // Log the values of the text elements
  // textElements.forEach((textElement, index) => {
  //   console.log(`Text ${index + 1} content: ${textElement.textContent}`);
  // });

  /*
Text 1 content: Root
Text 2 content: Object 1
Text 3 content: Object 2
Text 4 content: userId: 8
Text 5 content: id: 148
Text 6 content: title: esse quas et quo quasi exercitationem
Text 7 content: completed: false
Text 8 content: userId: 1
Text 9 content: id: 8
Text 10 content: title: Latin?
Text 11 content: completed: true
   */

  return dataUnderEdit;
}

const extractObjectsFromDataString = (dataString) => {
  const regex = /{[^}]+}/g;
  return dataString.match(regex) || [];
};

function getSearchCriteria(responseItem) {
  let values = [];

  for (let key in responseItem) {
    let value;

    if (typeof responseItem[key] === "string") {
      value = responseItem[key];
    } else if (typeof responseItem[key] === "number") {
      value = responseItem[key].toString();
    }

    if (value) {
      // Split the value into words using non-alphanumeric characters as separators
      let words = value.split(/[^a-zA-Z0-9]+/);

      // Filter out empty strings that might result from the split
      words = words.filter((word) => word);

      values = values.concat(words);
    }
  }

  // Sort by length in descending order
  values.sort((a, b) => b.length - a.length);

  return values;
}

function searchObjectsByCriteria(criteria, stringObjects) {
  //THIS ONE IS FAILING FOR COUNTRIES 999-Data Integrity
  //console.log("searchObjectsByCriteria 999 criteria",criteria)
  //console.log("searchObjectsByCriteria 999 stringObjects",stringObjects)

  let potentialMatches = [...stringObjects];

  for (let i = 0; i < criteria.length; i++) {
    let currentCriterion = criteria[i];
    potentialMatches = potentialMatches.filter((so) =>
      so.includes(currentCriterion)
    );

    if (potentialMatches.length === 1) {
      return stringObjects.indexOf(potentialMatches[0]); // returns the index of the matching object
    } else if (potentialMatches.length === 0) {
      return -1; // returns -1
    }
  }

  // In case we've exhausted all criteria but multiple potential matches remain
  return potentialMatches.map((so) => stringObjects.indexOf(so));
}
const findStringInData = (responseItem, dataString) => {
  //999-1
  const criteria = getSearchCriteria(responseItem);
  //console.log("findStringInData-criteria", criteria)
  const extractObjects = extractObjectsFromDataString(dataString);
  //console.log("findStringInData-extractObjects.LENGTH", extractObjects.length)
  const indexOfData = searchObjectsByCriteria(criteria, extractObjects);
  //console.log(extractObjects[indexOfData])
  if (indexOfData) {
    return extractObjects[indexOfData];
  } else {
    return null;
  }
};
const D3HierarchyChart = () => {
  const svgRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
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

      // Join the prefix (if any) with the new value from the input
      const fullValue = prefix ? `${prefix}: ${newValue}` : newValue;

      d.data.name = fullValue;
      textElem.text(fullValue).style("display", "");
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

      const aspectRatio = 0.7; // Adjust this value to achieve the desired aspect ratio
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
                console.log(
                  "d.data.name found = " + d.data.name,
                  "returnValue = " + returnValue
                );
                return returnValue; // retain only the text before the colon
              } else {
                return d.data.name; // retain the entire text
              }
            });

          // Adjust the y position based on the bounding box
          texts.each(function (d, i) {
            let bbox = this.getBBox();
            select(this).attr("dy", bbox.height / 2);
          });

          return texts;
        });

      node.on("click", (event, d) => {
        if (d.data.name.includes(":")) {
          setMessage("");
          setIsVisible(false)
          makeTextEditable(event, d, node);
        } else {
          //console.log(getErrorForClickObjectNodeOnEditor(d.data.name));
          setMessage(getErrorForClickObjectNodeOnEditor(d.data.name));
          setIsVisible(true);
        }

        //999
      });

      svg.selectAll("circle").lower();
      svg.selectAll("text").raise();
    }
  }, [treeData, size]);

  const goToMenu = () => {
    navigate("/apiform");
  };

  return (
    <>
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
              //console.log("treeData responseItem", responseItem);
              value = findStringInData(responseItem, dataString);
              dataUnderEdit.push(value);
            });

            const updatedData = updateDataWithUserInput(
              dataUnderEdit,
              svgRef.current
            );

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
      
      <Messages message={message} isVisible={isVisible} onOutsideClick={() => setIsVisible(false)}/>
    </>
  );
};

export default D3HierarchyChart;
