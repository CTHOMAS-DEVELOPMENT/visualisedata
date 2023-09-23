import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { select } from "d3";
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
/*Api input*/
export const appendApiKeyToUrl = (url, apiKey) => {
  const parsedUrl = new URL(url); // Will throw an error if the URL is invalid

  // Check if 'key' is already in the URL
  if (!parsedUrl.searchParams.has('key')) {
    parsedUrl.searchParams.append('key', apiKey);
  } else {
    parsedUrl.searchParams.set('key', apiKey);
  }

  return parsedUrl.toString();
};
/**Hierachy Editor */


export function getWidthOfWordInSVG(word, textElement) {
  // Temporarily set the text element's content to the word
  textElement.textContent = word;
  const width = textElement.getBBox().width;
  // Reset the text content
  textElement.textContent = "";
  return width;
}

export function formatWideTexts(textElem, circleDiameter, d) {
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
function getObjectsNameValuePair(inputString) {
  // Find the index of the left-most colon
  const colonIndex = inputString.indexOf(":");

  // If there's no colon, return an appropriate message or do nothing
  if (colonIndex === -1) {
    return null;
  }

  // Split the string into two parts based on the left-most colon
  const name = inputString.substring(0, colonIndex).trim();
  const value = inputString.substring(colonIndex + 1).trim();

  return { name: name, value: value };
}
export function updateDataWithUserInput(dataUnderEdit, allData, svgReference) {
  let allDataObjects = null;
  try {
    //This is all the objects from the api call
    allDataObjects = JSON.parse(allData);
  } catch (error) {
    //Add to our messaging component
    console.log("1 Use message component", error);
  }
  //Ordered/matching circles and text
  const nodeElements = svgReference.querySelectorAll("g.node");
  const textElements = svgReference.querySelectorAll("g.node text");
  //Process the rootItems with the main index
  const updatedWithIndexRootItems = dataUnderEdit.map((dataLine) => {
    let rootItem = null;
    let indexFound = 0;
    try {
      //These rootItem objects have the attributes containing any changes [{...},{...},{...}]
      rootItem = JSON.parse(dataLine);
      //GetIndex of object, which matches the order of all objects
      indexFound = findIndexOfMatchingObject(allDataObjects, rootItem);
      rootItem.parentIndex = indexFound;
    } catch (error) {
      console.log("2* Use message component", error);
    }
    return rootItem;
  });
  
  const newObject = { depth: 0 };
  let replacementNewDataObjects = [];
  let next = Object.create(newObject);
  try {
    next.parentIndex =
    updatedWithIndexRootItems[0].parentIndex;    
  } catch (error) {
    console.log("3* Use message component", error);
  }

  let nameValueContent = null;
  let objectAttributeList="";

  nodeElements.forEach((nodeElement, index) => {
    next.depth = nodeElement.getAttribute("data-depth");
      nameValueContent = getObjectsNameValuePair(
      textElements[index].textContent
    );
    try {
      if(objectAttributeList.includes(nameValueContent.name))
      {
        replacementNewDataObjects.push(next); //Push the last completed Object
        next = Object.create(newObject); //Create and start building new object
        next.parentIndex =
          updatedWithIndexRootItems[
            replacementNewDataObjects.length
          ].parentIndex;
        objectAttributeList=nameValueContent.name;
        next[nameValueContent.name] = nameValueContent.value;
      }
      else{
        objectAttributeList=objectAttributeList+=" "+nameValueContent.name;
        next[nameValueContent.name] = nameValueContent.value;
      }
    } catch (error) {
      console.log("4* Use message component", error);
    }
  });
  //Push last object
  try {
    next.parentIndex =
    updatedWithIndexRootItems[replacementNewDataObjects.length].parentIndex;
    replacementNewDataObjects.push(next);
  } catch (error) {
    console.log("5* Use message component", error);
  }
  //console.log("replacementNewDataObjects", replacementNewDataObjects);
  replacementNewDataObjects.forEach((displayedRootNode, index) => {
    allDataObjects[displayedRootNode.parentIndex]=displayedRootNode;
  })
  return allDataObjects;
}
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
// const objectToString = (obj) => {
//   if (typeof obj === 'object') {
//     return JSON.stringify(obj);
//   }
//   return obj;
// };
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

  const createChild = (key, value) => {
    return {
      name: `${key}: ${objectToString(value)}`,
    };
  };

  const createNestedChildren = (obj) => {
    const nestedChildren = [];
    for (const [nestedKey, nestedValue] of Object.entries(obj)) {
      if (Array.isArray(nestedValue)) {
        const arrayChildren = nestedValue.map((arrayItem, index) => {
          return {
            name: `Item ${index + 1}`,
            children: createNestedChildren(arrayItem),
          };
        });

        nestedChildren.push({
          name: `${nestedKey}`,
          children: arrayChildren,
        });
      } else if (typeof nestedValue === "object" && nestedValue !== null) {
        nestedChildren.push({
          name: `${nestedKey}`,
          children: createNestedChildren(nestedValue),
        });
      } else {
        nestedChildren.push(createChild(nestedKey, nestedValue));
      }
    }
    return nestedChildren;
  };

  const hierarchyData = {
    name: "Root",
    children: [],
  };

  let objectCounter = 0;
  for (const item of data.response) {
    const child = {
      name: `Object ${++objectCounter}`,
      children: createNestedChildren(item),
    };

    hierarchyData.children.push(child);
  }

  return hierarchyData;
};



