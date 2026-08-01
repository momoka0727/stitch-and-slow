import {
  parseJson,
  patternSchema,
  stitchedIndicesSchema,
  type SavedProjectRow,
} from "../../lib/validation/stitch";
import type { PatternCanvasComponent, WorkspaceAction } from "./types";

type ProjectsPageProps = {
  projects: SavedProjectRow[];
  loading: boolean;
  Canvas: PatternCanvasComponent;
  onNavigate: (action: WorkspaceAction) => void;
  onOpenProject: (row: SavedProjectRow) => void;
};

export function ProjectsPage({
  projects,
  loading,
  Canvas,
  onNavigate,
  onOpenProject,
}: ProjectsPageProps) {
  return (
    <section className="page-shell projects-page">
      <div className="projects-heading">
        <div>
          <p className="eyebrow">MY STITCHING SHELF</p>
          <h1>我的绣框</h1>
          <p>开始落下第一针后，作品会自动保存在这里。</p>
        </div>
        <div>
          <button className="secondary" onClick={() => onNavigate("gallery")}>
            挑选新图纸
          </button>
          <button className="primary" onClick={() => onNavigate("upload")}>
            上传图片 <span>→</span>
          </button>
        </div>
      </div>
      {loading ? (
        <div className="projects-empty">
          <span>⌛</span>
          <h2>正在整理你的作品…</h2>
        </div>
      ) : projects.length ? (
        <div className="projects-grid">
          {projects.map((row) => {
            const savedPattern = parseJson(row.patternJson, patternSchema);
            const savedStitches = parseJson(row.stitchedJson, stitchedIndicesSchema);
            if (!savedPattern || !savedStitches) return null;
            const total = savedPattern.grid.filter((value) => value >= 0).length;
            const percent = total
              ? Math.min(100, Math.round((savedStitches.length / total) * 100))
              : 0;
            const isComplete = Boolean(savedPattern.completed);
            return (
              <article className="project-card" key={row.id}>
                <button className="project-preview" onClick={() => onOpenProject(row)}>
                  <Canvas pattern={savedPattern} compact />
                  <span className={isComplete ? "complete" : ""}>
                    {isComplete ? "已完成" : `${percent}%`}
                  </span>
                </button>
                <div className="project-card-copy">
                  <h2>{savedPattern.name}</h2>
                  <p>
                    {savedPattern.size} × {savedPattern.size} 针 ·{" "}
                    {new Set(savedPattern.grid.filter((value) => value >= 0)).size} 色
                  </p>
                  <div className="project-progress">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <small>上次保存 {new Date(row.updatedAt).toLocaleDateString("zh-CN")}</small>
                  <button onClick={() => onOpenProject(row)}>
                    {isComplete ? "查看成品" : "继续绣"} →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="projects-empty">
          <span>×</span>
          <h2>这里还没有作品</h2>
          <p>从图纸库选择一幅，或上传自己的图片，落下第一针后就会自动保存。</p>
          <button className="primary" onClick={() => onNavigate("gallery")}>
            开始第一幅作品 <span>→</span>
          </button>
        </div>
      )}
    </section>
  );
}
