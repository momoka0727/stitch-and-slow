import type { WorkspaceAction, WorkspaceView } from "../pages/types";

type SiteHeaderProps = {
  user: { name: string; email: string; image?: string | null } | null;
  authPending: boolean;
  view: WorkspaceView;
  onNavigate: (action: WorkspaceAction) => void;
  onHome: () => void;
  onLogin: () => void;
  onSignOut: () => void;
};

export function SiteHeader({
  user,
  authPending,
  view,
  onNavigate,
  onHome,
  onLogin,
  onSignOut,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="回到首页">
        <span className="brand-mark">
          <i>×</i>
          <i>×</i>
          <i>×</i>
          <i>×</i>
        </span>
        <span>
          <b>针迹小屋</b>
          <small>STITCH &amp; SLOW</small>
        </span>
      </button>
      <nav aria-label="主导航">
        <button
          className={view === "gallery" ? "active" : ""}
          onClick={() => onNavigate("gallery")}
        >
          图纸库
        </button>
        <button className={view === "upload" ? "active" : ""} onClick={() => onNavigate("upload")}>
          图片转图纸
        </button>
        <button
          className={view === "projects" || view === "studio" ? "active" : ""}
          onClick={() => onNavigate("projects")}
        >
          我的绣框
        </button>
      </nav>
      {user ? (
        <div className="user-menu">
          {user.image ? (
            <img src={user.image} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span>{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
          )}
          <button onClick={onSignOut}>退出</button>
        </div>
      ) : (
        <button className="header-login" onClick={onLogin} disabled={authPending}>
          {authPending ? "正在确认…" : "使用 Google 登录"}
        </button>
      )}
    </header>
  );
}
