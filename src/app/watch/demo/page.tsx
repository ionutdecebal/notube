"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOCK_VIDEOS } from "@/lib/mock-data";
import {
  addSkipEvent,
  getDemoState,
  hydrateDemoStateFromServer,
  isWatchCompleted,
  saveWatchProgress,
} from "@/lib/session-storage";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => {
        destroy: () => void;
        getCurrentTime: () => number;
        getDuration: () => number;
      };
      PlayerState: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const extractYouTubeVideoId = (videoId: string, videoUrl: string): string | null => {
  const raw = videoId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const fromWatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (fromWatch?.[1]) return fromWatch[1];

  const fromShort = videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (fromShort?.[1]) return fromShort[1];

  const fromEmbed = videoUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (fromEmbed?.[1]) return fromEmbed[1];

  return null;
};

export default function WatchDemoPage() {
  return (
    <Suspense fallback={<WatchPageFallback />}>
      <WatchDemoContent />
    </Suspense>
  );
}

function WatchDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"transcript" | "notes">("transcript");
  const [state, setState] = useState(() => getDemoState());
  const playerRootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<{
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
  } | null>(null);
  const [watchStats, setWatchStats] = useState(() => getDemoState().watchProgress);
  const completed = watchStats.watchCompletedAt !== null || isWatchCompleted();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (!sessionId || sessionId === state.session.id) return;
    void hydrateDemoStateFromServer(sessionId).then((next) => {
      if (next) {
        setState(next);
        setWatchStats(next.watchProgress);
      }
    });
  }, [sessionId, state.session.id]);

  const video =
    state.videoCandidates.find((item) => item.id === state.session.selectedVideoId) ??
    state.videoCandidates[0] ??
    MOCK_VIDEOS[0];
  const embedId = extractYouTubeVideoId(video.id, video.videoUrl);

  useEffect(() => {
    if (!embedId || !playerRootRef.current) return;

    const mountPlayer = () => {
      if (!window.YT || !playerRootRef.current) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(playerRootRef.current, {
        videoId: embedId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onStateChange: (event) => {
            if (window.YT && event.data === window.YT.PlayerState.ENDED) {
              const duration = playerRef.current?.getDuration() ?? 0;
              if (duration > 0) {
                saveWatchProgress(duration, duration);
                setWatchStats(getDemoState().watchProgress);
              }
              router.push(`/think/demo?sessionId=${encodeURIComponent(getDemoState().session.id)}`);
            }
          },
        },
      });
    };

    if (window.YT) {
      mountPlayer();
      return () => {
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      mountPlayer();
    };

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [embedId, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = playerRef.current;
      if (!current) return;
      const watchedSeconds = Number(current.getCurrentTime().toFixed(1));
      const durationSeconds = Number(current.getDuration().toFixed(1));
      if (durationSeconds <= 0) return;
      saveWatchProgress(watchedSeconds, durationSeconds);
      setWatchStats(getDemoState().watchProgress);
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const watchedPercent =
    watchStats.durationSeconds > 0
      ? Math.min(100, (watchStats.watchedSeconds / watchStats.durationSeconds) * 100)
      : 0;

  return (
    <PageShell title="Watch" description="No recommendations. No feed. Just the lesson.">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">{video.title}</h2>

        {embedId ? (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div ref={playerRootRef} className="aspect-video w-full" />
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
            <p>Could not build an embeddable video URL for this lesson.</p>
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-zinc-200 underline underline-offset-2 hover:text-zinc-100"
            >
              Open on YouTube
            </a>
          </div>
        )}

        <div className="space-y-3">
          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-sm">
            <button
              className={`rounded-lg px-3 py-1.5 ${tab === "transcript" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}
              onClick={() => setTab("transcript")}
            >
              Transcript
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 ${tab === "notes" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}
              onClick={() => setTab("notes")}
            >
              Notes
            </button>
          </div>

          <p className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-300">
            {tab === "transcript"
              ? "Transcript placeholder: key explanations and examples from the lesson will appear here."
              : "Notes placeholder: learner notes can be captured here in a later iteration."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Watch progress</span>
            <span>{watchedPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-zinc-200 transition-[width]" style={{ width: `${watchedPercent}%` }} />
          </div>
          <p className="text-xs text-zinc-500">
            Continue unlocks at 85% watched, or immediately when the video ends.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() =>
              router.push(`/think/demo?sessionId=${encodeURIComponent(getDemoState().session.id)}`)
            }
            className="w-full sm:w-auto"
            disabled={!completed}
          >
            Continue to think mode
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              addSkipEvent({
                sessionId: getDemoState().session.id,
                stage: "watch",
                reason: "User skipped during watch",
              });
              router.push(`/session/demo?sessionId=${encodeURIComponent(getDemoState().session.id)}`);
            }}
          >
            Simulate skip
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

function WatchPageFallback() {
  return (
    <PageShell title="Watch" description="No recommendations. No feed. Just the lesson.">
      <p className="text-sm text-zinc-400">Loading video session...</p>
    </PageShell>
  );
}
