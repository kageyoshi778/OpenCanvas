// src/components/ShapeRenderer.js
export const drawShape = (ctx, stroke, isSelected = false) => {
  if (!ctx || !stroke) return;

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

  if (isSelected) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'blue';
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    ctx.strokeRect(x - 5, y - 5, Math.abs(w) + 10, Math.abs(h) + 10);
    ctx.setLineDash([]);
  }
};

export const drawText = (ctx, stroke) => {
  if (!ctx || !stroke.text) return;
  ctx.save();
  ctx.fillStyle = stroke.color;
  ctx.font = `${stroke.fontSize}px Arial`;
  ctx.textBaseline = 'top';
  ctx.fillText(stroke.text, stroke.x, stroke.y);
  ctx.restore();
};

export const drawPen = (ctx, stroke) => {
  if (!stroke.points?.length) return;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.brushSize;
  ctx.stroke();
};
