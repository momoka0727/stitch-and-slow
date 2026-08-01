import type { ChangeEvent, RefObject } from "react";

/* oxlint-disable next/no-img-element -- local data URLs are intentionally not sent to an optimizer. */

type UploadPageProps = {
  preview: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onChooseFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onConvert: () => void;
};

export function UploadPage({ preview, fileRef, onChooseFile, onConvert }: UploadPageProps) {
  return (
    <section className="page-shell upload-page">
      <div className="upload-heading">
        <p className="eyebrow">PHOTO TO PATTERN</p>
        <h1>让照片变成针脚</h1>
        <p>图片只在你的浏览器中处理，不会上传到服务器。</p>
      </div>
      <div className="upload-workbench">
        <div
          className={`drop-zone ${preview ? "has-image" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onChooseFile}
          />
          {preview ? (
            <img src={preview} alt="待转换图片预览" />
          ) : (
            <>
              <span className="upload-icon">↑</span>
              <h2>把图片拖到这里</h2>
              <p>或点击选择 JPG、PNG、WEBP</p>
              <small>建议使用主体清晰、颜色对比明显的图片</small>
            </>
          )}
          {preview && <span className="replace-image">更换图片</span>}
        </div>
        <aside className="conversion-settings">
          <div className="fidelity-card">
            <p className="eyebrow">FULL IMAGE CONVERSION</p>
            <h2>完整转换，直接开始</h2>
            <p>
              系统会用 80 × 80
              高清网格完整转换图片，不自动删除白色区域。转换完成后会直接进入图纸，可以马上开始绣。
            </p>
          </div>
          <div className="conversion-feature">
            <span>▦</span>
            <p>
              <b>原图自适应配色</b>
              <small>直接从图片提取主色、阴影和轮廓色。</small>
            </p>
          </div>
          <div className="conversion-feature">
            <span>○</span>
            <p>
              <b>保留所有浅色</b>
              <small>白色、米白和浅色背景都会转换为对应针脚。</small>
            </p>
          </div>
          <div className="conversion-feature">
            <span>→</span>
            <p>
              <b>无需校对</b>
              <small>生成后直接进入图纸，不增加额外编辑步骤。</small>
            </p>
          </div>
          <button className="primary wide" onClick={onConvert}>
            {preview ? "生成十字绣图纸" : "先选择一张图片"} <span>→</span>
          </button>
        </aside>
      </div>
      <div className="upload-tips">
        <span>✦</span>
        <p>
          <b>小提示</b> 图片会完整转换，包括白色背景。上传前可以先裁剪图片，只保留真正想绣的范围。
        </p>
      </div>
    </section>
  );
}
