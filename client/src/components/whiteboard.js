import React, { useRef, useState, useEffect, useCallback } from 'react';
import PromptBox from './prompt';
import { db } from '../utils/firebase';
import { push,ref, onValue, set } from 'firebase/database';

const addStrokeToFirebase = (stroke) => {
  const strokesRef = ref(db, 'strokes');
  push(strokesRef, stroke);
};

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [textInput, setTextInput] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const currentStroke = useRef(null);

  // Helper function to get consistent mouse coordinates
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  const handleMouseDown = (e) => {
    const mousePos = getMousePos(e);
    
    if (tool === 'select') {
      // Check if we're clicking on the selected shape
      if (selectedShapeIndex !== null) {
        const shape = strokes[selectedShapeIndex];
        if (shape && isPointInShape(mousePos.x, mousePos.y, shape)) {
          // Calculate offset from mouse to shape's top-left corner
          dragOffset.current = {
            dx: mousePos.x - Math.min(shape.startX, shape.endX),
            dy: mousePos.y - Math.min(shape.startY, shape.endY)
          };
          setIsDraggingShape(true);
          return;
        }
      }
      
      // Try to select a new shape
      handleShapeSelection(mousePos.x, mousePos.y);
      return;
    }

    if (tool === 'pen') {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(mousePos.x, mousePos.y);
      setIsDrawing(true);
      currentStroke.current = {
        type: 'pen',
        points: [{ x: mousePos.x, y: mousePos.y }],
        color,
        brushSize,
      };
    } else if (['rectangle', 'circle', 'line'].includes(tool)) {
      setIsDrawing(true);
      currentStroke.current = {
        type: tool,
        startX: mousePos.x,
        startY: mousePos.y,
        endX: mousePos.x,
        endY: mousePos.y,
        color,
        brushSize,
      };
    }
  };

  const handleMouseMove = (e) => {
    const mousePos = getMousePos(e);

    if (tool === 'pen' && isDrawing) {
      ctxRef.current.lineTo(mousePos.x, mousePos.y);
      ctxRef.current.stroke();
      currentStroke.current.points.push({ x: mousePos.x, y: mousePos.y });
    } else if (['rectangle', 'circle', 'line'].includes(tool) && isDrawing) {
      setPreviewShape({
        ...currentStroke.current,
        endX: mousePos.x,
        endY: mousePos.y,
      });
    } else if (tool === 'select' && isDraggingShape && selectedShapeIndex !== null) {
      setStrokes((prev) => {
        const updated = [...prev];
        const shape = { ...updated[selectedShapeIndex] };
        
        if (!shape || !['rectangle', 'circle', 'line'].includes(shape.type)) return prev;

        // Calculate new position based on mouse position and drag offset
        const newStartX = mousePos.x - dragOffset.current.dx;
        const newStartY = mousePos.y - dragOffset.current.dy;
        
        // Calculate the width and height of the shape
        const width = shape.endX - shape.startX;
        const height = shape.endY - shape.startY;
        
        // Update shape position
        shape.startX = newStartX;
        shape.startY = newStartY;
        shape.endX = newStartX + width;
        shape.endY = newStartY + height;

        updated[selectedShapeIndex] = shape;
        return updated;
      });
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing) {
      ctxRef.current.closePath();
      setStrokes((prev) => [...prev, currentStroke.current]);
    } else if (['rectangle', 'circle', 'line'].includes(tool) && isDrawing) {
      setStrokes((prev) => [...prev, previewShape]);
      setPreviewShape(null);
    }
    setIsDrawing(false);
    setIsDraggingShape(false);
    setRedoStack([]);
  };

  const isPointInShape = (x, y, shape) => {
    if (!shape || !['rectangle', 'circle', 'line'].includes(shape.type)) return false;
    
    const { startX, startY, endX, endY } = shape;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    if (shape.type === 'rectangle' || shape.type === 'line') {
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    } else if (shape.type === 'circle') {
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      return distance <= radius;
    }
    return false;
  };

  const handleShapeSelection = (x, y) => {
    // Search from top to bottom (last drawn first)
    for (let i = strokes.length - 1; i >= 0; i--) {
      const shape = strokes[i];
      if (shape && isPointInShape(x, y, shape)) {
        setSelectedShapeIndex(i);
        return;
      }
    }
    setSelectedShapeIndex(null);
  };

  const handleCanvasClick = (e) => {
    const mousePos = getMousePos(e);

    if (tool === 'text') {
      setTextInput({ x: mousePos.x, y: mousePos.y, value: '' });
      return;
    }

    if (tool === 'select') {
      for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];

        if (stroke.type === 'text') {
          // Set font before measuring
          ctxRef.current.font = `${stroke.fontSize}px Arial`;
          const textWidth = ctxRef.current.measureText(stroke.text).width;
          const textHeight = stroke.fontSize; // Approximation
          const x = stroke.x;
          const y = stroke.y - textHeight;

          if (
            mousePos.x >= x &&
            mousePos.x <= x + textWidth &&
            mousePos.y >= y &&
            mousePos.y <= y + textHeight
          ) {
            // Clicked on text
            setTextInput({ 
              x: stroke.x, 
              y: stroke.y, 
              value: stroke.text, 
              editingIndex: i 
            });
            return;
          }
        }
      }
    }
  };

  const handleTextSubmit = () => {
    if (!textInput?.value.trim()) {
      setTextInput(null);
      return;
    }

    if (textInput.editingIndex !== undefined) {
      // Editing existing text
      setStrokes((prev) => {
        const updated = [...prev];
        updated[textInput.editingIndex] = {
          ...updated[textInput.editingIndex],
          text: textInput.value,
        };
        return updated;
      });
    } else {
      // New text
      setStrokes((prev) => [
        ...prev,
        {
          type: 'text',
          x: textInput.x,
          y: textInput.y,
          text: textInput.value,
          color,
          fontSize: brushSize * 4,
        },
      ]);
    }

    setTextInput(null);
    setRedoStack([]);
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawShape = (stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      const { startX, startY, endX, endY } = stroke;
      const w = endX - startX;
      const h = endY - startY;

      if (stroke.type === 'rectangle') {
        ctx.strokeRect(startX, startY, w, h);
      } else if (stroke.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (stroke.type === 'circle') {
        const radius = Math.sqrt(w ** 2 + h ** 2) / 2;
        const cx = startX + w / 2;
        const cy = startY + h / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };

    if (!Array.isArray(strokes)) {
      console.error('strokes is not an array:', strokes);
      return; // or set strokes = []
    }

    strokes.filter(Boolean).forEach((stroke, i) => {
      if (stroke.type === 'pen') {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let j = 1; j < stroke.points.length; j++) {
          ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
        }
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.stroke();
      } else if (stroke.type === 'text') {
        ctx.save(); // Save current context state
        ctx.fillStyle = stroke.color;
        ctx.font = `${stroke.fontSize}px Arial`;
        ctx.textBaseline = 'top'; // Set consistent text baseline
        ctx.fillText(stroke.text, stroke.x, stroke.y);
        ctx.restore(); // Restore context state
      } else {
        drawShape(stroke);
        if (i === selectedShapeIndex) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'blue';
          const x = Math.min(stroke.startX, stroke.endX);
          const y = Math.min(stroke.startY, stroke.endY);
          const w = Math.abs(stroke.endX - stroke.startX);
          const h = Math.abs(stroke.endY - stroke.startY);
          ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
          ctx.setLineDash([]);
        }
      }
    });

    if (previewShape) drawShape(previewShape);
  }, [strokes, previewShape, selectedShapeIndex]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const onResize = () => {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      setIsDraggingShape(false);
      setSelectedShapeIndex(null);
      redrawCanvas();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [redrawCanvas]);

  const undo = () => {
    if (strokes.length === 0) return;
    const updated = [...strokes];
    const popped = updated.pop();
    setRedoStack((prev) => [...prev, popped]);
    setStrokes(updated);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const updated = [...redoStack];
    const restored = updated.pop();
    setStrokes((prev) => [...prev, restored]);
    setRedoStack(updated);
  };

  const clearCanvas = () => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setStrokes([]);
    setRedoStack([]);
    setIsDrawing(false);
    setSelectedShapeIndex(null);
  };

  useEffect(() => {
    function handleAIAction(event) {
      const action = event.detail;
      console.log('🎯 AI Command Received:', action);

      if (!action || (!action.type && !action.action)) return;

      // Handle different action formats
      if (action.action === 'draw' || action.type?.startsWith('draw_')) {
        let stroke = null;

        // Handle line drawing
        if (action.shape === 'line' || action.type === 'draw_line') {
          const startX = action.startX ?? action.x1 ?? 100;
          const startY = action.startY ?? action.y1 ?? 100;
          const endX = action.endX ?? action.x2 ?? 200;
          const endY = action.endY ?? action.y2 ?? 200;
          const color = action.color ?? '#000000';
          const brushSize = action.brushSize ?? action.width ?? 3;

          stroke = {
            type: 'line',
            startX,
            startY,
            endX,
            endY,
            color,
            brushSize,
          };
        }

        // Handle rectangle drawing
        else if (action.shape === 'rectangle' || action.type === 'draw_rectangle') {
          const startX = action.startX ?? 100;
          const startY = action.startY ?? 100;
          const endX = action.endX ?? 200;
          const endY = action.endY ?? 200;
          const color = action.color ?? '#000000';
          const brushSize = action.brushSize ?? 3;

          stroke = {
            type: 'rectangle',
            startX,
            startY,
            endX,
            endY,
            color,
            brushSize,
          };
        }

        // Handle text drawing
        else if (
          action.shape === 'text' ||
          action.type === 'write_text' ||
          action.action === 'write_text'
    ) {
      const x = action.x ?? 100;
      const y = action.y ?? 100;

  // Try multiple fields for AI response text
    const text =
      action.text ??
      action.content ??
      action.value ??
      action.message ??
        'Sample Text';

    const fontSize = action.fontSize ?? action.font_size ?? 24;
    const color = action.color ?? '#000000';

  stroke = {
    type: 'text',
    x,
    y,
    text,
    fontSize,
    color,
  };
}

        // Handle circle drawing
        else if (action.shape === 'circle' || action.type === 'draw_circle') {
          const centerX = action.centerX ?? action.x ?? 150;
          const centerY = action.centerY ?? action.y ?? 150;
          const radius = action.radius ?? 50;
          const color = action.color ?? '#000000';
          const brushSize = action.brushSize ?? 3;

          stroke = {
            type: 'circle',
            startX: centerX - radius,
            startY: centerY - radius,
            endX: centerX + radius,
            endY: centerY + radius,
            color,
            brushSize,
          };
        }

        if (stroke) {
          console.log('Adding stroke:', stroke);
          setStrokes(prev => [...prev, stroke]);
          addStrokeToFirebase(stroke);
          setRedoStack([]);
        }
      }
    }

    window.addEventListener('ai-action', handleAIAction);
    return () => window.removeEventListener('ai-action', handleAIAction);
  }, []);

  useEffect(() => {
    const strokesRef = ref(db, 'strokes');

    // Flag to prevent update loop
    let isLocalUpdate = false;

    const unsubscribe = onValue(strokesRef, (snapshot) => {
      if (isLocalUpdate) return;
      const data = snapshot.val();
      if (data) {
        const list = Array.isArray(data) ? data : Object.values(data);
        setStrokes(list);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const strokesRef = ref(db, 'strokes');

    // Debounce Firebase updates to avoid write storms
    const timeout = setTimeout(() => {
      set(strokesRef, strokes);
    }, 300); // adjust delay as needed

    return () => clearTimeout(timeout);
  }, [strokes]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="toolbar" style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <PromptBox />
        <button onClick={undo} style={{ marginRight: '5px' }}>Undo</button>
        <button onClick={redo} style={{ marginRight: '10px' }}>Redo</button>
        <select value={tool} onChange={(e) => setTool(e.target.value)} style={{ marginRight: '10px' }}>
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

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        style={{ 
          border: '1px solid #ccc', 
          background: 'white', 
          display: 'block',
          cursor: tool === 'select' && selectedShapeIndex !== null ? 'move' : 'crosshair'
        }}
      />

      {textInput && (
        <input
          type="text"
          autoFocus
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape') setTextInput(null);
          }}
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y,
            fontSize: `${brushSize * 4}px`,
            color: color,
            border: '1px solid #aaa',
            background: 'white',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default Whiteboard;