"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STITCH_LIMITS, STITCH_TIMINGS } from "../constants/stitch";
import { PATTERNS } from "../constants/patterns";
import { THREADS } from "../constants/threads";
import {
  createShare,
  getProgress,
  getProjects,
  getShare,
  saveProgress as saveProgressRequest,
} from "../lib/api/stitch-client";
import {
  parseJson,
  patternSchema,
  stitchedIndicesSchema,
  type Pattern,
  type SavedProjectRow,
} from "../lib/validation/stitch";
import { downloadPatternImage } from "../utils/download-pattern";
import { convertImageToPattern } from "../utils/image-conversion";
import { authClient } from "../lib/auth-client";
import { SiteFooter } from "./layout/site-footer";
import { SiteHeader } from "./layout/site-header";
import { AuthModal } from "./modals/auth-modal";
import { ShareModal } from "./modals/share-modal";
import { GalleryPage } from "./pages/gallery-page";
import { HomePage } from "./pages/home-page";
import { ProjectsPage } from "./pages/projects-page";
import { StudioPage } from "./pages/studio-page";
import { UploadPage } from "./pages/upload-page";
import { CrossCanvas } from "./pattern/cross-canvas";

export function StitchApp() {
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const user = authSession?.user ?? null;
  const userId = user?.id ?? "";
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"upload" | "gallery" | "studio" | "projects">(
    "projects",
  );
  const [view, setView] = useState<"home" | "gallery" | "upload" | "studio" | "projects">("home");
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [selectedColor, setSelectedColor] = useState(16);
  const [stitched, setStitched] = useState<Set<number>>(() => new Set());
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);
  const [animationNonce, setAnimationNonce] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    "idle",
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [projects, setProjects] = useState<SavedProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePhase, setSharePhase] = useState<"form" | "sending" | "sent">("form");
  const [highlightFlash, setHighlightFlash] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sharedFrom, setSharedFrom] = useState("");
  const [toast, setToast] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const shareId = new URLSearchParams(window.location.search).get("share");
    if (shareId) {
      void getShare(shareId)
        .then((share) => {
          if (!share) return;
          const sharedPattern = parseJson(share.patternJson, patternSchema);
          if (!sharedPattern) throw new Error("Invalid shared pattern");
          setPattern(sharedPattern);
          setSelectedColor(
            Array.from(new Set(sharedPattern.grid.filter((value) => value >= 0)))[0] || 0,
          );
          const sharedStitches =
            sharedPattern.completedStitches?.filter(
              (index) => Number.isInteger(index) && index >= 0 && index < sharedPattern.grid.length,
            ) ||
            sharedPattern.grid
              .map((value, index) => (value >= 0 ? index : -1))
              .filter((index) => index >= 0);
          setStitched(new Set(sharedStitches));
          setSharedFrom(share.senderName);
          setSaveStatus("saved");
          setView("studio");
        })
        .catch(() => setToast("这个分享链接暂时无法打开"));
    }
  }, []);

  const patternCells = useMemo(
    () => pattern.grid.map((v, i) => (v >= 0 ? i : -1)).filter((v) => v >= 0),
    [pattern],
  );
  const progress = patternCells.length
    ? Math.round((stitched.size / patternCells.length) * 100)
    : 0;
  const palette = useMemo(() => {
    const used = Array.from(new Set(pattern.grid.filter((v) => v >= 0)));
    return pattern.colors ? used.sort((a, b) => a - b) : used;
  }, [pattern]);
  const activeThreads = pattern.colors || THREADS;
  const filteredPatterns = PATTERNS.filter((item) =>
    `${item.name}${item.subtitle}`.includes(search),
  );

  const applySavedProgress = (
    row: { patternJson: string; stitchedJson: string; updatedAt: number } | null,
    fallback?: Pattern,
  ) => {
    if (!row) {
      if (fallback) {
        setPattern(fallback);
        setSelectedColor(Array.from(new Set(fallback.grid.filter((v) => v >= 0)))[0] || 0);
      }
      setStitched(new Set());
      setSaveStatus("idle");
      setLastSavedAt(null);
      return false;
    }
    try {
      const savedPattern = parseJson(row.patternJson, patternSchema);
      const savedStitches = parseJson(row.stitchedJson, stitchedIndicesSchema);
      if (!savedPattern || !savedStitches) return false;
      const builtInOriginal = PATTERNS.find((item) => item.id === savedPattern.id)?.grid;
      // Keep the exact saved grid so user-selected replacement colors survive reopening.
      const restoredPattern = {
        ...savedPattern,
        completed: Boolean(savedPattern.completed),
        originalGrid:
          savedPattern.originalGrid?.length === savedPattern.grid.length
            ? [...savedPattern.originalGrid]
            : builtInOriginal?.length === savedPattern.grid.length
              ? [...builtInOriginal]
              : [...savedPattern.grid],
      };
      const restoredStitches = savedStitches.filter(
        (index) => index < restoredPattern.grid.length && restoredPattern.grid[index] >= 0,
      );
      setPattern(restoredPattern);
      setSelectedColor(Array.from(new Set(restoredPattern.grid.filter((v) => v >= 0)))[0] || 0);
      setStitched(new Set(restoredStitches));
      setSaveStatus("saved");
      setLastSavedAt(row.updatedAt);
      return true;
    } catch {
      return false;
    }
  };

  const loadSavedProgress = async (next: Pattern) => {
    if (!user) return;
    try {
      const progress = await getProgress(next.id);
      applySavedProgress(progress, next);
    } catch {
      // The selected pattern remains usable even if cloud progress is unavailable.
    }
  };

  const resumeLatest = async () => {
    setView("studio");
    if (!user) return;
    try {
      const progress = await getProgress();
      if (applySavedProgress(progress)) showToast("已载入上次保存的进度");
    } catch {
      // Start with the current pattern if no saved project can be loaded.
    }
  };

  const loadProjects = async () => {
    if (!user) return;
    setProjectsLoading(true);
    try {
      setProjects(await getProjects());
    } catch {
      showToast("作品库暂时无法载入");
    } finally {
      setProjectsLoading(false);
    }
  };

  const openSavedProject = (row: SavedProjectRow) => {
    if (applySavedProgress(row)) {
      setSharedFrom("");
      setView("studio");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const requireUser = (action: "upload" | "gallery" | "studio" | "projects") => {
    if (user) {
      if (action === "studio") void resumeLatest();
      else if (action === "projects") {
        setView("projects");
        void loadProjects();
      } else setView(action);
    } else {
      setPendingAction(action);
      setAuthOpen(true);
    }
  };

  useEffect(() => {
    if (authPending || !userId) return;
    const url = new URL(window.location.href);
    const requestedView = url.searchParams.get("view");
    if (!requestedView || !["upload", "gallery", "studio", "projects"].includes(requestedView)) {
      return;
    }
    url.searchParams.delete("view");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    requireUser(requestedView as "upload" | "gallery" | "studio" | "projects");
    // The callback query is consumed once; rerenders cannot repeat this navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authPending, userId]);

  const openPattern = (next: Pattern) => {
    const preparedPattern = {
      ...next,
      grid: [...next.grid],
      originalGrid:
        next.originalGrid?.length === next.grid.length ? [...next.originalGrid] : [...next.grid],
      completed: false,
      completedStitches: undefined,
    };
    setPattern(preparedPattern);
    setSelectedColor(Array.from(new Set(next.grid.filter((v) => v >= 0)))[0] || 0);
    setStitched(new Set());
    setSaveStatus("idle");
    setLastSavedAt(null);
    setSharedFrom("");
    setPreviewing(false);
    setView("studio");
    void loadSavedProgress(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), STITCH_TIMINGS.toastMs);
  }, []);

  const stitchCell = (index: number) => {
    if (sharedFrom || !activeThreads[selectedColor]) return;
    if (stitched.has(index)) {
      setPattern((current) => {
        const original = current.originalGrid?.[index];
        if (original === undefined || current.grid[index] === original) {
          return { ...current, completed: false, completedStitches: undefined };
        }
        const grid = [...current.grid];
        grid[index] = original;
        return { ...current, grid, completed: false, completedStitches: undefined };
      });
      setStitched((current) => {
        const next = new Set(current);
        next.delete(index);
        return next;
      });
      setAnimatedIndex(null);
      setSaveStatus("dirty");
      return;
    }
    setPattern((current) => {
      const originalGrid =
        current.originalGrid?.length === current.grid.length
          ? current.originalGrid
          : [...current.grid];
      if (current.grid[index] === selectedColor && current.originalGrid) {
        return { ...current, completed: false, completedStitches: undefined };
      }
      const grid = [...current.grid];
      grid[index] = selectedColor;
      return { ...current, grid, originalGrid, completed: false, completedStitches: undefined };
    });
    setStitched((current) => new Set(current).add(index));
    setSaveStatus("dirty");
    setAnimatedIndex(index);
    setAnimationNonce((current) => current + 1);
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    animationTimerRef.current = setTimeout(
      () => setAnimatedIndex(null),
      STITCH_TIMINGS.stitchAnimationMs,
    );
  };

  const selectThread = (colorIndex: number) => {
    setSelectedColor(colorIndex);
    setHighlightFlash(false);
    window.requestAnimationFrame(() => setHighlightFlash(true));
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(
      () => setHighlightFlash(false),
      STITCH_TIMINGS.threadHighlightMs,
    );
  };

  const previewFinishedPattern = () => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setAnimatedIndex(null);
    setPreviewing(true);
    previewTimerRef.current = setTimeout(() => setPreviewing(false), STITCH_TIMINGS.previewMs);
  };

  const undo = () => {
    const values = Array.from(stitched);
    if (!values.length) return;
    const index = values.pop();
    if (index !== undefined) {
      setPattern((current) => {
        const original = current.originalGrid?.[index];
        if (original === undefined || current.grid[index] === original) {
          return { ...current, completed: false, completedStitches: undefined };
        }
        const grid = [...current.grid];
        grid[index] = original;
        return { ...current, grid, completed: false, completedStitches: undefined };
      });
    }
    setStitched(new Set(values));
    setSaveStatus("dirty");
  };

  const resetProgress = () => {
    setPattern((current) =>
      current.originalGrid?.length === current.grid.length
        ? {
            ...current,
            grid: [...current.originalGrid],
            completed: false,
            completedStitches: undefined,
          }
        : { ...current, completed: false, completedStitches: undefined },
    );
    setStitched(new Set());
    setSaveStatus("dirty");
    setAnimatedIndex(null);
  };

  const persistProgress = useCallback(
    async (
      silent = false,
      patternToSave = pattern,
      stitchesToSave = stitched,
      successMessage = "当前进度已保存",
    ) => {
      if (!user || saveStatus === "saving" || sharedFrom) return false;
      setSaveStatus("saving");
      try {
        const result = await saveProgressRequest({
          patternId: patternToSave.id,
          pattern: patternToSave,
          stitched: Array.from(stitchesToSave),
        });
        setLastSavedAt(result.savedAt);
        setSaveStatus("saved");
        if (!silent) showToast(successMessage);
        return true;
      } catch {
        setSaveStatus("error");
        if (!silent) showToast("保存失败，请稍后再试");
        return false;
      }
    },
    [pattern, saveStatus, sharedFrom, showToast, stitched, user],
  );

  const saveProgress = () => void persistProgress(false);

  const finishPattern = () => {
    const completedPattern = {
      ...pattern,
      originalGrid: [...pattern.grid],
      completed: true,
      completedStitches: Array.from(stitched),
    };
    setPattern(completedPattern);
    void persistProgress(false, completedPattern, stitched, "作品已完成，图纸标记已保存");
  };

  useEffect(() => {
    if (saveStatus !== "dirty" || !user || view !== "studio" || sharedFrom) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(
      () => void persistProgress(true),
      STITCH_TIMINGS.autoSaveMs,
    );
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [persistProgress, saveStatus, sharedFrom, user, view]);

  const renamePattern = (name: string) => {
    setPattern((current) => ({
      ...current,
      name: name.slice(0, STITCH_LIMITS.patternNameLength),
    }));
    setSaveStatus("dirty");
  };

  const downloadFinished = (background: "transparent" | "white") => {
    if (!pattern.completed && !sharedFrom) {
      showToast("请先将作品标记为完成");
      return;
    }
    downloadPatternImage(pattern, stitched, activeThreads, background, () =>
      showToast(`已保存${background === "white" ? "白底" : "透明底"}成品图`),
    );
  };

  const openShare = () => {
    if (!pattern.completed && !sharedFrom) {
      showToast("请先将作品标记为完成");
      return;
    }
    setSharePhase("form");
    setShareOpen(true);
  };

  const sendShare = async (senderName: string, recipientEmail: string) => {
    setSharePhase("sending");
    try {
      const result = await createShare({ senderName, recipientEmail, pattern });
      const shareUrl = `${window.location.origin}/?share=${encodeURIComponent(result.id)}`;
      const subject = `来自${senderName}的邮件`;
      const body = `${senderName}送给你一幅已经完成的十字绣《${pattern.name}》。\n\n打开作品：${shareUrl}`;
      window.setTimeout(() => {
        setSharePhase("sent");
        window.location.href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }, STITCH_TIMINGS.shareMailDelayMs);
    } catch {
      setSharePhase("form");
      showToast("分享链接创建失败，请稍后再试");
    }
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("请选择 JPG、PNG 或 WEBP 图片");
      return;
    }
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const convertUpload = async () => {
    if (!uploadPreview) {
      fileRef.current?.click();
      return;
    }
    try {
      openPattern(await convertImageToPattern(uploadPreview, uploadFileName));
    } catch {
      showToast("图片转换失败，请尝试其他图片");
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setProjects([]);
    setView("home");
  };

  return (
    <main>
      <SiteHeader
        user={user}
        authPending={authPending}
        view={view}
        onNavigate={requireUser}
        onHome={() => setView("home")}
        onLogin={() => {
          setPendingAction("projects");
          setAuthOpen(true);
        }}
        onSignOut={() => void signOut()}
      />

      {view === "home" && (
        <HomePage patterns={PATTERNS} Canvas={CrossCanvas} onNavigate={requireUser} />
      )}
      {view === "gallery" && (
        <GalleryPage
          patterns={filteredPatterns}
          threads={THREADS}
          search={search}
          Canvas={CrossCanvas}
          onSearch={setSearch}
          onOpenPattern={openPattern}
        />
      )}
      {view === "upload" && (
        <UploadPage
          preview={uploadPreview}
          fileRef={fileRef}
          onChooseFile={chooseFile}
          onConvert={convertUpload}
        />
      )}
      {view === "projects" && (
        <ProjectsPage
          projects={projects}
          loading={projectsLoading}
          Canvas={CrossCanvas}
          onNavigate={(action) => setView(action)}
          onOpenProject={openSavedProject}
        />
      )}
      {view === "studio" && (
        <StudioPage
          pattern={pattern}
          threads={activeThreads}
          stitched={stitched}
          patternCellCount={patternCells.length}
          progress={progress}
          palette={palette}
          selectedColor={selectedColor}
          animatedIndex={animatedIndex}
          animationNonce={animationNonce}
          highlightFlash={highlightFlash}
          previewing={previewing}
          sharedFrom={sharedFrom}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          Canvas={CrossCanvas}
          onBack={() => (user ? requireUser("projects") : setView("home"))}
          onRename={renamePattern}
          onUndo={undo}
          onReset={resetProgress}
          onFinish={finishPattern}
          onDownload={downloadFinished}
          onShare={openShare}
          onPreview={previewFinishedPattern}
          onSave={saveProgress}
          onStitch={stitchCell}
          onSelectThread={selectThread}
        />
      )}

      <SiteFooter />

      {shareOpen && (
        <ShareModal
          patternName={pattern.name}
          phase={sharePhase}
          onClose={() => setShareOpen(false)}
          onSend={sendShare}
        />
      )}
      {authOpen && (
        <AuthModal
          callbackURL={`/?view=${encodeURIComponent(pendingAction)}`}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
