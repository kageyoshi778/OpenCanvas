// utils/canvasHelpers.js
export function drawShape(ctx, shape) {
  if (!ctx || !shape) return;

  ctx.strokeStyle = shape.color || '#000';
  ctx.lineWidth = shape.lineWidth || 2;
  ctx.fillStyle = shape.color || '#000';

  switch (shape.type) {
    case 'line':
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      break;

    case 'rectangle':
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'text':
      ctx.font = `${shape.fontSize || 24}px Arial`;
      ctx.fillText(shape.text || 'Sample Text', shape.x, shape.y);
      break;

    default:
      console.warn('Unknown shape type:', shape.type);
  }
}
