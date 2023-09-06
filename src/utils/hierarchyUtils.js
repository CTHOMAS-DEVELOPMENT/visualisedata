import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
/**Utils */
export function countAttributes(objString) {
  objString += "";
  const doubleQuoteCount = (objString.match(/":/g) || []).length;
  const singleQuoteCount = (objString.match(/':/g) || []).length;

  return doubleQuoteCount + singleQuoteCount;
}
//For SVG Editor ?
export const logSVG = (svgRef) => {
  const svgContent = svgRef.current.outerHTML;
  console.log(svgContent);
}
/**Hierachy Editor */
const extractObjectsFromDataString = (dataString) => {
  const regex = /{(?:[^{}]|{[^{}]*})*}/g;

  // Check if the JSON is a single object
  if (dataString.trim().startsWith('{') && dataString.trim().endsWith('}')) {
    dataString = '[' + dataString + ']';
  }

  const result = dataString.match(regex);
  return result || [];
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
export const findStringInData = (responseItem, dataString) => {

  const criteria = getSearchCriteria(responseItem);
  //console.log("***findStringInData-criteria", criteria)
  const extractObjects = extractObjectsFromDataString(dataString);
  //console.log("findStringInData-extractObjects.LENGTH", extractObjects.length)
  const indexOfData = searchObjectsByCriteria(criteria, extractObjects);
  //console.log(extractObjects[indexOfData])
  if (indexOfData) {
    //console.log("***findStringInData-extractObjects[indexOfData]", extractObjects[indexOfData])
    return extractObjects[indexOfData];
  } else {
    return null;
  }
}
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