import React, { useEffect, useRef } from "react";
import {
  select,
  hierarchy,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  drag,
  zoom as d3Zoom,
} from "d3";
import { useNavigate, useLocation } from "react-router-dom";
import "./D3HierarchyChart.css";
import {
  convertToHierarchyData,
  exportToPDF,
} from "../../utils/hierarchyUtils";

const D3HierarchyChart = () => {
  const svgRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the SVG before appending new elements
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    if (treeData) {
      console.log("treeData",treeData)
      const dataForTree = convertToHierarchyData(treeData);
      const root = hierarchy(dataForTree);
      const svg = select(svgRef.current);
      const width = svg.node().getBoundingClientRect().width;
      const height = width * 0.7;

      svg.attr("viewBox", `0 0 ${width} ${height}`);
      const g = svg.append("g");

      const zoomBehavior = d3Zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
      svg.call(zoomBehavior);

      const simulation = forceSimulation(root.descendants())
        .force(
          "link",
          forceLink(root.links())
            .id((d) => d.id)
            .distance(100)
            .strength(1)
        )
        .force("charge", forceManyBody().strength(-1000))
        .force("center", forceCenter(width / 2, height / 2))
        .on("tick", ticked);

      const link = g
        .selectAll(".link")
        .data(root.links())
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#e80000")
        .attr("stroke-width", "5");

      let node = g
        .selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node");

      node.append("circle").attr("r", 10).attr("fill", "steelblue");

      node
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.children ? -6 : 6))
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .text((d) => d.data.name);

      function ticked() {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      }

      const dragBehavior = drag()
        .on("start", dragStart)
        .on("drag", dragged)
        .on("end", dragEnd);

      function dragStart(event, node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
      }

      function dragged(event, node) {
        node.fx = event.x;
        node.fy = event.y;
      }

      function dragEnd(event, node) {
        if (!event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
      }

      node.filter((d) => d.depth === 0).call(dragBehavior);
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
