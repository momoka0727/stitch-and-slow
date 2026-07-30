"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ThreadColor = {
  code: string;
  name: string;
  hex: string;
};

type Pattern = {
  id: string;
  name: string;
  subtitle: string;
  difficulty: "入门" | "轻松" | "进阶";
  size: number;
  minutes: number;
  grid: number[];
};

const THREADS: ThreadColor[] = [
  { code: "B5200", name: "雪白", hex: "#F8F5EA" },
  { code: "310", name: "墨黑", hex: "#252322" },
  { code: "3777", name: "陶土红", hex: "#973C35" },
  { code: "351", name: "珊瑚红", hex: "#E96B60" },
  { code: "741", name: "橘黄", hex: "#F2A33A" },
  { code: "726", name: "柠檬黄", hex: "#F3CE4B" },
  { code: "834", name: "橄榄绿", hex: "#7E7B3D" },
  { code: "3347", name: "森林绿", hex: "#516B49" },
  { code: "3813", name: "薄荷绿", hex: "#98C8B1" },
  { code: "3760", name: "湖水蓝", hex: "#3F91A6" },
  { code: "799", name: "牛仔蓝", hex: "#406F9F" },
  { code: "336", name: "深靛蓝", hex: "#263A66" },
  { code: "3834", name: "莓果紫", hex: "#743853" },
  { code: "211", name: "薰衣草", hex: "#C7A5C9" },
  { code: "761", name: "浅粉", hex: "#E9A6A2" },
  { code: "3865", name: "奶油白", hex: "#E9E2CE" },
  { code: "420", name: "榛果棕", hex: "#9A6B3D" },
  { code: "938", name: "深咖", hex: "#4A3428" },
];

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) ** 2) / rx ** 2 + ((y - cy) ** 2) / ry ** 2 <= 1;

function makeGrid(kind: string, size = 24) {
  const grid = Array(size * size).fill(-1);
  const put = (x: number, y: number, color: number) => {
    if (x >= 0 && x < size && y >= 0 && y < size) grid[y * size + x] = color;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      let c = -1;
      if (kind === "bear") {
        if (ellipse(nx, ny, .50, .65, .27, .28)) c = 16;
        if (ellipse(nx, ny, .50, .40, .23, .22)) c = 16;
        if (ellipse(nx, ny, .34, .25, .09, .10) || ellipse(nx, ny, .66, .25, .09, .10)) c = 17;
        if (ellipse(nx, ny, .50, .47, .12, .09)) c = 15;
        if (ellipse(nx, ny, .43, .38, .025, .03) || ellipse(nx, ny, .57, .38, .025, .03)) c = 1;
        if (ellipse(nx, ny, .50, .45, .035, .03)) c = 17;
        if (ny > .72 && ny < .78 && nx > .31 && nx < .69) c = 3;
        if (ellipse(nx, ny, .72, .64, .10, .08)) c = 5;
      } else if (kind === "sunrise") {
        if (ny > .31 && ny < .62 && ellipse(nx, ny, .5, .58, .19, .21)) c = 5;
        if (ny > .48 && ny < .52 && nx > .20 && nx < .80) c = 4;
        if (ny > .53 && ny < .78 && Math.abs(nx - .30) < (.78 - ny) * 1.25) c = 11;
        if (ny > .48 && ny < .80 && Math.abs(nx - .66) < (.82 - ny) * 1.30) c = 10;
        if (ny > .70 && ny < .82) c = 7;
        if (ny > .80 && ny < .87) c = 8;
      } else if (kind === "tulip") {
        if (ny > .30 && ny < .72 && Math.abs(nx - .50) < .025) c = 7;
        if (ellipse(nx, ny, .43, .58, .14, .065) || ellipse(nx, ny, .57, .70, .14, .06)) c = 8;
        if (ellipse(nx, ny, .50, .30, .18, .16)) c = 3;
        if (ellipse(nx, ny, .40, .25, .10, .13) || ellipse(nx, ny, .60, .25, .10, .13)) c = 2;
        if (ny < .21 && ellipse(nx, ny, .50, .28, .065, .14)) c = 14;
      } else if (kind === "bird") {
        if (ellipse(nx, ny, .49, .49, .24, .20)) c = 9;
        if (ellipse(nx, ny, .63, .33, .14, .14)) c = 10;
        if (ellipse(nx, ny, .48, .53, .12, .10)) c = 11;
        if (ny > .63 && ny < .67 && nx > .32 && nx < .72) c = 17;
        if (nx > .75 && nx < .86 && Math.abs(ny - .34) < (.86 - nx) * .45) c = 4;
        if (ellipse(nx, ny, .67, .31, .022, .025)) c = 1;
        if (ny > .65 && ny < .86 && (Math.abs(nx - .43) < .02 || Math.abs(nx - .57) < .02)) c = 16;
      } else if (kind === "cup") {
        if (nx > .28 && nx < .68 && ny > .42 && ny < .72) c = 15;
        if (ny > .68 && ny < .74 && nx > .25 && nx < .72) c = 9;
        if (ellipse(nx, ny, .71, .56, .13, .14) && !ellipse(nx, ny, .70, .56, .07, .08)) c = 9;
        if (ellipse(nx, ny, .43, .33, .11, .12)) c = 2;
        if (ellipse(nx, ny, .54, .35, .10, .11)) c = 3;
        if (ny > .31 && ny < .48 && Math.abs(nx - .49) < .02) c = 7;
        if (ny > .19 && ny < .33 && (Math.abs(nx - .38) < .018 || Math.abs(nx - .55) < .018)) c = 13;
      } else if (kind === "cabin") {
        if (ellipse(nx, ny, .25, .25, .12, .12)) c = 5;
        if (ny > .72 && ny < .83) c = 11;
        if (nx > .31 && nx < .71 && ny > .45 && ny < .73) c = 16;
        if (ny > .32 && ny < .50 && Math.abs(nx - .51) < (.51 - ny) * 1.4) c = 17;
        if (nx > .48 && nx < .57 && ny > .58 && ny < .73) c = 2;
        if (nx > .60 && nx < .68 && ny > .52 && ny < .60) c = 5;
        if (ny > .48 && ny < .76 && (ellipse(nx, ny, .18, .63, .07, .22) || ellipse(nx, ny, .83, .60, .08, .25))) c = 7;
      } else if (kind === "cat") {
        if (ellipse(nx, ny, .50, .58, .23, .28)) c = 4;
        if (ellipse(nx, ny, .50, .35, .21, .19)) c = 4;
        if ((nx > .31 && nx < .43 && ny > .13 && ny < .34) || (nx > .57 && nx < .69 && ny > .13 && ny < .34)) c = 2;
        if (ellipse(nx, ny, .43, .35, .025, .03) || ellipse(nx, ny, .57, .35, .025, .03)) c = 7;
        if (ellipse(nx, ny, .50, .43, .03, .025)) c = 14;
        if (ny > .51 && ny < .80 && Math.abs(nx - .50) < .035) c = 15;
        if (ellipse(nx, ny, .69, .70, .20, .08)) c = 2;
      } else if (kind === "lemon") {
        if (Math.abs(ny - (.72 - nx * .55)) < .025 && nx > .18 && nx < .82) c = 7;
        if (ellipse(nx, ny, .34, .55, .14, .10) || ellipse(nx, ny, .66, .35, .14, .10)) c = 8;
        if (ellipse(nx, ny, .47, .61, .13, .16) || ellipse(nx, ny, .63, .55, .12, .15)) c = 5;
        if (ellipse(nx, ny, .43, .55, .07, .11) || ellipse(nx, ny, .59, .50, .065, .10)) c = 6;
      } else if (kind === "mushroom") {
        if (nx > .43 && nx < .58 && ny > .47 && ny < .78) c = 15;
        if (ellipse(nx, ny, .50, .43, .28, .20) && ny > .34) c = 2;
        if (ellipse(nx, ny, .39, .40, .035, .04) || ellipse(nx, ny, .53, .36, .04, .045) || ellipse(nx, ny, .64, .44, .035, .04)) c = 0;
        if (ny > .76 && ny < .82 && nx > .25 && nx < .75) c = 7;
        if (ellipse(nx, ny, .32, .71, .06, .13) || ellipse(nx, ny, .70, .70, .05, .15)) c = 8;
      } else if (kind === "whale") {
        if (ellipse(nx, ny, .47, .53, .29, .17)) c = 10;
        if (nx > .68 && nx < .84 && Math.abs(ny - .52) < (.84 - nx) * .65) c = 9;
        if (ellipse(nx, ny, .39, .59, .17, .08)) c = 0;
        if (ellipse(nx, ny, .35, .49, .022, .025)) c = 1;
        if ((ellipse(nx, ny, .64, .23, .035, .04) || ellipse(nx, ny, .73, .16, .025, .03) || ellipse(nx, ny, .78, .29, .02, .025))) c = 9;
        if (nx > .32 && nx < .58 && ny > .66 && ny < .70) c = 11;
      }
      if (c >= 0) put(x, y, c);
    }
  }
  return grid;
}

const PATTERNS: Pattern[] = [
  { id: "bear", name: "栗子小熊", subtitle: "一杯茶的温柔时间", difficulty: "入门", size: 24, minutes: 35, grid: makeGrid("bear") },
  { id: "sunrise", name: "山野日出", subtitle: "把清晨缝进布里", difficulty: "轻松", size: 24, minutes: 42, grid: makeGrid("sunrise") },
  { id: "tulip", name: "粉色郁金香", subtitle: "春天的一小束", difficulty: "入门", size: 24, minutes: 28, grid: makeGrid("tulip") },
  { id: "bird", name: "蓝羽小鸟", subtitle: "窗边停留的朋友", difficulty: "轻松", size: 24, minutes: 38, grid: makeGrid("bird") },
  { id: "cup", name: "草莓茶杯", subtitle: "甜点时间", difficulty: "进阶", size: 24, minutes: 48, grid: makeGrid("cup") },
  { id: "cabin", name: "月夜小屋", subtitle: "森林深处有灯光", difficulty: "进阶", size: 24, minutes: 52, grid: makeGrid("cabin") },
  { id: "cat", name: "橘猫伸懒腰", subtitle: "慢吞吞的午后", difficulty: "轻松", size: 24, minutes: 40, grid: makeGrid("cat") },
  { id: "lemon", name: "柠檬枝", subtitle: "明亮又清新的夏日", difficulty: "入门", size: 24, minutes: 30, grid: makeGrid("lemon") },
  { id: "mushroom", name: "红帽蘑菇", subtitle: "雨后森林来信", difficulty: "轻松", size: 24, minutes: 36, grid: makeGrid("mushroom") },
  { id: "whale", name: "深海小鲸", subtitle: "带着气泡去旅行", difficulty: "进阶", size: 24, minutes: 45, grid: makeGrid("whale") },
];

function CrossCanvas({
  pattern,
  compact = false,
  stitched,
  selectedColor,
  animatedIndex,
  animationNonce,
  onStitch,
}: {
  pattern: Pattern;
  compact?: boolean;
  stitched?: Set<number>;
  selectedColor?: number;
  animatedIndex?: number | null;
  animationNonce?: number;
  onStitch?: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const display = compact ? 240 : 660;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = display * ratio;
    canvas.height = display * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = display / pattern.size;
    const chartPalette = Array.from(new Set(pattern.grid.filter((value) => value >= 0)));

    const shade = (hex: string, amount: number) => {
      const parts = hex.match(/\w\w/g)?.map((part) => parseInt(part, 16)) || [80, 80, 80];
      return `rgb(${parts.map((part) => Math.max(0, Math.min(255, part + amount))).join(",")})`;
    };

    const drawThread = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      hex: string,
      fraction = 1,
    ) => {
      const endX = x1 + (x2 - x1) * fraction;
      const endY = y1 + (y2 - y1) * fraction;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(45, 27, 15, .42)";
      ctx.shadowBlur = Math.max(1.2, cell * .11);
      ctx.shadowOffsetX = cell * .045;
      ctx.shadowOffsetY = cell * .075;
      ctx.strokeStyle = shade(hex, -48);
      ctx.lineWidth = Math.max(2.5, cell * .31);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      const body = ctx.createLinearGradient(x1, y1, endX, endY);
      body.addColorStop(0, shade(hex, -20));
      body.addColorStop(.38, shade(hex, 24));
      body.addColorStop(.62, hex);
      body.addColorStop(1, shade(hex, -27));
      ctx.strokeStyle = body;
      ctx.lineWidth = Math.max(2, cell * .24);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.34)";
      ctx.lineWidth = Math.max(.7, cell * .055);
      ctx.beginPath();
      ctx.moveTo(x1 + cell * .025, y1 - cell * .025);
      ctx.lineTo(endX + cell * .025, endY - cell * .025);
      ctx.stroke();
      ctx.restore();
      return { x: endX, y: endY };
    };

    const drawNeedle = (x: number, y: number, angle: number, hex: string) => {
      const length = cell * 1.12;
      const tailX = x + Math.cos(angle) * length;
      const tailY = y + Math.sin(angle) * length;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(36, 38, 36, .4)";
      ctx.shadowBlur = cell * .12;
      ctx.shadowOffsetY = cell * .08;
      const metal = ctx.createLinearGradient(x, y, tailX, tailY);
      metal.addColorStop(0, "#5e6869");
      metal.addColorStop(.35, "#ffffff");
      metal.addColorStop(.62, "#aeb8b8");
      metal.addColorStop(1, "#f9ffff");
      ctx.strokeStyle = metal;
      ctx.lineWidth = Math.max(2, cell * .18);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#5d6667";
      ctx.lineWidth = Math.max(1, cell * .055);
      ctx.beginPath();
      ctx.ellipse(tailX, tailY, cell * .11, cell * .055, angle, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = shade(hex, -18);
      ctx.lineWidth = Math.max(1.5, cell * .12);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.quadraticCurveTo(
        tailX + cell * .7,
        tailY + cell * .25,
        tailX + cell * .9,
        tailY + cell * .78,
      );
      ctx.stroke();
      ctx.restore();
    };

    const drawFrame = (animationProgress: number) => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, display, display);
      ctx.fillStyle = compact ? "#F7F1E6" : "#FBF8F0";
      ctx.fillRect(0, 0, display, display);
      if (!compact) {
        ctx.strokeStyle = "rgba(88,73,53,.12)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= pattern.size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, display);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cell);
          ctx.lineTo(display, i * cell);
          ctx.stroke();
        }
      }
      pattern.grid.forEach((colorIndex, index) => {
        if (colorIndex < 0) return;
        const x = (index % pattern.size) * cell;
        const y = Math.floor(index / pattern.size) * cell;
        const isDone = compact || !stitched || stitched.has(index);
        const color = THREADS[colorIndex];
        if (!isDone) {
          if (!compact) {
            const chartNumber = chartPalette.indexOf(colorIndex) + 1;
            const isCurrentColor = selectedColor === colorIndex;
            if (isCurrentColor) {
              ctx.fillStyle = `${color.hex}1F`;
              ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
              ctx.strokeStyle = `${color.hex}66`;
              ctx.lineWidth = 1.2;
              ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
            }
            ctx.fillStyle = isCurrentColor ? shade(color.hex, -28) : "rgba(78, 83, 77, .26)";
            ctx.font = `${isCurrentColor ? 700 : 600} ${Math.max(9, cell * .42)}px ui-monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(chartNumber), x + cell / 2, y + cell / 2);
          }
          return;
        }
        const pad = cell * .22;
        const a = { x: x + pad, y: y + pad };
        const b = { x: x + cell - pad, y: y + cell - pad };
        const c = { x: x + cell - pad, y: y + pad };
        const d = { x: x + pad, y: y + cell - pad };
        const isAnimating = !compact && index === animatedIndex && animationProgress < 1;
        if (!isAnimating) {
          drawThread(a.x, a.y, b.x, b.y, color.hex);
          drawThread(c.x, c.y, d.x, d.y, color.hex);
          return;
        }
        if (animationProgress <= .48) {
          const fraction = Math.min(1, animationProgress / .48);
          const endpoint = drawThread(a.x, a.y, b.x, b.y, color.hex, fraction);
          drawNeedle(endpoint.x, endpoint.y, -.72, color.hex);
        } else {
          drawThread(a.x, a.y, b.x, b.y, color.hex);
          const fraction = Math.min(1, (animationProgress - .48) / .52);
          const endpoint = drawThread(c.x, c.y, d.x, d.y, color.hex, fraction);
          drawNeedle(endpoint.x, endpoint.y, -.72, color.hex);
        }
      });
      if (!compact && selectedColor !== undefined) {
        ctx.strokeStyle = THREADS[selectedColor].hex;
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, display - 3, display - 3);
      }
    };

    if (compact || animatedIndex == null) {
      drawFrame(1);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 1 : 640;
    const animate = (time: number) => {
      const raw = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - raw) ** 3;
      drawFrame(eased);
      if (raw < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pattern, compact, stitched, selectedColor, animatedIndex, animationNonce, display]);

  const handlePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onStitch) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * pattern.size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * pattern.size);
    onStitch(y * pattern.size + x);
  };

  return (
    <canvas
      ref={canvasRef}
      className={compact ? "preview-canvas" : "stitch-canvas"}
      style={{ aspectRatio: "1 / 1" }}
      onPointerDown={handlePointer}
      aria-label={`${pattern.name}十字绣图纸`}
    />
  );
}

function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    if (!email.includes("@") || password.length < 6) {
      setError("请输入有效邮箱，密码至少 6 位。");
      return;
    }
    localStorage.setItem("stitch-user", email);
    onSuccess(email);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label="账号登录" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        <div className="mini-hoop"><span>×</span></div>
        <p className="eyebrow">WELCOME TO</p>
        <h2>针迹小屋</h2>
        <p className="modal-copy">保存你的图纸、配线清单与每一针进度。</p>
        <div className="auth-tabs">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>注册</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登录</button>
        </div>
        <form onSubmit={submit}>
          <label>邮箱<input name="email" type="email" placeholder="you@example.com" autoFocus /></label>
          <label>密码<input name="password" type="password" placeholder="至少 6 位" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary wide" type="submit">{mode === "register" ? "创建账号并开始" : "登录并继续"} <span>→</span></button>
        </form>
        <p className="privacy-note">不会上传密码；作品进度会与此邮箱关联并安全保存。</p>
      </section>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"upload" | "gallery" | "studio">("studio");
  const [view, setView] = useState<"home" | "gallery" | "upload" | "studio">("home");
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [selectedColor, setSelectedColor] = useState(16);
  const [stitched, setStitched] = useState<Set<number>>(() => new Set());
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);
  const [animationNonce, setAnimationNonce] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [gridSize, setGridSize] = useState(24);
  const [colorCount, setColorCount] = useState(10);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("stitch-user");
    if (saved) setUser(saved);
  }, []);

  const patternCells = useMemo(() => pattern.grid.map((v, i) => (v >= 0 ? i : -1)).filter((v) => v >= 0), [pattern]);
  const progress = patternCells.length ? Math.round((stitched.size / patternCells.length) * 100) : 0;
  const palette = useMemo(() => Array.from(new Set(pattern.grid.filter((v) => v >= 0))), [pattern]);
  const filteredPatterns = PATTERNS.filter((item) => `${item.name}${item.subtitle}`.includes(search));

  const applySavedProgress = (row: { patternJson: string; stitchedJson: string; updatedAt: number } | null, fallback?: Pattern) => {
    if (!row) {
      if (fallback) {
        setPattern(fallback);
        setSelectedColor(Array.from(new Set(fallback.grid.filter((v) => v >= 0)))[0] || 0);
      }
      setStitched(new Set());
      setSaveStatus("idle");
      setLastSavedAt(null);
      return false;
    }
    try {
      const savedPattern = JSON.parse(row.patternJson) as Pattern;
      const restoredPattern = PATTERNS.find((item) => item.id === savedPattern.id) || savedPattern;
      const restoredStitches = (JSON.parse(row.stitchedJson) as number[])
        .filter((index) => Number.isInteger(index) && index >= 0 && index < restoredPattern.grid.length);
      setPattern(restoredPattern);
      setSelectedColor(Array.from(new Set(restoredPattern.grid.filter((v) => v >= 0)))[0] || 0);
      setStitched(new Set(restoredStitches));
      setSaveStatus("saved");
      setLastSavedAt(row.updatedAt);
      return true;
    } catch {
      return false;
    }
  };

  const loadSavedProgress = async (next: Pattern) => {
    if (!user) return;
    try {
      const params = new URLSearchParams({ user, pattern: next.id });
      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) return;
      const data = await response.json() as { progress: { patternJson: string; stitchedJson: string; updatedAt: number } | null };
      applySavedProgress(data.progress, next);
    } catch {
      // The selected pattern remains usable even if cloud progress is unavailable.
    }
  };

  const resumeLatest = async (email = user) => {
    setView("studio");
    if (!email) return;
    try {
      const params = new URLSearchParams({ user: email });
      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) return;
      const data = await response.json() as { progress: { patternJson: string; stitchedJson: string; updatedAt: number } | null };
      if (applySavedProgress(data.progress)) showToast("已载入上次保存的进度");
    } catch {
      // Start with the current pattern if no saved project can be loaded.
    }
  };

  const requireUser = (action: "upload" | "gallery" | "studio") => {
    if (user) {
      if (action === "studio") void resumeLatest();
      else setView(action);
    } else {
      setPendingAction(action);
      setAuthOpen(true);
    }
  };

  const openPattern = (next: Pattern) => {
    setPattern(next);
    setSelectedColor(Array.from(new Set(next.grid.filter((v) => v >= 0)))[0] || 0);
    setStitched(new Set());
    setSaveStatus("idle");
    setLastSavedAt(null);
    setView("studio");
    void loadSavedProgress(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const stitchCell = (index: number) => {
    const target = pattern.grid[index];
    if (target < 0 || stitched.has(index)) return;
    if (target !== selectedColor) {
      showToast(`这里需要 DMC ${THREADS[target].code} · ${THREADS[target].name}`);
      return;
    }
    setStitched((current) => new Set(current).add(index));
    setSaveStatus("dirty");
    setAnimatedIndex(index);
    setAnimationNonce((current) => current + 1);
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    animationTimerRef.current = setTimeout(() => setAnimatedIndex(null), 680);
  };

  const undo = () => {
    const values = Array.from(stitched);
    if (!values.length) return;
    values.pop();
    setStitched(new Set(values));
    setSaveStatus("dirty");
  };

  const resetProgress = () => {
    setStitched(new Set());
    setSaveStatus("dirty");
    setAnimatedIndex(null);
  };

  const saveProgress = async () => {
    if (!user || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userEmail: user,
          patternId: pattern.id,
          pattern,
          stitched: Array.from(stitched),
        }),
      });
      if (!response.ok) throw new Error("save failed");
      const result = await response.json() as { savedAt: number };
      setLastSavedAt(result.savedAt);
      setSaveStatus("saved");
      showToast("当前进度已保存");
    } catch {
      setSaveStatus("error");
      showToast("保存失败，请稍后再试");
    }
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("请选择 JPG、PNG 或 WEBP 图片");
      return;
    }
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const convertUpload = () => {
    if (!uploadPreview) {
      fileRef.current?.click();
      return;
    }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = gridSize;
      canvas.height = gridSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, gridSize, gridSize);
      const scale = Math.max(gridSize / image.width, gridSize / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (gridSize - width) / 2, (gridSize - height) / 2, width, height);
      const pixels = ctx.getImageData(0, 0, gridSize, gridSize).data;
      const balancedPalette = [0, 1, 17, 16, 3, 4, 5, 7, 9, 10, 11, 13, 14, 8];
      const available = balancedPalette.slice(0, colorCount);
      const nextGrid: number[] = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
        if (a < 80 || (r > 244 && g > 244 && b > 244)) {
          nextGrid.push(-1);
          continue;
        }
        let best = available[0];
        let distance = Infinity;
        available.forEach((threadIndex) => {
          const rgb = THREADS[threadIndex].hex.match(/\w\w/g)!.map((v) => parseInt(v, 16));
          const nextDistance = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
          if (nextDistance < distance) {
            distance = nextDistance;
            best = threadIndex;
          }
        });
        nextGrid.push(best);
      }
      const uploaded: Pattern = {
        id: `upload-${Date.now()}`,
        name: uploadFileName.replace(/\.[^.]+$/, "") || "我的图纸",
        subtitle: `${gridSize} × ${gridSize} 针 · 自动匹配 DMC`,
        difficulty: gridSize <= 20 ? "入门" : gridSize <= 28 ? "轻松" : "进阶",
        size: gridSize,
        minutes: Math.round(nextGrid.filter((v) => v >= 0).length / 7),
        grid: nextGrid,
      };
      openPattern(uploaded);
    };
    image.src = uploadPreview;
  };

  const signOut = () => {
    localStorage.removeItem("stitch-user");
    setUser("");
    setView("home");
  };

  return (
    <main>
      <header className="site-header">
        <button className="brand" onClick={() => setView("home")} aria-label="回到首页">
          <span className="brand-mark"><i>×</i><i>×</i><i>×</i><i>×</i></span>
          <span><b>针迹小屋</b><small>STITCH &amp; SLOW</small></span>
        </button>
        <nav aria-label="主导航">
          <button className={view === "gallery" ? "active" : ""} onClick={() => requireUser("gallery")}>图纸库</button>
          <button className={view === "upload" ? "active" : ""} onClick={() => requireUser("upload")}>图片转图纸</button>
          <button className={view === "studio" ? "active" : ""} onClick={() => requireUser("studio")}>我的绣框</button>
        </nav>
        {user ? (
          <div className="user-menu"><span>{user.slice(0, 1).toUpperCase()}</span><button onClick={signOut}>退出</button></div>
        ) : (
          <button className="header-login" onClick={() => setAuthOpen(true)}>登录 / 注册</button>
        )}
      </header>

      {view === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">DIGITAL CROSS STITCH STUDIO</p>
              <h1>把喜欢的画面，<br />一针一针<span>留下来。</span></h1>
              <p className="hero-lead">上传一张照片，自动变成清晰的十字绣图纸。我们会匹配准确的 DMC 线号，让你只管享受慢下来的过程。</p>
              <div className="hero-actions">
                <button className="primary" onClick={() => requireUser("upload")}>上传图片制作 <span>→</span></button>
                <button className="secondary" onClick={() => requireUser("gallery")}>浏览现成图纸</button>
              </div>
              <div className="trust-row">
                <span><b>10</b> 款原创图纸</span><i />
                <span><b>18</b> 色 DMC 线库</span><i />
                <span><b>0</b> 基础也能开始</span>
              </div>
            </div>
            <div className="hero-art">
              <div className="thread-thread" />
              <div className="hoop">
                <CrossCanvas pattern={PATTERNS[0]} compact />
              </div>
              <div className="floating-note note-one"><span>●</span><b>DMC 420</b><small>榛果棕 · 84 针</small></div>
              <div className="floating-note note-two"><b>已匹配线色</b><span>✓</span></div>
              <span className="loose-x x-one">×</span><span className="loose-x x-two">×</span><span className="loose-x x-three">×</span>
            </div>
          </section>

          <section className="how">
            <div className="section-heading"><p className="eyebrow">HOW IT WORKS</p><h2>三步，开始你的第一幅作品</h2></div>
            <div className="steps">
              <article><span>01</span><i>↑</i><h3>选择一张图片</h3><p>上传自己的照片，或从原创图纸库里挑一张。</p></article>
              <article><span>02</span><i>▦</i><h3>生成图纸与配线</h3><p>自动简化色彩、生成网格，并匹配 DMC 线号。</p></article>
              <article><span>03</span><i>×</i><h3>跟着颜色落针</h3><p>选择对应线色逐格完成，选错线时会及时提醒。</p></article>
            </div>
          </section>

          <section className="collection-tease">
            <div className="section-heading left"><p className="eyebrow">CURATED PATTERNS</p><h2>从一幅小图开始</h2><p>参考传统动物、花卉与自然主题图纸，重新绘制成适合屏幕练习的原创小作品。</p></div>
            <div className="tease-grid">{PATTERNS.slice(1, 5).map((item) => <button key={item.id} onClick={() => requireUser("gallery")}><CrossCanvas pattern={item} compact /><span>{item.name}</span></button>)}</div>
          </section>
        </>
      )}

      {view === "gallery" && (
        <section className="page-shell gallery-page">
          <div className="gallery-title"><div><p className="eyebrow">PATTERN LIBRARY</p><h1>挑一幅，慢慢绣</h1><p>10 款原创像素图纸，每幅都配好对应的 DMC 线号与用线量。</p></div><label className="search">⌕<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索图纸名称" /></label></div>
          <div className="filter-row"><button className="active">全部 10</button><button>动物</button><button>花与植物</button><button>自然风景</button><button>生活小物</button></div>
          <div className="pattern-grid">
            {filteredPatterns.map((item, index) => {
              const colors = Array.from(new Set(item.grid.filter((v) => v >= 0)));
              return (
                <article className="pattern-card" key={item.id}>
                  <button className="pattern-image" onClick={() => openPattern(item)}><CrossCanvas pattern={item} compact /><span className={`difficulty d-${item.difficulty}`}>{item.difficulty}</span></button>
                  <div className="pattern-info">
                    <div><h3>{item.name}</h3><p>{item.subtitle}</p></div>
                    <button className="round-arrow" onClick={() => openPattern(item)}>→</button>
                  </div>
                  <div className="pattern-meta"><span>{item.size} × {item.size} 针</span><span>约 {item.minutes} 分钟</span><span className="mini-swatches">{colors.slice(0, 5).map((c) => <i key={c} style={{ background: THREADS[c].hex }} />)}<b>{colors.length} 色</b></span></div>
                  {index === 0 && <span className="staff-pick">小屋推荐</span>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === "upload" && (
        <section className="page-shell upload-page">
          <div className="upload-heading"><p className="eyebrow">PHOTO TO PATTERN</p><h1>让照片变成针脚</h1><p>图片只在你的浏览器中处理，不会上传到服务器。</p></div>
          <div className="upload-workbench">
            <div className={`drop-zone ${uploadPreview ? "has-image" : ""}`} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} />
              {uploadPreview ? <img src={uploadPreview} alt="待转换图片预览" /> : <><span className="upload-icon">↑</span><h2>把图片拖到这里</h2><p>或点击选择 JPG、PNG、WEBP</p><small>建议使用主体清晰、颜色对比明显的图片</small></>}
              {uploadPreview && <span className="replace-image">更换图片</span>}
            </div>
            <aside className="conversion-settings">
              <div><p className="setting-label"><b>图纸尺寸</b><span>{gridSize} × {gridSize} 针</span></p><input type="range" min="16" max="32" step="4" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} /><div className="range-labels"><span>更简单</span><span>更细致</span></div></div>
              <div><p className="setting-label"><b>颜色数量</b><span>{colorCount} 色</span></p><input type="range" min="6" max="14" step="2" value={colorCount} onChange={(e) => setColorCount(Number(e.target.value))} /><div className="range-labels"><span>更清爽</span><span>更还原</span></div></div>
              <div className="preview-palette"><b>将从 DMC 线库智能匹配</b><span>{THREADS.slice(2, 10).map((thread) => <i key={thread.code} style={{ background: thread.hex }} />)}</span><small>完成后会生成可核对的采购清单</small></div>
              <button className="primary wide" onClick={convertUpload}>{uploadPreview ? "生成十字绣图纸" : "先选择一张图片"} <span>→</span></button>
            </aside>
          </div>
          <div className="upload-tips"><span>✦</span><p><b>小提示</b> 人像可以先裁掉复杂背景；宠物照片优先选择正面或侧面轮廓清楚的画面，生成效果会更好。</p></div>
        </section>
      )}

      {view === "studio" && (
        <section className="studio-page">
          <div className="studio-topbar">
            <button className="back-link" onClick={() => setView("gallery")}>← 返回图纸库</button>
            <div><h1>{pattern.name}</h1><span>{pattern.size} × {pattern.size} 针 · {palette.length} 色</span></div>
            <div className="studio-actions">
              <span className={`save-state state-${saveStatus}`}>
                {saveStatus === "saving" && "正在保存…"}
                {saveStatus === "dirty" && "有未保存的进度"}
                {saveStatus === "saved" && `已保存${lastSavedAt ? ` · ${new Date(lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
                {saveStatus === "error" && "保存失败"}
              </span>
              <button onClick={undo}>↶ 撤销</button>
              <button onClick={resetProgress}>重置</button>
              <button className="save-progress" onClick={saveProgress} disabled={saveStatus === "saving"}>▣ 保存进度</button>
            </div>
          </div>
          <div className="studio-layout">
            <aside className="tool-rail">
              <button className="active" title="单针模式">⌁<span>单针</span></button>
              <button title="放大图纸">＋<span>放大</span></button>
            </aside>
            <div className="canvas-stage">
              <div className="canvas-paper">
                <CrossCanvas
                  pattern={pattern}
                  stitched={stitched}
                  selectedColor={selectedColor}
                  animatedIndex={animatedIndex}
                  animationNonce={animationNonce}
                  onStitch={stitchCell}
                />
              </div>
              <div className="progress-card"><div><span>今日针迹</span><b>{stitched.size} / {patternCells.length}</b></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
            </div>
            <aside className="thread-panel">
              <div className="thread-heading"><div><p className="eyebrow">THREAD BOARD</p><h2>配线板</h2></div><span>{palette.length} 色</span></div>
              <p className="thread-guide">图纸里的编号与每束线上的编号完全相同。先选线束，再绣所有被突出显示的同号格子。</p>
              <div className="match-tip" aria-label="图纸编号与配线编号对应示例">
                <span>图纸格 <b>{palette.indexOf(selectedColor) + 1}</b></span>
                <i>→</i>
                <span>配线束 <b>{palette.indexOf(selectedColor) + 1}</b></span>
              </div>
              <div className="thread-list">
                {palette.map((colorIndex, paletteIndex) => {
                  const total = pattern.grid.filter((c) => c === colorIndex).length;
                  const done = pattern.grid.filter((c, index) => c === colorIndex && stitched.has(index)).length;
                  return (
                    <button key={colorIndex} className={selectedColor === colorIndex ? "selected" : ""} onClick={() => setSelectedColor(colorIndex)}>
                      <span className="floss-bundle" style={{ "--floss": THREADS[colorIndex].hex } as React.CSSProperties}>
                        <i /><i /><i /><i /><i /><i /><i />
                        <em>{paletteIndex + 1}</em>
                        <strong />
                      </span>
                      <span className="thread-copy"><b>DMC {THREADS[colorIndex].code}</b><small>图纸编号 {paletteIndex + 1} · {THREADS[colorIndex].name}</small></span>
                      <span className="remaining">{done === total ? "完成" : `余 ${total - done}`}</span>
                    </button>
                  );
                })}
              </div>
              <div className="shopping-note"><span>✓</span><p><b>配线已核对</b><small>以上线号与图纸一一对应，购买时按 DMC 编号选择即可。</small></p></div>
            </aside>
          </div>
        </section>
      )}

      <footer><div className="brand footer-brand"><span className="brand-mark"><i>×</i><i>×</i><i>×</i><i>×</i></span><span><b>针迹小屋</b><small>STITCH &amp; SLOW</small></span></div><p>把快生活，绣得慢一点。</p><span>原创练习图纸 · DMC 配色参考</span></footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={(email) => {
        setUser(email);
        setAuthOpen(false);
        if (pendingAction === "studio") void resumeLatest(email);
        else setView(pendingAction);
      }} />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
