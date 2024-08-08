# P.A-INFOTEL-Assign

Refresh-token implementation
  1. Get refreshToken from cookie
  2. Verify token return email and id
  3. Create new accessToken (expire 15m), refreshToken (expire 7d)
  4. Update refreshToken where user id
  5. Save new accessToken adn refreshToken into cookie
  
API endpoints
  1. Auth
      Signup: POST /auth/signup 
      Login: POST /auth/login
      Refresh-token: POST /auth/refresh
      Google login: GET /auth/google/callback 
  3. Booking
      Upload file: POST /booking/upload
      Get JSON data: GET /booking/<confirmation_no>
      Get JSON data without Lib: GET /booking/withoutLib/<confirmation_no>
  3.Payment 
      Payment: POST /payment/<confirmation_no>

XML processing without third-party library
  1. Parse the XML String 
    A DOMParser object is created to parse the XML string into a Document Object Model (DOM) structure (srcDOM)
  2. Recursive XML Parsing
    The parseXmlFromFile function is a recursive function designed to traverse the XML DOM structure and convert it into a JSON-like object.
    Handling Text Nodes:
      If the node is a text node (TEXT_NODE), the function trims any whitespace from the node's value. If the trimmed value is empty, it returns undefined; otherwise, it returns the value.
    Handling Element Nodes:
      If the node is an element node (ELEMENT_NODE), it creates an empty object (json) to hold the parsed content.
    Attributes Collection:
      If the element has attributes, these are collected into an attributes object.
    Child Nodes Handling:
      The function checks if the element has child nodes. If so, it iterates through each child node.
    Element Children:
      For child elements, the function recursively parses each child, adding the resulting object to the json object. If a child element with the same name already exists, it converts the entry into an array to accommodate multiple elements with the same name.
    Text Children:
      For text nodes, the text value is stored in the _ key within the json object.
    Merging Attributes:
      After processing the children, if the element has attributes, these are added to the json object. If the element already contains text (under the _ key), this text is preserved.
  3. Return the Parsed JSON:
     Finally, the function starts the parsing process from the root element of the XML document (srcDOM.documentElement) and returns the fully parsed JSON-like structure.
     
Design Choices
  Recursive Parsing: 
    The algorithm uses recursion to handle nested XML structures, allowing it to elegantly navigate and convert complex XML hierarchies.
  Handling Multiple Child Elements: 
    The algorithm checks if a particular child node already exists in the json object. If it does, it stores these nodes as an array, ensuring that multiple elements with the same name are correctly represented.
  Text and Attributes Handling: 
    The algorithm stores text nodes under a special _ key to distinguish them from child elements and attributes. This ensures that the content is preserved even when an element has both text and child elements or attributes.
  Attributes Merge: 
    By merging attributes directly into the json object, the algorithm ensures that they are treated as part of the element's main structure. This design simplifies accessing both element content and attributes in the resulting JSON.
