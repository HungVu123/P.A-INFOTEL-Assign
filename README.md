# P.A-INFOTEL-Assign

Refresh-token implementation
  1. Get refreshToken from cookie
  2. Verify token return email and id
  3. Create new accessToken (expire 15m), refreshToken (expire 7d)
  4. Update refreshToken where user id
  5. Save new accessToken adn refreshToken into cookie
  
API endpoints
  1. Auth
      1. Signup: POST /auth/signup
      2. Login: POST /auth/login
      3. Refresh-token: POST /auth/refresh
      4. Google login: GET /auth/google/callback 
  2. Booking
      1. Upload file: POST /booking/upload
      2. Get JSON data: GET /booking/<confirmation_no>
      3. Get JSON data without Lib: GET /booking/withoutLib/<confirmation_no>
  3. Payment
      1. Payment: POST /payment/<confirmation_no>

XML processing without third-party library
  1. Parse the XML String: A DOMParser object is created to parse the XML string into a Document Object Model (DOM) structure (srcDOM)
  2. Recursive XML Parsing
      1. Handling Text Nodes: If the node is a text node (TEXT_NODE), the function trims any whitespace from the node's value.
      2. Handling Element Nodes: If the node is an element node (ELEMENT_NODE), it creates an empty object (json) to hold the parsed content.
      3. Attributes Collection: If the element has attributes, these are collected into an attributes object.
      4. Child Nodes Handling: The function checks if the element has child nodes. If so, it iterates through each child node.
      5. Element Children: For child elements, the function recursively parses each child, adding the resulting object to the json object. If a child element with the same name already exists, it converts the entry into an array to accommodate multiple elements with the same name.
      6. Text Children: For text nodes, the text value is stored in the _ key within the json object.
      7. Merging Attributes: After processing the children, if the element has attributes, these are added to the json object. If the element already contains text (under the _ key), this text is preserved.
  3. Return the Parsed JSON:
     Finally, the function starts the parsing process from the root element of the XML document (srcDOM.documentElement) and returns the fully parsed JSON-like structure.
     
Design Choices
  1. Recursive Parsing: The algorithm uses recursion to handle nested XML structures, allowing it to elegantly navigate and convert complex XML hierarchies.
  2. Handling Multiple Child Elements: The algorithm checks if a particular child node already exists in the json object. If it does, it stores these nodes as an array, ensuring that multiple elements with the same name are correctly represented.
  3. Text and Attributes Handling: The algorithm stores text nodes under a special _ key to distinguish them from child elements and attributes. This ensures that the content is preserved even when an element has both text and child elements or attributes.
  4. Attributes Merge: By merging attributes directly into the json object, the algorithm ensures that they are treated as part of the element's main structure. This design simplifies accessing both element content and attributes in the resulting JSON.
  
    
  
    
  
    
  

