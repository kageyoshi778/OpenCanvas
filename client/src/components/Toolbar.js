// src/components/Toolbar.js
import React from 'react';

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  undo,
  redo,
  clearCanvas,
}) => {
  return (
    <div
      className="toolbar"
      style={{
        padding: '10px',
        background: '#f0f0f0',
        borderBottom: '1px solid #ccc',
      }}
    >
      <button onClick={undo} style={{ marginRight: '5px' }}>Undo</button>
      <button onClick={redo} style={{ marginRight: '10px' }}>Redo</button>

      <select
        value={tool}
        onChange={(e) => setTool(e.target.value)}
        style={{ marginRight: '10px' }}
      >
        <option value="pen">Pen</option>
        <option value="text">Text</option>
        <option value="rectangle">Rectangle</option>
        <option value="circle">Circle</option>
        <option value="line">Line</option>
        <option value="select">Select</option>
      </select>

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        style={{ marginRight: '10px' }}
      />

      <input
        type="range"
        min="1"
        max="20"
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        style={{ marginRight: '10px' }}
      />
      <span style={{ marginRight: '10px' }}>Size: {brushSize}</span>

      <button onClick={clearCanvas}>Clear</button>
    </div>
  );
};

export default Toolbar;
