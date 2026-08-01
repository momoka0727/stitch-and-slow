import { type FormEvent, useState } from "react";
import { STORAGE_KEYS } from "../../constants/stitch";
import { authCredentialsSchema } from "../../lib/validation/stitch";
import { getFormString } from "../../utils/form-data";

export function AuthModal({
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
    const email = getFormString(data, "email");
    const password = getFormString(data, "password");
    const result = authCredentialsSchema.safeParse({ email, password });
    if (!result.success) {
      setError("请输入有效邮箱，密码至少 6 位。");
      return;
    }
    localStorage.setItem(STORAGE_KEYS.userEmail, result.data.email);
    onSuccess(result.data.email);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="账号登录"
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
        <p className="modal-copy">保存你的图纸、配线清单与每一针进度。</p>
        <div className="auth-tabs">
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            注册
          </button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            登录
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            邮箱
            <input name="email" type="email" placeholder="you@example.com" autoFocus />
          </label>
          <label>
            密码
            <input name="password" type="password" placeholder="至少 6 位" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary wide" type="submit">
            {mode === "register" ? "创建账号并开始" : "登录并继续"} <span>→</span>
          </button>
        </form>
        <p className="privacy-note">不会上传密码；作品进度会与此邮箱关联并安全保存。</p>
      </section>
    </div>
  );
}
