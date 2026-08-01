import type { CSSProperties } from "react";
import type { Pattern, ThreadColor } from "../../lib/validation/stitch";
import type { PatternCanvasComponent, SaveStatus } from "./types";

type StudioPageProps = {
  pattern: Pattern;
  threads: ThreadColor[];
  stitched: Set<number>;
  patternCellCount: number;
  progress: number;
  palette: number[];
  selectedColor: number;
  animatedIndex: number | null;
  animationNonce: number;
  highlightFlash: boolean;
  previewing: boolean;
  sharedFrom: string;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  Canvas: PatternCanvasComponent;
  onBack: () => void;
  onRename: (name: string) => void;
  onUndo: () => void;
  onReset: () => void;
  onFinish: () => void;
  onDownload: (background: "transparent" | "white") => void;
  onShare: () => void;
  onPreview: () => void;
  onSave: () => void;
  onStitch: (index: number) => void;
  onSelectThread: (colorIndex: number) => void;
};

export function StudioPage(props: StudioPageProps) {
  const {
    pattern,
    threads,
    stitched,
    patternCellCount,
    progress,
    palette,
    selectedColor,
    animatedIndex,
    animationNonce,
    highlightFlash,
    previewing,
    sharedFrom,
    saveStatus,
    lastSavedAt,
    Canvas,
  } = props;
  return (
    <section className="studio-page">
      <div className="studio-topbar">
        <button className="back-link" onClick={props.onBack}>
          ← 返回我的绣框
        </button>
        <div className="title-editor">
          <label>
            <input
              value={pattern.name}
              onChange={(event) => props.onRename(event.target.value)}
              disabled={Boolean(sharedFrom)}
              aria-label="作品名称"
            />
            {!sharedFrom && <i>✎</i>}
          </label>
          <span>
            {sharedFrom
              ? `来自 ${sharedFrom} 的完成作品`
              : `${pattern.completed ? "已完成" : "进行中"} · 点击名称即可修改`}{" "}
            · {pattern.size} × {pattern.size} 针 · {palette.length} 色
          </span>
        </div>
        <div className="studio-actions">
          {!sharedFrom && (
            <span className={`save-state state-${saveStatus}`}>
              {saveStatus === "saving" && "正在保存…"}
              {saveStatus === "dirty" && "有未保存的进度"}
              {saveStatus === "saved" &&
                `已保存${lastSavedAt ? ` · ${new Date(lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
              {saveStatus === "error" && "保存失败"}
            </span>
          )}
          {!sharedFrom && <button onClick={props.onUndo}>↶ 撤销</button>}
          {!sharedFrom && <button onClick={props.onReset}>重置</button>}
          {!sharedFrom && (
            <button
              className="finish-pattern"
              onClick={props.onFinish}
              disabled={saveStatus === "saving" || pattern.completed}
            >
              ✓ {pattern.completed ? "已完成" : "完成"}
            </button>
          )}
          {(pattern.completed || sharedFrom) && (
            <button onClick={() => props.onDownload("transparent")}>保存透明图</button>
          )}
          {(pattern.completed || sharedFrom) && (
            <button onClick={() => props.onDownload("white")}>保存白底图</button>
          )}
          {(pattern.completed || sharedFrom) && (
            <button className="share-button" onClick={props.onShare}>
              ✉ 分享
            </button>
          )}
          <button className="preview-button" onClick={props.onPreview}>
            ◉ {previewing ? "预览中…" : "预览成品"}
          </button>
          {!sharedFrom && (
            <button
              className="save-progress"
              onClick={props.onSave}
              disabled={saveStatus === "saving"}
            >
              ▣ 保存进度
            </button>
          )}
        </div>
      </div>
      <div className="studio-layout">
        <aside className="tool-rail">
          <button className="active" title="单针模式">
            ⌁<span>单针</span>
          </button>
          <button title="放大图纸">
            ＋<span>放大</span>
          </button>
        </aside>
        <div className="canvas-stage">
          <div className="canvas-paper">
            <Canvas
              pattern={pattern}
              stitched={previewing ? undefined : stitched}
              selectedColor={selectedColor}
              animatedIndex={animatedIndex}
              animationNonce={animationNonce}
              highlightFlash={highlightFlash}
              onStitch={previewing ? undefined : props.onStitch}
            />
            {previewing && (
              <div className="preview-notice">
                <span>◉</span>
                <b>完整成品预览</b>
                <small>3 秒后自动返回当前进度</small>
              </div>
            )}
          </div>
          <div className="progress-card">
            <div>
              <span>今日针迹</span>
              <b>
                {stitched.size} / {patternCellCount}
              </b>
            </div>
            <div className="progress-track">
              <i style={{ width: `${progress}%` }} />
            </div>
            <strong>{progress}%</strong>
          </div>
        </div>
        <aside className="thread-panel">
          <div className="thread-heading">
            <div>
              <p className="eyebrow">THREAD BOARD</p>
              <h2>配线板</h2>
            </div>
            <span>{palette.length} 色</span>
          </div>
          <p className="thread-guide">
            先在配线板选择颜色，再点击任意格子落针；无需遵循原图纸编号。拆针或撤销后会恢复该格原来的图纸标记。
          </p>
          <div className="match-tip" aria-label="自由配色提示">
            <span>
              当前线色{" "}
              <b>{pattern.colors ? selectedColor + 1 : palette.indexOf(selectedColor) + 1}</b>
            </span>
            <i>→</i>
            <span>
              任意格子 <b>✓</b>
            </span>
          </div>
          <div className="thread-list">
            {palette.map((colorIndex, paletteIndex) => {
              const total = pattern.grid.filter((color) => color === colorIndex).length;
              const done = pattern.grid.filter(
                (color, index) => color === colorIndex && stitched.has(index),
              ).length;
              const displayNumber = pattern.colors ? colorIndex + 1 : paletteIndex + 1;
              const thread = threads[colorIndex];
              if (!thread) return null;
              return (
                <button
                  key={colorIndex}
                  className={selectedColor === colorIndex ? "selected" : ""}
                  onClick={() => props.onSelectThread(colorIndex)}
                >
                  <span className="floss-bundle" style={{ "--floss": thread.hex } as CSSProperties}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <em>{displayNumber}</em>
                    <strong />
                  </span>
                  <span className="thread-copy">
                    <b>{pattern.colors ? `图色 ${displayNumber}` : `DMC ${thread.code}`}</b>
                    <small>
                      图纸编号 {displayNumber} · {thread.name}
                    </small>
                  </span>
                  <span className="remaining">
                    {done === total ? "完成" : `余 ${total - done}`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="shopping-note">
            <span>✓</span>
            <p>
              <b>{pattern.colors ? "原图配色已提取" : "配线已核对"}</b>
              <small>
                {pattern.colors
                  ? "本图不受 DMC 色库限制，请按屏幕色卡挑选最接近的线。"
                  : "以上线号与图纸一一对应，购买时按 DMC 编号选择即可。"}
              </small>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
