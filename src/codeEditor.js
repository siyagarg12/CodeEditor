import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';


// Import CodeMirror modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/markdown/markdown';
var Codemirror = require('react-codemirror');

const defaults = {
  markdown: '# Heading\n\nSome **bold** and _italic_ text\nBy [Jed Watson](https://github.com/JedWatson)',
  javascript: 'var component = {\n\tname: "react-codemirror",\n\tauthor: "Jed Watson",\n\trepo: "https://github.com/JedWatson/react-codemirror"\n};'
};

export const CodeEditor = () => {
  const [code, setCode] = useState(defaults.markdown);
  const [readOnly, setReadOnly] = useState(false);
  const [mode, setMode] = useState('markdown');
  const editorRef = useRef(null);

  const updateCode = (newCode) => {
    setCode(newCode);
  };

  const changeMode = (e) => {
    const mode = e.target.value;
    setMode(mode);
    setCode(defaults[mode]);
  };

  const toggleReadOnly = () => {
    setReadOnly(!readOnly);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const options = {
    lineNumbers: true,
    readOnly: readOnly,
    mode: mode
  };

  return (
    <div className='codeEditor'>
      <Codemirror
        ref={editorRef}
        value={code}
        onChange={updateCode}
        options={options}
        autoFocus={true}
      />
      <div style={{ marginTop: 10 }}>
        <select onChange={changeMode} value={mode}>
          <option value="markdown">Markdown</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button onClick={toggleReadOnly}>
          Toggle read-only mode (currently {readOnly ? 'on' : 'off'})
        </button>
      </div>
    </div>
  );
};

