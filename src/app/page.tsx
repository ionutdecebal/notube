"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { calculateLearningScore } from "@/lib/scoring";
import { DEMO_QUIZ_QUESTIONS, MOCK_VIDEOS } from "@/lib/mock-data";
import { parseTopicInput } from "@/lib/topic-preferences";
import { LearningScore, QuizQuestion, RankingMeta, RetrievalMeta, VideoCandidate } from "@/lib/types";
import {
  addSkipEvent,
  addSuggestionFeedback,
  getDemoState,
  initializeDemoState,
  saveQuizAttempt,
  saveReflection,
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

type ChatStage = "idle" | "loading" | "lesson" | "watching" | "reflecting" | "quiz" | "score";
type StageAction =
  | { type: "START_SEARCH" }
  | { type: "SEARCH_READY" }
  | { type: "START_WATCH" }
  | { type: "BEGIN_REFLECTION" }
  | { type: "QUIZ_READY" }
  | { type: "QUIZ_SUBMITTED" };
type QuizMeta = {
  source: "ai" | "fallback";
  basis: "video-specific" | "general-topic";
};

const THINK_SECONDS = 60;
const SEARCH_REQUEST_TIMEOUT_MS = 15_000;

const EMPTY_RETRIEVAL: RetrievalMeta = {
  source: "mock",
  fallbackReason: "network-error",
  attempts: 0,
};

const EMPTY_RANKING: RankingMeta = {
  strategy: "deterministic",
  aiUsed: false,
  aiAttempted: false,
  shortlistSize: 0,
  candidates: [],
};

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

const toMmss = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const stageReducer = (stage: ChatStage, action: StageAction): ChatStage => {
  switch (action.type) {
    case "START_SEARCH":
      return "loading";
    case "SEARCH_READY":
      return "lesson";
    case "START_WATCH":
      return "watching";
    case "BEGIN_REFLECTION":
      return stage === "watching" ? "reflecting" : stage;
    case "QUIZ_READY":
      return "quiz";
    case "QUIZ_SUBMITTED":
      return "score";
    default:
      return stage;
  }
};

export default function LandingPage() {
  const [stage, dispatchStage] = useReducer(stageReducer, "idle");
  const [composerText, setComposerText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [candidates, setCandidates] = useState<VideoCandidate[]>([]);
  const [retrieval, setRetrieval] = useState<RetrievalMeta>(EMPTY_RETRIEVAL);
  const [ranking, setRanking] = useState<RankingMeta>(EMPTY_RANKING);
  const [watchStats, setWatchStats] = useState({
    watchedSeconds: 0,
    durationSeconds: 0,
    watchCompletedAt: null as string | null,
  });
  const [reflectionSecondsLeft, setReflectionSecondsLeft] = useState(THINK_SECONDS);
  const [reflectionFinished, setReflectionFinished] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizMeta, setQuizMeta] = useState<QuizMeta>({
    source: "fallback",
    basis: "general-topic",
  });
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizHistory, setQuizHistory] = useState<Array<{ prompt: string; answer: string }>>([]);
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);
  const [score, setScore] = useState<LearningScore | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"good" | "neutral" | "bad" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLInputElement | null>(null);
  const playerRootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<{
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
  } | null>(null);

  const selectedVideo =
    candidates.find((video) => video.id === activeVideoId) ??
    candidates[0] ??
    MOCK_VIDEOS[0];
  const backups = candidates.slice(1, 3);
  const embedId = extractYouTubeVideoId(selectedVideo.id, selectedVideo.videoUrl);
  const watchPercent =
    watchStats.durationSeconds > 0
      ? Math.min(100, (watchStats.watchedSeconds / watchStats.durationSeconds) * 100)
      : 0;
  const thinkModeUnlocked = watchPercent >= 85;

  const currentQuizQuestion = quizQuestions[quizIndex] ?? null;
  const reflectionProgress = ((THINK_SECONDS - reflectionSecondsLeft) / THINK_SECONDS) * 100;

  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.scrollTo({ top: timelineRef.current.scrollHeight, behavior: "smooth" });
  }, [stage, watchStats.watchedSeconds, reflectionSecondsLeft, quizIndex, quizHistory.length, score]);

  useEffect(() => {
    if (stage === "idle" || stage === "score") {
      composerRef.current?.focus();
    }
  }, [stage]);

  const beginReflecting = () => {
    setReflectionSecondsLeft(THINK_SECONDS);
    setReflectionFinished(false);
    dispatchStage({ type: "BEGIN_REFLECTION" });
  };

  const completeReflection = useCallback(() => {
    saveReflection({
      prompts: [
        "What is the single most important idea from this video?",
        "Where could this concept fail if applied incorrectly?",
        "What concrete action will you take today to apply this?",
      ],
      response: "Timed reflection completed.",
      durationSeconds: THINK_SECONDS,
      completedAt: new Date().toISOString(),
    });

    setReflectionFinished(true);
    setQuizIndex(0);
    setQuizHistory([]);
    dispatchStage({ type: "START_SEARCH" });

    void (async () => {
      try {
        const state = getDemoState();
        const response = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: state.session.topic,
            filters: state.session.filters,
            selectedVideo: {
              title: selectedVideo.title,
              channel: selectedVideo.channel,
              reasonSelected: selectedVideo.reasonSelected,
            },
          }),
        });

        if (!response.ok) {
          setQuizQuestions(DEMO_QUIZ_QUESTIONS.slice(0, 3));
          setQuizMeta({ source: "fallback", basis: "general-topic" });
          dispatchStage({ type: "QUIZ_READY" });
          return;
        }

        const payload = (await response.json()) as {
          questions?: QuizQuestion[];
          meta?: QuizMeta;
        };
        const questions =
          payload.questions?.filter((question) => question.options.length === 3).slice(0, 3) ??
          [];
        setQuizQuestions(questions.length >= 3 ? questions : DEMO_QUIZ_QUESTIONS.slice(0, 3));
        setQuizMeta(payload.meta ?? { source: "fallback", basis: "general-topic" });
      } catch {
        setQuizQuestions(DEMO_QUIZ_QUESTIONS.slice(0, 3));
        setQuizMeta({ source: "fallback", basis: "general-topic" });
      }
      dispatchStage({ type: "QUIZ_READY" });
    })();
  }, [selectedVideo.channel, selectedVideo.reasonSelected, selectedVideo.title]);

  useEffect(() => {
    if (stage !== "watching" || !embedId || !playerRootRef.current) return;

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
                setWatchStats({ watchedSeconds: duration, durationSeconds: duration, watchCompletedAt: new Date().toISOString() });
              }
              beginReflecting();
            }
          },
        },
      });
    };

    if (window.YT) {
      mountPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = () => mountPlayer();
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [stage, embedId]);

  useEffect(() => {
    if (stage !== "watching") return;

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const watchedSeconds = Number(player.getCurrentTime().toFixed(1));
      const durationSeconds = Number(player.getDuration().toFixed(1));
      if (durationSeconds <= 0) return;

      saveWatchProgress(watchedSeconds, durationSeconds);
      const completed = watchedSeconds / durationSeconds >= 1;

      setWatchStats((prev) => ({
        watchedSeconds,
        durationSeconds,
        watchCompletedAt: completed ? prev.watchCompletedAt ?? new Date().toISOString() : prev.watchCompletedAt,
      }));

      if (completed) {
        beginReflecting();
      }
    }, 1500);

    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "reflecting") return;

    const timer = window.setInterval(() => {
      setReflectionSecondsLeft((prev) => {
        if (prev <= 1) {
          completeReflection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage, completeReflection]);

  const runSearch = async (rawInput: string) => {
    const parsed = parseTopicInput(rawInput);
    if (!parsed.topic.trim()) return;

    dispatchStage({ type: "START_SEARCH" });
    setTopic(parsed.topic);
    setQuizAnswers({});
    setQuizQuestions([]);
    setQuizMeta({ source: "fallback", basis: "general-topic" });
    setQuizIndex(0);
    setQuizHistory([]);
    setQuizResult(null);
    setScore(null);
    setFeedbackRating(null);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
    setReflectionFinished(false);
    setWatchStats({ watchedSeconds: 0, durationSeconds: 0, watchCompletedAt: null });

    let nextCandidates: VideoCandidate[] = MOCK_VIDEOS;
    let nextRetrieval = EMPTY_RETRIEVAL;
    let nextRanking = EMPTY_RANKING;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SEARCH_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch("/api/search-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ topic: parsed.topic, filters: parsed.filters }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          candidates?: VideoCandidate[];
          source?: RetrievalMeta["source"];
          fallbackReason?: RetrievalMeta["fallbackReason"];
          attempts?: number;
          ranking?: RankingMeta;
        };

        if (payload.candidates && payload.candidates.length >= 3) {
          nextCandidates = payload.candidates;
        }

        nextRetrieval = {
          source: payload.source ?? "mock",
          fallbackReason: payload.fallbackReason,
          attempts: payload.attempts ?? 0,
        };

        nextRanking = payload.ranking ?? EMPTY_RANKING;
      }
    } catch {
      // fallback defaults already set
    } finally {
      window.clearTimeout(timeout);
    }

    const nextState = initializeDemoState(
      parsed.topic,
      parsed.filters,
      nextCandidates,
      nextRetrieval,
      nextRanking,
    );

    setSessionId(nextState.session.id);
    setCandidates(nextCandidates);
    setActiveVideoId(nextCandidates[0]?.id ?? MOCK_VIDEOS[0].id);
    setRetrieval(nextRetrieval);
    setRanking(nextRanking);
    dispatchStage({ type: "SEARCH_READY" });
    setComposerText("");
  };

  const submitQuiz = (answersToSubmit: Record<string, string>) => {
    const state = getDemoState();
    const scoreResult = calculateLearningScore(quizQuestions, answersToSubmit);
    const correctCount = quizQuestions.filter(
      (question) => answersToSubmit[question.id] === question.correctOptionId,
    ).length;
    const totalCount = quizQuestions.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const summary =
      percentage >= 85
        ? `Strong result: ${correctCount}/${totalCount} correct. You're ready to apply this immediately.`
        : percentage >= 60
          ? `Solid start: ${correctCount}/${totalCount} correct. Rewatch key moments and retest to lock it in.`
          : `Needs reinforcement: ${correctCount}/${totalCount} correct. Rewatch and retest to strengthen understanding.`;

    const nextScore: LearningScore = {
      sessionId: state.session.id,
      total: scoreResult.total,
      breakdown: scoreResult.breakdown,
      summary,
    };

    saveQuizAttempt(
      {
        sessionId: state.session.id,
        answers: answersToSubmit,
        submittedAt: new Date().toISOString(),
      },
      nextScore,
    );

    setQuizResult({ correct: correctCount, total: totalCount });
    setScore(nextScore);
    dispatchStage({ type: "QUIZ_SUBMITTED" });
  };

  const skipCurrentSuggestion = () => {
    const currentIndex = candidates.findIndex((video) => video.id === selectedVideo.id);
    if (currentIndex < 0 || candidates.length < 2) return;

    const nextIndex = (currentIndex + 1) % candidates.length;
    const nextVideo = candidates[nextIndex];

    addSkipEvent({
      sessionId: getDemoState().session.id,
      stage: "session",
      reason: `Skipped suggestion: ${selectedVideo.title}`,
    });

    addSuggestionFeedback({
      sessionId: getDemoState().session.id,
      videoId: selectedVideo.id,
      context: "initial-skip",
      rating: "bad",
      comment: "Skipped before watching and requested another recommendation.",
    });

    setActiveVideoId(nextVideo.id);
  };

  const submitSuggestionFeedback = () => {
    if (!feedbackRating || feedbackSubmitted) return;
    const session = getDemoState().session;
    addSuggestionFeedback({
      sessionId: session.id,
      videoId: selectedVideo.id,
      context: "post-quiz",
      rating: feedbackRating,
      comment: feedbackComment.trim(),
    });
    setFeedbackSubmitted(true);
  };

  const onQuizOption = (optionId: string, optionLabel: string) => {
    const question = quizQuestions[quizIndex];
    if (!question) return;

    const nextAnswers = {
      ...quizAnswers,
      [question.id]: optionId,
    };

    setQuizAnswers(nextAnswers);
    setQuizHistory((prev) => [...prev, { prompt: question.prompt, answer: optionLabel }]);

    if (quizIndex >= quizQuestions.length - 1) {
      submitQuiz(nextAnswers);
    } else {
      setQuizIndex((prev) => prev + 1);
    }
  };

  const submitComposer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (stage !== "loading" && stage !== "reflecting" && stage !== "quiz") {
      await runSearch(composerText);
    }
  };

  const composerDisabled = stage === "loading" || stage === "reflecting" || stage === "quiz";
  const composerPlaceholder = "Type a topic (optional: beginner, 20 min, quick)";
  const composerValue = stage === "reflecting" ? `Think mode ${toMmss(reflectionSecondsLeft)} • input locked` : composerText;

  if (stage === "idle") {
    return (
      <main className="relative flex min-h-[100svh] items-start justify-center px-4 pb-8 pt-16 sm:items-center sm:py-8">
        <div className="w-full max-w-3xl space-y-5 text-center sm:space-y-8">
          <p className="text-lg font-light uppercase tracking-[0.24em] text-zinc-400 sm:text-xl sm:tracking-[0.3em]">NOTUBE</p>
          <h1 className="text-balance text-3xl font-medium leading-[1.08] tracking-tight text-zinc-100 sm:text-5xl">
            Built for focus.
          </h1>
          <p className="text-sm font-light text-zinc-500 sm:text-lg">
            Distraction-free YouTube for learning.
          </p>

          <form onSubmit={submitComposer} className="mx-auto w-full max-w-2xl">
            <label className="relative block rounded-2xl border border-white/85 bg-transparent px-4 py-3 sm:px-5 sm:py-4">
              <input
                ref={composerRef}
                value={composerValue}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder={composerPlaceholder}
                className="w-full bg-transparent pr-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500 sm:pr-3"
              />
            </label>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-transparent">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-3 pb-32 pt-4 sm:px-6 sm:pb-36 sm:pt-8">
        <header className="mb-4 flex items-center justify-between sm:mb-5">
          <p className="text-lg font-light uppercase tracking-[0.24em] text-zinc-400 sm:text-xl sm:tracking-[0.3em]">NOTUBE</p>
          <button
            type="button"
            onClick={() => setShowDebug((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            aria-label="Toggle debug details"
          >
            ?
          </button>
        </header>

        <div ref={timelineRef} className="flex max-h-[calc(100svh-10.5rem)] flex-col gap-3 overflow-y-auto pb-6 sm:max-h-[calc(100svh-13rem)] sm:gap-5 sm:pb-8">
          <article className="ml-auto max-w-[88%] rounded-2xl border border-zinc-500 bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-900 sm:max-w-[82%] sm:px-5 sm:py-3.5 sm:text-base">
            {topic}
          </article>

          {stage === "loading" ? (
            <article className="max-w-[88%] rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-relaxed text-zinc-300 sm:max-w-[82%] sm:px-5 sm:py-3.5 sm:text-base">
              {reflectionFinished ? "Generating quiz..." : "Finding the best video and alternatives..."}
            </article>
          ) : null}

          {stage !== "loading" ? (
            <article className="max-w-[88%] space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-sm leading-relaxed text-zinc-200 sm:max-w-[82%] sm:space-y-3.5 sm:px-5 sm:py-4.5 sm:text-base">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Selected video</p>
              <h2 className="text-lg font-medium leading-snug text-zinc-100 sm:text-xl">{selectedVideo.title}</h2>
              <p className="text-sm text-zinc-400 sm:text-base">
                {selectedVideo.channel} • {selectedVideo.durationMinutes} min
              </p>
              <p className="text-sm text-zinc-300 sm:text-base">{selectedVideo.reasonSelected}</p>

              {showDebug ? (
                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1">source: {retrieval.source}</span>
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1">ranking: {ranking.strategy}</span>
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1">ai used: {ranking.aiUsed ? "yes" : "no"}</span>
                </div>
              ) : null}

              {stage === "lesson" ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => dispatchStage({ type: "START_WATCH" })} className="w-full sm:w-auto">
                    Start watching
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={skipCurrentSuggestion}
                    className="w-full sm:w-auto"
                    disabled={candidates.length < 2}
                  >
                    Skip suggestion
                  </Button>
                </div>
              ) : null}
            </article>
          ) : null}

          {(stage === "watching" || stage === "reflecting" || stage === "quiz" || stage === "score") && (
            <article className="max-w-[96%] space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-sm leading-relaxed text-zinc-200 sm:max-w-[92%] sm:space-y-3.5 sm:px-5 sm:py-4.5 sm:text-base">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Watch</p>
              <p className="text-xs text-zinc-500">
                Now watching: {selectedVideo.role === "primary" ? "primary pick" : selectedVideo.role}
              </p>
              {embedId ? (
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
                  <div ref={playerRootRef} className="aspect-video w-full" />
                </div>
              ) : (
                <p className="rounded-xl border border-zinc-800 p-3 text-zinc-400">
                  Could not embed this video in chat mode.
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Watch progress</span>
                  <span>{watchPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full bg-zinc-100 transition-[width]" style={{ width: `${watchPercent}%` }} />
                </div>
                {stage === "watching" ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={beginReflecting}
                      disabled={!thinkModeUnlocked}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-100 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Go to Think Mode
                    </button>
                    <p className="mt-2 text-xs text-zinc-500">
                      Unlocks at 85%. Auto-advances when the video reaches 100%.
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          )}

          {(stage === "reflecting" || stage === "quiz" || stage === "score") && (
            <article className="max-w-[88%] rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-relaxed text-zinc-300 sm:max-w-[82%] sm:px-5 sm:py-3.5 sm:text-base">
              Think Mode: pause and mentally reconstruct the core idea, failure modes, and one action you can take.
            </article>
          )}

          {reflectionFinished ? (
            <article className="ml-auto max-w-[88%] rounded-2xl border border-zinc-500 bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-900 sm:max-w-[82%] sm:px-5 sm:py-3.5 sm:text-base">
              60-second reflection completed.
            </article>
          ) : null}

          {(stage === "quiz" || stage === "score") && (
            <article className="max-w-[94%] space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-sm leading-relaxed text-zinc-200 sm:max-w-[90%] sm:space-y-3.5 sm:px-5 sm:py-4.5 sm:text-base">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Quiz</p>
              {showDebug ? (
                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1">
                    source: {quizMeta.source}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1">
                    basis: {quizMeta.basis}
                  </span>
                </div>
              ) : null}
              {quizHistory.map((entry, index) => (
                <div key={`${entry.prompt}-${index}`} className="space-y-2">
                  <p className="rounded-xl border border-zinc-800 px-4 py-2.5 text-zinc-300">{entry.prompt}</p>
                  <p className="ml-auto w-fit rounded-xl border border-zinc-500 bg-zinc-100 px-4 py-2.5 text-zinc-900">{entry.answer}</p>
                </div>
              ))}

              {stage === "quiz" && currentQuizQuestion ? (
                <p className="rounded-xl border border-zinc-800 px-4 py-2.5 text-zinc-300">{currentQuizQuestion.prompt}</p>
              ) : null}
            </article>
          )}

          {stage === "score" && score ? (
            <article className="max-w-[94%] space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-sm leading-relaxed text-zinc-200 sm:max-w-[90%] sm:space-y-4.5 sm:px-5 sm:py-4.5 sm:text-base">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Viewing score</p>
              <p className="text-4xl font-semibold text-zinc-100">{score.total}/100</p>
              {quizResult ? (
                <p className="text-xs text-zinc-400">
                  Quiz result: {quizResult.correct}/{quizResult.total} correct
                </p>
              ) : null}
              <p className="text-xs text-zinc-400">
                Focus {score.breakdown.focus} • Recall {score.breakdown.recall} • Reasoning {score.breakdown.reasoning}
              </p>
              <p className="text-base text-zinc-300">{score.summary}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWatchStats({
                      watchedSeconds: 0,
                      durationSeconds: 0,
                      watchCompletedAt: null,
                    });
                    setReflectionFinished(false);
                    setQuizIndex(0);
                    setQuizHistory([]);
                    setQuizAnswers({});
                    setQuizResult(null);
                    setScore(null);
                    setFeedbackRating(null);
                    setFeedbackComment("");
                    setFeedbackSubmitted(false);
                    dispatchStage({ type: "START_WATCH" });
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-100 transition-colors hover:bg-zinc-900"
                >
                  Rewatch and retest
                </button>
              </div>

              <div className="space-y-3.5 rounded-xl border border-zinc-800 p-3.5">
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Feedback on this suggestion
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Good pick", value: "good" as const },
                    { label: "Okay pick", value: "neutral" as const },
                    { label: "Bad pick", value: "bad" as const },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFeedbackRating(item.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        feedbackRating === item.value
                          ? "border-zinc-200 bg-zinc-100 text-zinc-900"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  placeholder="Optional: why was this suggestion good or bad?"
                  className="min-h-20 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-500 sm:text-sm"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={submitSuggestionFeedback}
                    disabled={!feedbackRating || feedbackSubmitted}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-100 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {feedbackSubmitted ? "Feedback saved" : "Submit feedback"}
                  </button>
                  {feedbackSubmitted ? (
                    <span className="text-xs text-zinc-500">Thanks, this helps tune recommendations.</span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3.5 rounded-xl border border-zinc-800 p-3.5">
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Backups unlocked</p>
                {backups.map((video, index) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      setActiveVideoId(video.id);
                      setWatchStats({
                        watchedSeconds: 0,
                        durationSeconds: 0,
                        watchCompletedAt: null,
                      });
                      setReflectionFinished(false);
                      setQuizIndex(0);
                      setQuizHistory([]);
                      setQuizAnswers({});
                      setQuizResult(null);
                      setScore(null);
                      dispatchStage({ type: "START_WATCH" });
                    }}
                    className="w-full rounded-lg border border-zinc-800 p-3.5 text-left transition-colors hover:border-zinc-600"
                  >
                    <p className="text-xs text-zinc-500">{index === 0 ? "backup simpler" : "backup deeper"}</p>
                    <p className="mt-1 text-base text-zinc-100">{video.title}</p>
                    <p className="text-xs text-zinc-500">
                      {video.channel} • {video.durationMinutes} min
                    </p>
                  </button>
                ))}
              </div>

              {sessionId ? <p className="text-xs text-zinc-600">Session {sessionId}</p> : null}
            </article>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-900/90 bg-[#050608]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur sm:px-5 sm:pb-4 sm:pt-3">
        <div className="mx-auto w-full max-w-4xl">
          {stage === "quiz" && currentQuizQuestion ? (
            <div className="rounded-2xl border border-white/80 bg-transparent px-3 py-3 sm:px-4 sm:py-3.5">
              <p className="mb-2 text-xs text-zinc-500">Pick one answer</p>
              <div className="flex flex-wrap gap-2">
                {currentQuizQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onQuizOption(option.id, option.label)}
                    className="rounded-full border border-zinc-600 px-3 py-1.5 text-sm text-zinc-100 transition-colors hover:border-zinc-300 hover:bg-zinc-900"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={submitComposer} className="flex w-full items-center gap-2 sm:gap-3">
              <label className="relative block flex-1 overflow-hidden rounded-2xl border border-white/80 bg-transparent px-3 py-2.5 sm:px-4 sm:py-3">
                {stage === "reflecting" ? (
                  <span
                    className="pointer-events-none absolute inset-y-0 left-0 bg-zinc-800/70 transition-[width]"
                    style={{ width: `${reflectionProgress}%` }}
                  />
                ) : null}
                <input
                  ref={composerRef}
                  value={composerValue}
                  onChange={(event) => setComposerText(event.target.value)}
                  disabled={composerDisabled}
                  placeholder={composerPlaceholder}
                  className="relative z-10 w-full bg-transparent pr-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-80 sm:pr-3"
                />
              </label>

              <button
                type="submit"
                disabled={composerDisabled || !composerText.trim()}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-100 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:px-4 sm:text-sm"
              >
                Search
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
