import React, { useEffect, useRef } from "react";
import { select, hierarchy, tree, linkVertical } from "d3";
import { useNavigate, useLocation } from "react-router-dom";
import {
  convertToHierarchyData,
  exportToPDF,
} from "../../utils/hierarchyUtils";
import "./D3HierarchyChart.css";

//For SVG Editor ?
const logSVG = (svgRef) => {
  const svgContent = svgRef.current.outerHTML;
  console.log(svgContent);
};

const D3HierarchyChart = () => {
  const svgRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};
  const navigate = useNavigate(); // Get the navigate function from react-router-dom

  useEffect(() => {
    if (treeData) {
      const dataForTree = convertToHierarchyData(treeData);
      const root = hierarchy(dataForTree);

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
        .attr("transform", (d) => `translate(${d.y},${d.x})`) // Position the node group
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
        ) // Changed magic number to maxNodesAtLevel
        .attr("fill", "steelblue");

      node
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.children ? -6 : 6)) // Position the text label based on node type
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .text((d) => d.data.name); // Set the text content of the label

      node.on("click", (event, d) => {
        // Handle click event on nodes
        console.log("Clicked node:", d.data.name);
      });
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
      <button
        onClick={() => {
          if (svgRef && svgRef.current) {
            exportToPDF(svgRef.current, treeData.visualizationName, treeData.url);
          }
        }}
        className="convert-button"
      >
        Convert to a PDF
      </button>
    </>
  );
};

export default D3HierarchyChart;
