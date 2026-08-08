import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { authClient } from "../../lib/auth-client";
import { TurnstileWidget } from "../auth/turnstile-widget";

type Mode = "login" | "register";
type Operation = "idle" | "google" | "login" | "send-code" | "register";

export function AuthModal({ callbackURL, onClose }: { callbackURL: string; onClose: () => void }) {
  const titleId = useId();
  const loginTabId = useId();
  const registerTabId = useId();
  const panelId = useId();
  const modalRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [registerStep, setRegisterStep] = useState<"details" | "code">("details");
  const [operation, setOperation] = useState<Operation>("idle");
  const [siteKey, setSiteKey] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const pending = operation !== "idle";
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - clock) / 1000));

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstInputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  useEffect(() => firstInputRef.current?.focus(), [mode, registerStep]);

  useEffect(() => {
    if (!resendAvailableAt) return;
    const updateClock = () => {
      const now = Date.now();
      setClock(now);
      if (now >= resendAvailableAt) setResendAvailableAt(0);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  useEffect(() => {
    void fetch("/api/auth/email/config", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const data = (await response.json()) as { turnstileSiteKey?: string; error?: string };
        if (!response.ok || !data.turnstileSiteKey) throw new Error(data.error);
        setSiteKey(data.turnstileSiteKey);
      })
      .catch(() => setError("邮箱登录配置暂时不可用，仍可使用 Google 登录。"));
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaResetKey((value) => value + 1);
  }, []);

  const turnstileError = useCallback(() => {
    setError("人机验证加载失败，请刷新后重试。某些内容拦截扩展可能会阻止验证组件。");
  }, []);

  const completeAuthentication = () => window.location.assign(callbackURL);

  const signInWithGoogle = async () => {
    setOperation("google");
    setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL });
    if (result.error) {
      setOperation("idle");
      setError("Google 登录暂时无法启动，请稍后再试。");
    }
  };

  const signInWithEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!captchaToken) return setError("请先完成人机验证。");
    setOperation("login");
    const result = await authClient.signIn.email(
      { email: email.trim(), password, callbackURL },
      { headers: { "x-captcha-response": captchaToken } },
    );
    if (result.error) {
      setOperation("idle");
      resetCaptcha();
      setError("邮箱或密码不正确，或人机验证已过期。");
      return;
    }
    completeAuthentication();
  };

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) return setError("密码至少需要 8 个字符。");
    if (password !== confirmPassword) return setError("两次输入的密码不一致。");
    if (resendSeconds > 0) return setError(`请在 ${resendSeconds} 秒后重新发送。`);
    if (!captchaToken) return setError("请先完成人机验证。");
    setOperation("send-code");
    try {
      const response = await fetch("/api/auth/email/code", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-captcha-response": captchaToken,
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await response.json()) as { challengeId?: string; error?: string };
      if (!response.ok || !result.challengeId) throw new Error(result.error || "验证码发送失败");
      setChallengeId(result.challengeId);
      setRegisterStep("code");
      setResendAvailableAt(Date.now() + 60_000);
      setNotice("验证码已发送，请在 10 分钟内完成注册。");
      resetCaptcha();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "验证码发送失败");
      resetCaptcha();
    } finally {
      setOperation("idle");
    }
  };

  const register = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("请输入 6 位验证码。");
    if (!captchaToken) return setError("请先完成人机验证。");
    setOperation("register");
    try {
      const response = await fetch("/api/auth/email/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-captcha-response": captchaToken,
        },
        body: JSON.stringify({ name, email: email.trim(), password, code, challengeId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "注册失败");
      completeAuthentication();
    } catch (requestError) {
      setOperation("idle");
      resetCaptcha();
      setError(requestError instanceof Error ? requestError.message : "注册失败");
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setRegisterStep("details");
    setChallengeId("");
    setCode("");
    setError(siteKey ? "" : "邮箱登录配置暂时不可用，仍可使用 Google 登录。");
    setNotice("");
    resetCaptcha();
  };

  const onTabKeyDown = (event: ReactKeyboardEvent, currentMode: Mode) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextMode = currentMode === "login" ? "register" : "login";
    switchMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById(nextMode === "login" ? loginTabId : registerTabId)?.focus();
    });
  };

  const captchaAction =
    mode === "login"
      ? "email-login"
      : registerStep === "details"
        ? "email-signup-send"
        : "email-signup";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !pending && onClose()}>
      <section
        ref={modalRef}
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="关闭" disabled={pending}>
          ×
        </button>
        <div className="mini-hoop" aria-hidden="true">
          <span>×</span>
        </div>
        <p className="eyebrow">WELCOME TO</p>
        <h2 id={titleId}>针迹小屋</h2>
        <p className="modal-copy">登录后可跨设备保存作品与每一针进度。</p>

        <div className="auth-tabs" role="tablist" aria-label="邮箱认证方式">
          <button
            id={loginTabId}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            aria-controls={panelId}
            tabIndex={mode === "login" ? 0 : -1}
            onClick={() => switchMode("login")}
            onKeyDown={(event) => onTabKeyDown(event, "login")}
            disabled={pending}
          >
            登录
          </button>
          <button
            id={registerTabId}
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            aria-controls={panelId}
            tabIndex={mode === "register" ? 0 : -1}
            onClick={() => switchMode("register")}
            onKeyDown={(event) => onTabKeyDown(event, "register")}
            disabled={pending}
          >
            注册
          </button>
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={mode === "login" ? loginTabId : registerTabId}
        >
          {mode === "login" ? (
            <form className="auth-form" onSubmit={(event) => void signInWithEmail(event)}>
              <label>
                邮箱
                <input
                  ref={firstInputRef}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label>
                密码
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                />
              </label>
              {siteKey && (
                <TurnstileWidget
                  siteKey={siteKey}
                  action={captchaAction}
                  resetKey={captchaResetKey}
                  onToken={setCaptchaToken}
                  onError={turnstileError}
                />
              )}
              <button className="email-auth-button" type="submit" disabled={pending || !siteKey}>
                {operation === "login" ? "正在登录…" : "使用邮箱登录"}
              </button>
            </form>
          ) : registerStep === "details" ? (
            <form className="auth-form" onSubmit={(event) => void sendCode(event)}>
              <label>
                昵称
                <input
                  ref={firstInputRef}
                  autoComplete="name"
                  required
                  maxLength={64}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label>
                邮箱
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label>
                密码
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label>
                确认密码
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={pending}
                />
              </label>
              {siteKey && (
                <TurnstileWidget
                  siteKey={siteKey}
                  action={captchaAction}
                  resetKey={captchaResetKey}
                  onToken={setCaptchaToken}
                  onError={turnstileError}
                />
              )}
              <button
                className="email-auth-button"
                type="submit"
                disabled={pending || !siteKey || resendSeconds > 0}
              >
                {operation === "send-code"
                  ? "正在发送…"
                  : resendSeconds > 0
                    ? `${resendSeconds} 秒后可重新发送`
                    : "发送注册验证码"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={(event) => void register(event)}>
              <p className="auth-email-summary">
                验证码已发送至 <strong>{email}</strong>
              </p>
              <label>
                验证码
                <input
                  ref={firstInputRef}
                  className="verification-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={pending}
                />
              </label>
              {siteKey && (
                <TurnstileWidget
                  siteKey={siteKey}
                  action={captchaAction}
                  resetKey={captchaResetKey}
                  onToken={setCaptchaToken}
                  onError={turnstileError}
                />
              )}
              <button className="email-auth-button" type="submit" disabled={pending || !siteKey}>
                {operation === "register" ? "正在注册…" : "完成注册"}
              </button>
              <button
                className="auth-back-button"
                type="button"
                disabled={pending}
                onClick={() => {
                  setRegisterStep("details");
                  setCode("");
                  setChallengeId("");
                  setNotice("");
                  resetCaptcha();
                }}
              >
                返回修改信息
              </button>
            </form>
          )}
        </div>

        {notice && (
          <p className="form-notice" aria-live="polite">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="auth-divider">
          <span>或</span>
        </div>
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
          {operation === "google" ? "正在前往 Google…" : "使用 Google 登录"}
        </button>
        <p className="privacy-note">
          验证码和人机验证令牌只用于保护本次注册；密码由认证服务安全散列保存。
        </p>
      </section>
    </div>
  );
}
