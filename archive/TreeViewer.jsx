import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useLocation } from "react-router-dom";
const TreeViewer = () => {
  const divRef = useRef();
  const location = useLocation();
  const { treeData, size } = location.state || {};

  function absolutePosition(element, svg) {
    const { x, y } = element.getBoundingClientRect();
    const { x: svgX, y: svgY } = svg.getBoundingClientRect();
    return { x: x - svgX, y: y - svgY };
  }
  useEffect(() => {
    console.log("useEffect", JSON.stringify(treeData))
    const divWidth = divRef.current.clientWidth; // get the current width of the div

    // Clear the previous SVG element if it exists
    d3.select(divRef.current).select("svg").remove();

    let i = 0;
    const margin = { top: 20, right: 120, bottom: 20, left: 20 },
      width = divWidth - margin.left - margin.right, // update the width to the div's width
      height = 500 - margin.top - margin.bottom;

    let svg = d3
      .select(divRef.current)
      .append("svg")
      .attr("width", "100%") // set the svg width to be 100% of its parent div
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Constructs a root node from the hierarchical data.
    const root = d3.hierarchy(treeData, function (d) {
      return d.response ? d.response : null;
    });

    d3.tree().size([height, width])(root);

    // Create the nodes
    const nodes = svg
      .selectAll("g.node")
      .data(root.descendants(), function (d) {
        return d.id || (d.id = ++i);
      })
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      })
      .each(function (d) {
        d.dragged = (x, y) =>
          d3.select(this).attr("transform", `translate(${x}, ${y})`);
      });
    let dx, dy; // New variables to hold the offsets

    // Define the drag behavior
    const drag = d3
      .drag()
      .on("start", dragStart)
      .on("drag", dragMove)
      .on("end", dragEnd);

      function dragStart(event, d) {
        if (d.depth === 0) return; // If it's the root node, return without doing anything
      
        d3.select(this).raise().attr("stroke", "black");
      
        const nodeRadius = size / 2; // Assuming the node's radius is size / 2
        dx = d.y - event.x;
        dy = d.x - event.y;
      
        // check if this is the first drag
        if (!d.data.dragged) {
          const element = this;
          const svgContainer = d3.select("svg").node(); // get the svg node
          const absolutePos = absolutePosition(element, svgContainer);
          
          const centerX = absolutePos.x + nodeRadius;
          const centerY = absolutePos.y + nodeRadius;
            
          dx = centerX - event.x;
          dy = centerY - event.y;
        }
      
        svg
          .append("circle")
          .attr("cx", d.y)
          .attr("cy", d.x)
          .attr("r", 5) // Adjust radius as needed
          .attr("fill", "red")
          .attr("class", "dragged-node-center");
      }
      
      function dragMove(event, d) {
        if (d.depth === 0) return; // If it's the root node, return without doing anything
      
        // Calculate new positions for the dragged node (including text labels and circle)
        let newNodeX = event.x + dx;
        let newNodeY = event.y + dy;
      
        if (!d.data.dragged) {
          // On the first drag event, set the dragged node's position to the mouse position plus dx and dy
      
          // log statement 1 - log red circle and the derived cx, cy values
          const redCircle = svg.select(".dragged-node-center");
          const redCircleCX = redCircle.attr("cx");
          const redCircleCY = redCircle.attr("cy");
          console.log("Derived cx:", redCircleCX, "Derived cy:", redCircleCY);
      
          // log statement 2 - log the node about to be dragged
          console.log( "New node x:", newNodeX, "New node y:", newNodeY);
          console.log( "newNodeX = " + event.x + " + " + dx );
          console.log( "newNodeY = " + event.y + " + " + dy );

          newNodeX = event.y;
          newNodeY = event.x;
          console.log( "newNodeX = " + newNodeX);
          console.log( "newNodeY = " + newNodeY );
          // Update the node's position
          d.x = newNodeY;
          d.y = newNodeX;
      
          d.data.dragged = true;
        } else {
          // For subsequent drag events, update the node's position
          d.x = newNodeY;
          d.y = newNodeX;
        }
      
        // Select the current node and its associated text and set their new positions
        d3.select(this.parentNode)
          .selectAll("*")
          .attr("transform", `translate(${newNodeX}, ${newNodeY})`);
      
        // Update the position of the red circle
        svg.selectAll(".dragged-node-center").attr("cx", newNodeX).attr("cy", newNodeY);
      
        // Update the position of the links connected to this node
        if (d.parent) {
          const parentLink = svg.select(`path[link-id='${d.parent.id}-${d.id}']`);
          parentLink.attr(
            "d",
            d3
              .linkHorizontal()
              .x((d) => d.y)
              .y((d) => d.x)({
              source: d.parent,
              target: { x: d.x, y: d.y },
            })
          );
        }
      }
      
    

    function dragEnd(event, d) {
      d3.select(this).attr("stroke", null);
      // Remove the red circle
      svg.selectAll(".dragged-node-center").remove();
    }

    // Add labels for the nodes.
    nodes
      .append("text")
      .attr("dy", "0.35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return "User ID: " + d.data.userId;
      });

    nodes
      .append("text")
      .attr("dy", "1.35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return "ID: " + d.data.id;
      });

    nodes
      .append("text")
      .attr("dy", "2.35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return "Title: " + d.data.title;
      });

    nodes
      .append("text")
      .attr("dy", "3.35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return "Completed: " + d.data.completed;
      });

    nodes
      .append("circle")
      .attr("r", size / 2)
      .attr("fill", "rgba(0,0,0,0.5)")
      .call(drag); // Call the drag behavior

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .style("text-anchor", "start")
      .style("font-size", "10px")
      .text(treeData.url);

    // Name label
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", margin.top + 15)
      .style("text-anchor", "start")
      .text(treeData.name);

    // Add links between nodes.
    svg
      .selectAll("path.link")
      .data(root.links(), function (d) {
        return d.target.id;
      })
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("link-id", (d) => `${d.source.id}-${d.target.id}`)
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x(function (d) {
            return d.y;
          })
          .y(function (d) {
            return d.x;
          })
      );
  }, [treeData, size]);

  return <div ref={divRef} style={{ width: "100%" }} />; // make sure the div takes 100% width of its parent
};

export default TreeViewer;
