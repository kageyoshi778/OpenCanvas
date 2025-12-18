// utils/aiUtils.js
/**
 * Convert AI response into standardized canvas shapes
 * Example AI output:
 * { type: 'draw', shape: 'line', x1: 10, y1: 10, x2: 100, y2: 100, color: '#000' }
 */
export function parseAIResponse(response) {
  if (!response) return null;

  try {
    let action = typeof response === 'string' ? JSON.parse(response) : response;

    if (action.action === 'draw' || action.type === 'draw') {
      switch (action.shape?.toLowerCase()) {
        case 'line':
          return {
            type: 'line',
            x1: action.x1 ?? 10,
            y1: action.y1 ?? 10,
            x2: action.x2 ?? 200,
            y2: action.y2 ?? 200,
            color: action.color ?? '#000',
            lineWidth: action.brushSize ?? 3,
          };

        case 'rectangle':
        case 'square':
          return {
            type: 'rectangle',
            x: action.x ?? 100,
            y: action.y ?? 100,
            width: action.width ?? 150,
            height: action.height ?? 150,
            color: action.color ?? '#000',
          };

        case 'circle':
          return {
            type: 'circle',
            x: action.x ?? 200,
            y: action.y ?? 200,
            radius: action.radius ?? 60,
            color: action.color ?? '#000',
          };

        case 'text':
          return {
            type: 'text',
            x: action.x ?? 100,
            y: action.y ?? 100,
            text: action.text ?? 'Sample Text',
            fontSize: action.fontSize ?? 24,
            color: action.color ?? '#000',
          };

        default:
          console.warn('Unknown shape in AI response:', action.shape);
          return null;
      }
    } else {
      console.warn('AI response not a draw action:', action);
      return null;
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}
