// Lớp chữ 2D phủ lên khung hình (tiêu đề, phụ đề, nước đi, "CHIẾU HẾT!").
// Cùng một canvas dùng cho xem trước và ghép vào video khi quay.
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Overlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.title = '';
    this.caption = '';
    this.moveText = '';
    this.showTitle = true;
    this.showCaption = true;
    this.showMove = true;
    this.banner = null; // {text, color, start}
    this.captionChangedAt = 0;
  }

  setCaption(text) {
    if (text !== this.caption) {
      this.caption = text;
      this.captionChangedAt = performance.now();
    }
  }

  flash(text, color = '#ffd36b') {
    this.banner = { text, color, start: performance.now() };
  }

  draw(now = performance.now()) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const u = Math.min(W, H) / 1080; // đơn vị theo độ phân giải 1080
    ctx.clearRect(0, 0, W, H);
    const portrait = H > W;

    if (this.showTitle && this.title) {
      ctx.font = `800 ${Math.round(70 * u)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lines = wrap(ctx, this.title, W * 0.86);
      const lh = 84 * u;
      let y = portrait ? H * 0.085 : H * 0.05;
      for (const l of lines) {
        ctx.lineWidth = 12 * u;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineJoin = 'round';
        ctx.strokeText(l, W / 2, y);
        const grad = ctx.createLinearGradient(0, y, 0, y + lh);
        grad.addColorStop(0, '#fff6d8');
        grad.addColorStop(1, '#f2c14e');
        ctx.fillStyle = grad;
        ctx.fillText(l, W / 2, y);
        y += lh;
      }
    }

    if (this.showMove && this.moveText) {
      ctx.font = `700 ${Math.round(56 * u)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(this.moveText).width;
      const bw = tw + 64 * u, bh = 88 * u;
      const x = W / 2 - bw / 2;
      const y = portrait ? H * 0.785 : H * 0.86;
      roundRect(ctx, x, y, bw, bh, bh / 2);
      ctx.fillStyle = 'rgba(12,12,16,0.72)';
      ctx.fill();
      ctx.lineWidth = 3 * u;
      ctx.strokeStyle = 'rgba(242,193,78,0.8)';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.moveText, W / 2, y + bh / 2 + 2 * u);
    }

    if (this.showCaption && this.caption) {
      const age = (now - this.captionChangedAt) / 1000;
      const a = Math.min(1, age / 0.25);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `700 ${Math.round(50 * u)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lines = wrap(ctx, this.caption, W * 0.8);
      const lh = 64 * u;
      const pad = 28 * u;
      const boxH = lines.length * lh + pad * 2;
      const boxW = Math.min(W * 0.9, Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2.4);
      const y = (portrait ? H * 0.715 : H * 0.7) - boxH / 2 + (1 - a) * 20 * u;
      roundRect(ctx, W / 2 - boxW / 2, y, boxW, boxH, 24 * u);
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y + pad + i * lh));
      ctx.restore();
    }

    if (this.banner) {
      const t = (now - this.banner.start) / 1000;
      if (t > 2.6) this.banner = null;
      else {
        const pop = t < 0.35 ? 0.6 + 0.4 * Math.sin((t / 0.35) * Math.PI * 0.5) * 1.12 : 1;
        const alpha = t > 2.1 ? 1 - (t - 2.1) / 0.5 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(W / 2, H * 0.47);
        ctx.scale(pop, pop);
        ctx.rotate(-0.05);
        ctx.font = `900 ${Math.round(150 * u)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 22 * u;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(this.banner.text, 0, 0);
        ctx.shadowColor = this.banner.color;
        ctx.shadowBlur = 40 * u;
        ctx.fillStyle = this.banner.color;
        ctx.fillText(this.banner.text, 0, 0);
        ctx.restore();
      }
    }
  }
}
