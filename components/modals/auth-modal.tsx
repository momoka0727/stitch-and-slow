import { useState } from "react";
import { authClient } from "../../lib/auth-client";

export function AuthModal({ callbackURL, onClose }: { callbackURL: string; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setPending(true);
    setError("");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (result.error) {
      setPending(false);
      setError("Google 登录暂时无法启动，请稍后再试。");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="使用 Google 登录"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="mini-hoop">
          <span>×</span>
        </div>
        <p className="eyebrow">WELCOME TO</p>
        <h2>针迹小屋</h2>
        <p className="modal-copy">使用 Google 安全登录，跨设备保存你的作品与每一针进度。</p>
        <button
          className="google-auth-button"
          type="button"
          disabled={pending}
          onClick={() => void signInWithGoogle()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
            />
            <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9.1L6.5 14Z" />
            <path
              fill="#EA4335"
              d="M12 6.1c1.5 0 2.8.5 3.9 1.5l2.9-2.8A9.8 9.8 0 0 0 3.1 7.5l3.4 2.7A5.9 5.9 0 0 1 12 6.1Z"
            />
          </svg>
          {pending ? "正在前往 Google…" : "使用 Google 登录"}
        </button>
        {error && <p className="form-error">{error}</p>}
        <p className="privacy-note">本站不会接触或保存你的 Google 密码。</p>
      </section>
    </div>
  );
}
