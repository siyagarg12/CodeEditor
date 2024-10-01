import React, { useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import axios from "axios";
import Modal from 'react-modal';

function App() {
  const [value, setValue] = useState("console.log('hello world!');");
  const [selectedText, setSelectedText] = useState("");
  const [analyzedText, setAnalyzedText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState([]); // Track current path for folder navigation
  const [selectedFile, setSelectedFile] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const textRef = useRef(null);
  const editorRef = useRef(null); // Ref for CodeMirror editor

  // Callback for content changes
  const onChange = React.useCallback((val) => {
    setValue(val);
  }, []);

  // Extension to track selection changes in CodeMirror
  const onSelectionChange = EditorView.updateListener.of((update) => {
    if (update.selectionSet) {
      const editorView = update.view;

      const selection = editorView.state.doc.sliceString(
        editorView.state.selection.main.from,
        editorView.state.selection.main.to
      );

      // Update selected text if it exists
      setSelectedText(selection || "");
    }
  });

  // Handle right-click event to display custom menu
  const handleContextMenu = (event) => {
    event.preventDefault(); // Prevent default right-click menu
    setMenuVisible(true); // Show the custom menu
    setMenuPosition({ x: event.pageX, y: event.pageY }); // Set position of the menu
  };

  // Handle outside click to close the menu
  const handleClickOutside = (event) => {
    if (
      textRef.current &&
      !textRef.current.contains(event.target) &&
      editorRef.current &&
      !editorRef.current.contains(event.target)
    ) {
      setMenuVisible(false); // Hide the menu if clicked anywhere
    } else {
      setMenuVisible(false); // Close the menu if clicked inside as well
    }
  };
  const data = { selectedText };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log(data.selectedText);
      const response = await axios.post("http://localhost:5000/api/data", data);
      console.log(response);
      console.log("Success:", response.data.receivedData.selectedText);
      setAnalyzedText(response.data.receivedData.selectedText);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit2 = async (e) => {
    setModalIsOpen(true);
    e.preventDefault();

    try {
      const response = await axios.get("http://localhost:5000/api/files");
      console.log(response.data.files);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Add event listener to detect clicks anywhere on the page
  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Handle folder or file selection
  const handleFileSelect = async (item) => {
    if (item.isFolder) {
      try {
        // Construct the path to the folder including the current path
        const folderPath = [...currentPath, item.name].join('/');
        const response = await axios.get(`http://localhost:5000/api/folder/${folderPath}`);
        setFiles(response.data.files); // Update modal with files inside the folder
        setCurrentPath([...currentPath, item.name]); // Track folder navigation
      } catch (error) {
        console.error('Error fetching folder contents:', error);
      }
    } else {
      setSelectedFile(item.name);
      try {
        // Construct the full path for the file
        const filePath = [...currentPath, item.name].join('/');
        const response = await axios.get(`http://localhost:5000/api/readfile/${filePath}`);
        setValue(response.data.fileContent);
        setModalIsOpen(false); // Close the modal after file selection
        setCurrentPath([]); // Reset the current path after file selection
      } catch (error) {
        console.error('Error fetching file content:', error);
      }
    }
  };
  
  // Go up a folder
  const handleGoBack = async () => {
    if (currentPath.length > 0) {
      // Remove the last folder from the current path to go up one level
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath); // Update the current path
      console.log(newPath);
      try {
        // Construct the path for the API call based on the new current path
        const parentPath = newPath.join('/');
        const response = await axios.get(`http://localhost:5000/api/folder/${parentPath}`);
        setFiles(response.data.files); // Show parent folder contents
      } catch (error) {
        console.error('Error fetching parent folder contents:', error);
      }
    }
  };
  const handleButton = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result; // Get file content
        setValue(fileContent); // Set the value of CodeMirror to file content
      };
      reader.readAsText(file); // Read the file as text
    }
  };

  // Close the modal
  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentPath([]);
  };

  return (
    <div>
      <div
        style={{
          width: "100%",
          display: "flex",
          gap: "20px",
        }}
      >
        <div
          ref={editorRef}
          onContextMenu={handleContextMenu} // Apply right-click menu to CodeMirror
          style={{ flex: "3" }}
        >
          <CodeMirror
            value={value}
            height="200px"
            extensions={[javascript({ jsx: true }), onSelectionChange]}
            onChange={onChange}
          />
        </div>
        <div style={{display:"flex",flex:"10", border: "1px solid #ddd"}}>
        <div>
          <button
            style={{ backgroundColor: "blue", color: "white", border: "none" }}
            onClick={handleSubmit2}
          >
            Select Remote File
          </button>
          <div>
          <button
            style={{ backgroundColor: "blue", color: "white", border: "none" }}
            onClick={() => document.getElementById("fileInput").click()}
          >
            Select Local File
          </button>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }} // Hide the input
            accept=".txt,.js,.json,.pdf" // Allow text-based files and PDFs
            onChange={handleButton} // Handle file selection
          />
        </div>
        </div>
        
          <Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  contentLabel="Select a File"
  style={{
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      height: '300px',
      overflowY: 'auto',
    },
  }}
>
  <div style={{display:"flex", width:"!00%"}}>
  <h3>Select a File</h3>
  <button onClick={closeModal} style={{ float: 'right', marginBottom: '10px', height:"30px", width: "60px", marginLeft:"100px" }}>
    Close
  </button>
  </div>
  <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',
      overflowY: 'scroll',
  }}>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {files.map((item, index) => (
        <li 
          key={index} 
          onClick={() => handleFileSelect(item)} 
          style={{ 
            cursor: 'pointer', 
            padding: '5px 10px',
            borderBottom: '1px solid #eaeaea',
            backgroundColor: '#f9f9f9',
            marginBottom: '5px',
            borderRadius: '4px',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ececec'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
        >
          {/* Show folder or file icon */}
          <span style={{ marginRight: '10px' }}>{item.isFolder ? '📁' : '📄'}</span> 
          {item.name}
        </li>
      ))}
    </ul>
  </div>
</Modal>

        </div>
        <div
          ref={textRef}
          onContextMenu={handleContextMenu} // Apply right-click menu to text display
          style={{
            flex: "1",
            position: "relative",
            border: "1px solid #ddd",
          }}
        >
          <h3>Analyzed Text:</h3>
          <pre>{analyzedText || "No text analyzed"}</pre>
        </div>
      </div>

      {/* Custom right-click menu */}
      {menuVisible && (
        <ul
          style={{
            position: "absolute",
            top: `${menuPosition.y}px`,
            left: `${menuPosition.x}px`,
            backgroundColor: "#f8f9fa",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            listStyleType: "none",
            boxShadow: "0px 2px 10px rgba(0,0,0,0.2)",
            zIndex: 1000,
            cursor: "pointer",
            width: "150px",
          }}
        >
          <li
            style={{
              padding: "5px 10px",
              borderBottom: "1px solid #ddd",
              fontWeight: "bold",
              fontSize: "14px",
            }}
            onClick={handleSubmit}
          >
            Analyze data
          </li>
          <li
            style={{
              padding: "5px 10px",
              borderBottom: "1px solid #ddd",
              fontWeight: "bold",
              fontSize: "14px",
            }}
            onClick={() => alert("Option 2 clicked")}
          >
            Option 2
          </li>
          <li
            style={{
              padding: "5px 10px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
            onClick={handleSubmit}
          >
            Option 3
          </li>
        </ul>
      )}
    </div>
  );
}

export default App;
