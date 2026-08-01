import { type FormEvent, useState } from "react";
import { STITCH_LIMITS } from "../../constants/stitch";
import { emailSchema, senderNameSchema } from "../../lib/validation/stitch";
import { getFormString } from "../../utils/form-data";

export function ShareModal({
  patternName,
  phase,
  onClose,
  onSend,
}: {
  patternName: string;
  phase: "form" | "sending" | "sent";
  onClose: () => void;
  onSend: (senderName: string, recipientEmail: string) => void;
}) {
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const senderName = getFormString(data, "senderName").trim();
    const recipientEmail = getFormString(data, "recipientEmail").trim();
    const nameResult = senderNameSchema.safeParse(senderName);
    const emailResult = emailSchema.safeParse(recipientEmail);
    if (!nameResult.success || !emailResult.success) {
      setError("请填写你的姓名和朋友的有效邮箱。");
      return;
    }
    onSend(nameResult.data, emailResult.data);
  };

  return (
    <div
      className="modal-backdrop share-backdrop"
      role="presentation"
      onMouseDown={phase === "form" ? onClose : undefined}
    >
      <section
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-label="分享完成作品"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {phase === "form" ? (
          <>
            <button className="modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
            <p className="eyebrow">SEND A STITCHED LETTER</p>
            <h2>把作品寄给朋友</h2>
            <p>发送后会打开你的邮件应用，并自动填好收件人、标题与作品链接。</p>
            <form onSubmit={submit}>
              <label>
                朋友的邮箱
                <input
                  type="email"
                  name="recipientEmail"
                  placeholder="friend@example.com"
                  autoFocus
                />
              </label>
              <label>
                你的姓名
                <input
                  type="text"
                  name="senderName"
                  placeholder="邮件会显示“来自你的姓名的邮件”"
                  maxLength={STITCH_LIMITS.senderNameLength}
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary wide" type="submit">
                放进信封并发送 <span>→</span>
              </button>
            </form>
          </>
        ) : (
          <div className={`envelope-scene ${phase}`}>
            <p className="eyebrow">
              {phase === "sending" ? "PACKING YOUR STITCHES" : "READY TO SEND"}
            </p>
            <h2>{phase === "sending" ? "正在把作品放进信封…" : "信封已经准备好"}</h2>
            <div className="letter-stack">
              <div className="stitched-letter">
                <span>× × ×</span>
                <b>{patternName}</b>
              </div>
              <div className="envelope">
                <i />
                <b>✦</b>
              </div>
            </div>
            {phase === "sent" && (
              <button className="secondary" onClick={onClose}>
                完成
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
