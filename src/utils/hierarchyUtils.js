import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

export const objectToString = (obj) => {
    if (typeof obj === "object" && obj !== null) {
      return JSON.stringify(obj);
    } else {
      return obj;
    }
  }
  
export const exportToPDF = (svgElement, treeDataName, treeDataUrl) => {
  const doc = new jsPDF();
  const x = 0;  // Adjust as needed
  const y = 0;  // Adjust as needed
  const width = 200; // Adjust as needed
  const height = 200; // Adjust as needed

  doc.svg(svgElement, { x, y, width, height })
      .then(() => {
          doc.save(treeDataName.visualizationName);
      });
};
export const convertToHierarchyData = (data) => {
    if (!data || !data.response || !Array.isArray(data.response)) {
      console.error("Invalid data format. Cannot convert to hierarchy data.");
      return null;
    }
    const hierarchyData = {
      name: "Root",
      children: [],
    };
    let objectCounter = 0;
    data.response.forEach((item) => {
      const child = {
        name: `Object ${++objectCounter}`,
        children: [],
      };
      for (const [key, value] of Object.entries(item)) {
        if (key !== "name") {
          if (typeof value === "object" && value !== null) {
            const nestedChildren = [];
            for (const [nestedKey, nestedValue] of Object.entries(value)) {
              nestedChildren.push({
                name: `${nestedKey}: ${objectToString(nestedValue)}`,
              });
            }
            child.children.push({
              name: `${key}: ${objectToString(value)}`,
              children: nestedChildren,
            });
          } else {
            child.children.push({
              name: `${key}: ${objectToString(value)}`,
            });
          }
        }
      }
      hierarchyData.children.push(child);
    });
    return hierarchyData;
  };