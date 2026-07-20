export function initSignaturePadCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas || canvas.dataset.ready === "1") return;
  canvas.dataset.ready = "1";

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(300, Math.floor(r.width * 2));
    canvas.height = 116;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  };

  resize();

  let drawing = false;
  const pos = event => {
    const r = canvas.getBoundingClientRect();
    const touch = event.touches ? event.touches[0] : event;
    return {
      x: (touch.clientX - r.left) * (canvas.width / r.width),
      y: (touch.clientY - r.top) * (canvas.height / r.height)
    };
  };

  const start = event => {
    event.preventDefault();
    drawing = true;
    const p = pos(event);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = event => {
    if (!drawing) return;
    event.preventDefault();
    const p = pos(event);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => {
    drawing = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
}

export function clearSignatureCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

export function getSignatureCanvasImage(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return "";
  try {
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return canvas.toDataURL("image/png");
    }
    return "";
  } catch (e) {
    return "";
  }
}

export function typedSignatureToImage(name) {
  const typed = String(name || "").trim();
  if (!typed) return "";

  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.font = '64px "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';
  ctx.textBaseline = "middle";
  ctx.fillText(typed, 24, 78, 640);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 126);
  ctx.lineTo(682, 126);
  ctx.stroke();
  return canvas.toDataURL("image/png");
}
