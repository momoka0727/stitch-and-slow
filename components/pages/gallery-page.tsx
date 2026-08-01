import type { Pattern, ThreadColor } from "../../lib/validation/stitch";
import type { PatternCanvasComponent } from "./types";

type GalleryPageProps = {
  patterns: Pattern[];
  threads: ThreadColor[];
  search: string;
  Canvas: PatternCanvasComponent;
  onSearch: (value: string) => void;
  onOpenPattern: (pattern: Pattern) => void;
};

export function GalleryPage({
  patterns,
  threads,
  search,
  Canvas,
  onSearch,
  onOpenPattern,
}: GalleryPageProps) {
  return (
    <section className="page-shell gallery-page">
      <div className="gallery-title">
        <div>
          <p className="eyebrow">PATTERN LIBRARY</p>
          <h1>挑一幅，慢慢绣</h1>
          <p>10 款原创像素图纸，每幅都配好对应的 DMC 线号与用线量。</p>
        </div>
        <label className="search">
          ⌕
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索图纸名称"
          />
        </label>
      </div>
      <div className="filter-row">
        <button className="active">全部 10</button>
        <button>动物</button>
        <button>花与植物</button>
        <button>自然风景</button>
        <button>生活小物</button>
      </div>
      <div className="pattern-grid">
        {patterns.map((item, index) => {
          const colors = Array.from(new Set(item.grid.filter((value) => value >= 0)));
          return (
            <article className="pattern-card" key={item.id}>
              <button className="pattern-image" onClick={() => onOpenPattern(item)}>
                <Canvas pattern={item} compact />
                <span className={`difficulty d-${item.difficulty}`}>{item.difficulty}</span>
              </button>
              <div className="pattern-info">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.subtitle}</p>
                </div>
                <button className="round-arrow" onClick={() => onOpenPattern(item)}>
                  →
                </button>
              </div>
              <div className="pattern-meta">
                <span>
                  {item.size} × {item.size} 针
                </span>
                <span>约 {item.minutes} 分钟</span>
                <span className="mini-swatches">
                  {colors.slice(0, 5).map((color) => (
                    <i key={color} style={{ background: threads[color].hex }} />
                  ))}
                  <b>{colors.length} 色</b>
                </span>
              </div>
              {index === 0 && <span className="staff-pick">小屋推荐</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
