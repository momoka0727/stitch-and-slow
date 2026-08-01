import type { Pattern } from "../../lib/validation/stitch";
import type { PatternCanvasComponent, WorkspaceAction } from "./types";

type HomePageProps = {
  patterns: Pattern[];
  Canvas: PatternCanvasComponent;
  onNavigate: (action: WorkspaceAction) => void;
};

export function HomePage({ patterns, Canvas, onNavigate }: HomePageProps) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DIGITAL CROSS STITCH STUDIO</p>
          <h1>
            把喜欢的画面，
            <br />
            一针一针<span>留下来。</span>
          </h1>
          <p className="hero-lead">
            上传一张照片，自动变成高清十字绣图纸。图片转换会直接提取原图颜色、保留轮廓内的白色；现成图纸则继续提供准确的
            DMC 线号。
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate("upload")}>
              上传图片制作 <span>→</span>
            </button>
            <button className="secondary" onClick={() => onNavigate("gallery")}>
              浏览现成图纸
            </button>
          </div>
          <div className="trust-row">
            <span>
              <b>10</b> 款原创图纸
            </span>
            <i />
            <span>
              <b>主色</b> 智能提取
            </span>
            <i />
            <span>
              <b>0</b> 基础也能开始
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="thread-thread" />
          <div className="hoop">
            <Canvas pattern={patterns[0]} compact />
          </div>
          <div className="floating-note note-one">
            <span>●</span>
            <b>DMC 420</b>
            <small>榛果棕 · 84 针</small>
          </div>
          <div className="floating-note note-two">
            <b>已匹配线色</b>
            <span>✓</span>
          </div>
          <span className="loose-x x-one">×</span>
          <span className="loose-x x-two">×</span>
          <span className="loose-x x-three">×</span>
        </div>
      </section>
      <section className="how">
        <div className="section-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>三步，开始你的第一幅作品</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <i>↑</i>
            <h3>选择一张图片</h3>
            <p>上传自己的照片，或从原创图纸库里挑一张。</p>
          </article>
          <article>
            <span>02</span>
            <i>▦</i>
            <h3>生成图纸与配线</h3>
            <p>用高清网格提取原图颜色，并智能识别背景与内部白色。</p>
          </article>
          <article>
            <span>03</span>
            <i>×</i>
            <h3>按自己的方式落针</h3>
            <p>选择喜欢的线色逐格完成，也可以随时改色和撤销。</p>
          </article>
        </div>
      </section>
      <section className="collection-tease">
        <div className="section-heading left">
          <p className="eyebrow">CURATED PATTERNS</p>
          <h2>从一幅小图开始</h2>
          <p>参考传统动物、花卉与自然主题图纸，重新绘制成适合屏幕练习的原创小作品。</p>
        </div>
        <div className="tease-grid">
          {patterns.slice(1, 5).map((item) => (
            <button key={item.id} onClick={() => onNavigate("gallery")}>
              <Canvas pattern={item} compact />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
