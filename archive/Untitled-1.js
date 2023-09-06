
            /**
            * STEP 2: Split the string into individual words
            */
            //const words = d.data.name.split(" ");

            /**
            * STEP 3: Initialize variables to hold the current line and its width
            */
            // currentLine = "";
            // currentLineWidth = 0;
            // lines = [];

            /**
            * STEP 4: Iterate over each word and construct lines that do not exceed the maxWidth
            */
            //for each word in words:

            // Calculate the width of the word when rendered as SVG text
            //wordWidth = getWidthOfWordInSVG(word, textElement);

            //if (wordWidth > maxWidth):
            /**
            * CASE: If a single word is wider than maxWidth, it should stand alone on its own line
            */
            //if currentLine:
            // Push the current line to the lines array before resetting
            // lines.push(currentLine);
            // currentLine = "";
            // currentLineWidth = 0;

            // Push the wide word onto its own line
            //lines.push(word);
            //else:
            /**
            * CASE: If adding the word to the current line doesn't exceed maxWidth
            */
            // if currentLineWidth + wordWidth <= maxWidth:
            // if currentLine:
            //     currentLine += " " + word;
            // else:
            //     currentLine = word;

            // currentLineWidth += wordWidth;
            // else:
            /**
             * CASE: If adding the word to the current line exceeds maxWidth, wrap to the next line
             */
            // lines.push(currentLine); // Push the current line to the lines array
            // currentLine = word;     // Start a new line with the current word
            // currentLineWidth = wordWidth;

          /**
          * STEP 5: Push any remaining words to the lines array
          */
          // if currentLine:
          // lines.push(currentLine);

          /**
          * STEP 6: Update the SVG text element to render each line separately
          */
          // for each line in lines:

          // // Create a new tspan element for each line
          // createTspanForSVGText(line, textElement);

        /**
        * Additional Consideration: Adjust vertical positioning of all tspan elements 
        * to ensure they appear centered relative to the associated circle
        */
        // adjustVerticalPositionOfTspans(textElement, circleRadius, lines.length);

        //     }
        //   });
