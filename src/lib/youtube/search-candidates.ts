import "server-only";

import { getFeedbackSignals } from "@/lib/server/persistence";
import { RankingMeta, SessionFilters, VideoCandidate } from "@/lib/types";

interface YouTubeSearchItem {
  id: {
    videoId?: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
  };
}

interface YouTubeVideoItem {
  id: string;
  contentDetails: {
    duration: string;
  };
}

const API_BASE = "https://www.googleapis.com/youtube/v3";
const OPENAI_API_BASE = "https://api.openai.com/v1";
const LIE_YOUTUBE_MODE = process.env.NOTUBE_LIE_YOUTUBE === "1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 7000;
const MAX_RETRIES = 1;
const SEARCH_RESULTS_PER_QUERY = 50;
const MAX_CANDIDATES_FOR_DETAILS = 50;
const AI_SHORTLIST_SIZE = 12;

type CandidateSource = "youtube" | "mock";

type FallbackReason =
  | "lie-mode-enabled"
  | "missing-api-key"
  | "quota-exceeded"
  | "search-timeout"
  | "search-rate-limited"
  | "search-http-error"
  | "search-empty-results"
  | "details-timeout"
  | "details-rate-limited"
  | "details-http-error"
  | "normalize-insufficient-results"
  | "network-error";

interface SearchCandidatesResult {
  candidates: VideoCandidate[];
  source: CandidateSource;
  fallbackReason?: FallbackReason;
  attempts: number;
  ranking: RankingMeta;
}

interface ScoredCandidate {
  id: string;
  title: string;
  channel: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  score: number;
}

interface FeedbackSignals {
  channelWeights: Record<string, number>;
  tokenWeights: Record<string, number>;
  sampleCount: number;
}

const durationToMinutes = (isoDuration: string): number => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return Math.max(1, Math.round(hours * 60 + minutes + seconds / 60));
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const buildSearchQuery = (topic: string, filters: SessionFilters): string => {
  const difficultyTerm =
    filters.difficulty === "beginner"
      ? "beginner"
      : filters.difficulty === "intermediate"
        ? "intermediate"
        : "advanced";

  const modeTerm = filters.lessonMode === "quick-answer" ? "explained" : "tutorial";

  return `${topic} ${modeTerm} ${difficultyTerm}`.trim();
};

const countTokenMatches = (text: string, tokens: string[]): number => {
  let count = 0;
  for (const token of tokens) {
    if (text.includes(token)) count += 1;
  }
  return count;
};

const scoreCandidate = (
  topic: string,
  filters: SessionFilters,
  title: string,
  channel: string,
  description: string,
  durationMinutes: number,
  feedbackSignals: FeedbackSignals,
) => {
  const titleLc = title.toLowerCase();
  const descLc = description.toLowerCase();
  const haystack = `${titleLc} ${descLc}`;
  const topicLc = topic.toLowerCase();
  const topicTokens = tokenize(topic).filter((token) => token.length >= 3);

  const titleMatches = countTokenMatches(titleLc, topicTokens);
  const descMatches = countTokenMatches(descLc, topicTokens);

  let score = 0;

  if (titleLc.includes(topicLc)) score += 8;
  score += titleMatches * 3;
  score += descMatches;

  // Keep weak matches available for fallback ranking, but push them down hard.
  if (!titleLc.includes(topicLc) && titleMatches === 0 && descMatches === 0) {
    score -= 10;
  }

  if (/(tutorial|guide|explained|lesson|course|masterclass)/.test(haystack)) score += 3;
  if (/(tips and tricks|lifehack|reaction|funny|meme)/.test(haystack)) score -= 3;

  if (filters.difficulty === "beginner") {
    if (/(beginner|intro|basics|fundamentals)/.test(haystack)) score += 4;
    if (/(advanced|expert|internals)/.test(haystack)) score -= 4;
  }
  if (filters.difficulty === "intermediate") {
    if (/(intermediate|practical|real world)/.test(haystack)) score += 3;
  }
  if (filters.difficulty === "advanced") {
    if (/(advanced|deep dive|internals|architecture|expert)/.test(haystack)) score += 4;
    if (/(beginner|basics)/.test(haystack)) score -= 2;
  }

  if (filters.lessonMode === "quick-answer") {
    if (/(quick|overview|in \d+ (min|minutes))/.test(haystack)) score += 4;
  } else {
    if (/(full tutorial|complete|deep dive|long-form|masterclass)/.test(haystack)) score += 4;
  }

  const targetLength =
    filters.lessonMode === "quick-answer"
      ? Math.min(12, filters.maxLengthMinutes)
      : Math.max(18, Math.min(filters.maxLengthMinutes, 40));
  const durationDelta = Math.abs(durationMinutes - targetLength);
  score -= Math.min(10, durationDelta / 2.5);
  if (durationMinutes > filters.maxLengthMinutes * 2) score -= 4;

  if (feedbackSignals.sampleCount > 0) {
    const channelKey = channel.toLowerCase().trim();
    const channelSignal = feedbackSignals.channelWeights[channelKey] ?? 0;
    score += Math.max(-5, Math.min(5, channelSignal * 1.5));

    const feedbackTokenHits = topicTokens.reduce((acc, token) => {
      if (!haystack.includes(token)) return acc;
      return acc + (feedbackSignals.tokenWeights[token] ?? 0);
    }, 0);
    score += Math.max(-3, Math.min(3, feedbackTokenHits));
  }

  return score;
};

const buildScoredCandidates = (
  topic: string,
  filters: SessionFilters,
  items: YouTubeSearchItem[],
  durations: Record<string, number>,
  feedbackSignals: FeedbackSignals,
): ScoredCandidate[] => {
  return items
    .map((item) => {
      const videoId = item.id.videoId;
      if (!videoId) return null;

      const durationMinutes = durations[videoId] ?? 0;
      if (durationMinutes <= 0 || durationMinutes > 180) return null;

      const score = scoreCandidate(
        topic,
        filters,
        item.snippet.title,
        item.snippet.channelTitle,
        item.snippet.description,
        durationMinutes,
        feedbackSignals,
      );
      if (score <= -120) return null;

      return {
        id: videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        durationMinutes,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score);
};

const buildLooseFallbackCandidates = (
  topic: string,
  filters: SessionFilters,
  items: YouTubeSearchItem[],
  durations: Record<string, number>,
  feedbackSignals: FeedbackSignals,
): ScoredCandidate[] => {
  return items
    .map((item) => {
      const videoId = item.id.videoId;
      if (!videoId) return null;

      const inferredDuration = durations[videoId] ?? filters.maxLengthMinutes;
      const durationMinutes = inferredDuration > 0 && inferredDuration <= 180 ? inferredDuration : filters.maxLengthMinutes;

      return {
        id: videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        durationMinutes,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        score: scoreCandidate(
          topic,
          filters,
          item.snippet.title,
          item.snippet.channelTitle,
          item.snippet.description,
          durationMinutes,
          feedbackSignals,
        ),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score);
};

const pickDeterministicTopThree = (scored: ScoredCandidate[]): ScoredCandidate[] => {
  if (scored.length <= 3) return scored.slice(0, 3);

  const primary = scored[0];
  const remaining = scored.slice(1);

  const simplerRank = [...remaining]
    .map((item) => {
      let value = 0;
      const haystack = `${item.title} ${item.description}`.toLowerCase();
      if (/(beginner|intro|basics|overview)/.test(haystack)) value += 4;
      value += Math.max(0, primary.durationMinutes - item.durationMinutes) / 4;
      if (item.channel !== primary.channel) value += 1;
      return { item, value };
    })
    .sort((a, b) => b.value - a.value);

  const deeperRank = [...remaining]
    .map((item) => {
      let value = 0;
      const haystack = `${item.title} ${item.description}`.toLowerCase();
      if (/(advanced|deep dive|internals|complete|masterclass)/.test(haystack)) value += 4;
      value += Math.max(0, item.durationMinutes - primary.durationMinutes) / 4;
      if (item.channel !== primary.channel) value += 1;
      return { item, value };
    })
    .sort((a, b) => b.value - a.value);

  const simpler = simplerRank[0]?.item ?? remaining[0];
  const deeper = deeperRank.find((entry) => entry.item.id !== simpler.id)?.item ?? remaining.find((item) => item.id !== simpler.id) ?? remaining[0];

  return [primary, simpler, deeper];
};

const toRankedOutput = (ordered: ScoredCandidate[]): VideoCandidate[] => {
  const primary = ordered[0];
  const second = ordered[1];
  const third = ordered[2];
  if (!primary || !second || !third) return [];

  const secondLooksSimpler = second.durationMinutes <= third.durationMinutes;
  const simpler = secondLooksSimpler ? second : third;
  const deeper = secondLooksSimpler ? third : second;

  return [
    {
      id: primary.id,
      title: primary.title,
      channel: primary.channel,
      durationMinutes: primary.durationMinutes,
      role: "primary",
      reasonSelected: "Best overall match for your topic and preferences.",
      videoUrl: primary.videoUrl,
    },
    {
      id: simpler.id,
      title: simpler.title,
      channel: simpler.channel,
      durationMinutes: simpler.durationMinutes,
      role: "backup-simpler",
      reasonSelected: "Alternative with simpler framing and lighter pacing.",
      videoUrl: simpler.videoUrl,
    },
    {
      id: deeper.id,
      title: deeper.title,
      channel: deeper.channel,
      durationMinutes: deeper.durationMinutes,
      role: "backup-deeper",
      reasonSelected: "Alternative with deeper coverage and stronger detail.",
      videoUrl: deeper.videoUrl,
    },
  ];
};

const parseOrderedIds = (content: string): string[] => {
  try {
    const parsed = JSON.parse(content) as { orderedIds?: unknown };
    return Array.isArray(parsed.orderedIds)
      ? parsed.orderedIds.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const rerankWithAI = async (
  topic: string,
  filters: SessionFilters,
  candidates: ScoredCandidate[],
): Promise<{
  ranked: ScoredCandidate[] | null;
  attempted: boolean;
  failureReason?: string;
}> => {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAIKey) return { ranked: null, attempted: false, failureReason: "missing-openai-key" };
  if (candidates.length < 3) return { ranked: null, attempted: false, failureReason: "insufficient-candidates" };

  const shortlist = candidates.slice(0, AI_SHORTLIST_SIZE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return strict JSON only: {"orderedIds":["id1","id2","id3"]}. Select one primary, one simpler backup, one deeper backup when possible.',
          },
          {
            role: "user",
            content: JSON.stringify({
              topic,
              preferences: filters,
              candidates: shortlist.map((item) => ({
                id: item.id,
                title: item.title,
                channel: item.channel,
                durationMinutes: item.durationMinutes,
                description: item.description.slice(0, 500),
              })),
            }),
          },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ranked: null, attempted: true, failureReason: `status-${response.status}` };
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { ranked: null, attempted: true, failureReason: "empty-content" };

    const ids = parseOrderedIds(content);
    if (ids.length < 3) return { ranked: null, attempted: true, failureReason: "invalid-json-shape" };

    const byId = new Map(shortlist.map((item) => [item.id, item] as const));
    const picked: ScoredCandidate[] = [];
    for (const id of unique(ids)) {
      const found = byId.get(id);
      if (found) picked.push(found);
      if (picked.length === 3) break;
    }

    if (picked.length < 3) return { ranked: null, attempted: true, failureReason: "unknown-candidate-id" };
    return { ranked: picked, attempted: true };
  } catch {
    return { ranked: null, attempted: true, failureReason: "request-error" };
  } finally {
    clearTimeout(timeout);
  }
};

const fetchYouTubeJson = async <T>(url: string): Promise<
  | { ok: true; json: T; attempts: number }
  | { ok: false; reason: "timeout" | "rate-limited" | "quota-exceeded" | "http-error" | "network-error"; attempts: number }
> => {
  let attemptCount = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    attemptCount += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        try {
          return { ok: true, json: (await res.json()) as T, attempts: attemptCount };
        } catch {
          if (attempt < MAX_RETRIES) continue;
          return { ok: false, reason: "http-error", attempts: attemptCount };
        }
      }

      if (res.status === 429) {
        if (attempt < MAX_RETRIES) continue;
        return { ok: false, reason: "rate-limited", attempts: attemptCount };
      }

      if (res.status === 403) {
        try {
          const errorJson = (await res.json()) as { error?: { errors?: Array<{ reason?: string }> } };
          const reasons = errorJson.error?.errors?.map((entry) => entry.reason) ?? [];
          if (reasons.some((reason) => reason === "quotaExceeded" || reason === "dailyLimitExceeded")) {
            return { ok: false, reason: "quota-exceeded", attempts: attemptCount };
          }
        } catch {
          // fall through to generic http error
        }
      }

      if ([500, 502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
        continue;
      }

      return { ok: false, reason: "http-error", attempts: attemptCount };
    } catch (error) {
      clearTimeout(timeout);
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (isAbort) {
        if (attempt < MAX_RETRIES) continue;
        return { ok: false, reason: "timeout", attempts: attemptCount };
      }

      if (attempt < MAX_RETRIES) continue;
      return { ok: false, reason: "network-error", attempts: attemptCount };
    }
  }

  return { ok: false, reason: "network-error", attempts: attemptCount };
};

const fetchYouTubeJsonWithKeys = async <T>(
  buildUrl: (apiKey: string) => string,
  apiKeys: string[],
): Promise<
  | { ok: true; json: T; attempts: number }
  | { ok: false; reason: "timeout" | "rate-limited" | "quota-exceeded" | "http-error" | "network-error"; attempts: number }
> => {
  let totalAttempts = 0;
  let firstFailure: "timeout" | "rate-limited" | "quota-exceeded" | "http-error" | "network-error" | null = null;

  for (const apiKey of apiKeys) {
    const result = await fetchYouTubeJson<T>(buildUrl(apiKey));
    totalAttempts += result.attempts;

    if (result.ok) {
      return { ok: true, json: result.json, attempts: totalAttempts };
    }

    if (!firstFailure) firstFailure = result.reason;

    // Try the backup key only when the current key is exhausted or rejected.
    if (result.reason !== "quota-exceeded" && result.reason !== "http-error") {
      return { ok: false, reason: result.reason, attempts: totalAttempts };
    }
  }

  return { ok: false, reason: firstFailure ?? "network-error", attempts: totalAttempts };
};

const emptyRanking = (): RankingMeta => ({
  strategy: "deterministic",
  aiUsed: false,
  aiAttempted: false,
  feedbackAdjusted: false,
  feedbackSamples: 0,
  shortlistSize: 0,
  candidates: [],
});

export const searchYouTubeCandidates = async (
  topic: string,
  filters: SessionFilters,
): Promise<SearchCandidatesResult> => {
  const feedbackSignals = await getFeedbackSignals();

  if (LIE_YOUTUBE_MODE) {
    return {
      candidates: [],
      source: "mock",
      fallbackReason: "lie-mode-enabled",
      attempts: 0,
      ranking: emptyRanking(),
    };
  }

  const apiKeys = unique(
    [process.env.YOUTUBE_API_KEY?.trim(), process.env.YOUTUBE_API_KEY_BACKUP?.trim()].filter(
      (value): value is string => Boolean(value),
    ),
  );

  if (apiKeys.length === 0) {
    return {
      candidates: [],
      source: "mock",
      fallbackReason: "missing-api-key",
      attempts: 0,
      ranking: emptyRanking(),
    };
  }

  let totalAttempts = 0;
  let firstSearchFailure: "timeout" | "rate-limited" | "quota-exceeded" | "http-error" | "network-error" | null = null;
  const query = buildSearchQuery(topic, filters);
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(SEARCH_RESULTS_PER_QUERY),
    order: "relevance",
    relevanceLanguage: "en",
  });

  const searchFetch = await fetchYouTubeJsonWithKeys<{ items?: YouTubeSearchItem[] }>(
    (apiKey) => `${API_BASE}/search?${new URLSearchParams({ ...Object.fromEntries(searchParams), key: apiKey }).toString()}`,
    apiKeys,
  );
  totalAttempts += searchFetch.attempts;

  if (!searchFetch.ok) {
    firstSearchFailure = searchFetch.reason;
    if (searchFetch.reason === "quota-exceeded") {
      return {
        candidates: [],
        source: "mock",
        fallbackReason: "quota-exceeded",
        attempts: totalAttempts,
        ranking: emptyRanking(),
      };
    }
  }

  const items = (searchFetch.ok ? searchFetch.json.items ?? [] : []).slice(0, MAX_CANDIDATES_FOR_DETAILS);
  const ids = items.map((item) => item.id.videoId).filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    if (firstSearchFailure) {
      return {
        candidates: [],
        source: "mock",
        fallbackReason:
          firstSearchFailure === "quota-exceeded"
            ? "quota-exceeded"
            : firstSearchFailure === "timeout"
            ? "search-timeout"
            : firstSearchFailure === "rate-limited"
              ? "search-rate-limited"
              : firstSearchFailure === "http-error"
                ? "search-http-error"
                : "network-error",
        attempts: totalAttempts,
        ranking: emptyRanking(),
      };
    }

    return {
      candidates: [],
      source: "mock",
      fallbackReason: "search-empty-results",
      attempts: totalAttempts,
      ranking: emptyRanking(),
    };
  }

  const videosParams = new URLSearchParams({
    part: "contentDetails",
    id: ids.join(","),
  });

  const detailsFetch = await fetchYouTubeJsonWithKeys<{ items?: YouTubeVideoItem[] }>(
    (apiKey) => `${API_BASE}/videos?${new URLSearchParams({ ...Object.fromEntries(videosParams), key: apiKey }).toString()}`,
    apiKeys,
  );
  totalAttempts += detailsFetch.attempts;

  if (!detailsFetch.ok) {
    return {
      candidates: [],
      source: "mock",
      fallbackReason:
        detailsFetch.reason === "quota-exceeded"
          ? "quota-exceeded"
          : detailsFetch.reason === "timeout"
          ? "details-timeout"
          : detailsFetch.reason === "rate-limited"
            ? "details-rate-limited"
            : detailsFetch.reason === "http-error"
              ? "details-http-error"
              : "network-error",
      attempts: totalAttempts,
      ranking: emptyRanking(),
    };
  }

  const durations = Object.fromEntries(
    (detailsFetch.json.items ?? []).map((item) => [item.id, durationToMinutes(item.contentDetails.duration)]),
  );

  const scored = buildScoredCandidates(topic, filters, items, durations, feedbackSignals);
  const fallbackScored = scored.length < 3 ? buildLooseFallbackCandidates(topic, filters, items, durations, feedbackSignals) : scored;

  if (fallbackScored.length < 3) {
    return {
      candidates: [],
      source: "mock",
      fallbackReason: "normalize-insufficient-results",
      attempts: totalAttempts,
      ranking: {
        strategy: "deterministic",
        aiUsed: false,
        aiAttempted: false,
        feedbackAdjusted: feedbackSignals.sampleCount > 0,
        feedbackSamples: feedbackSignals.sampleCount,
        shortlistSize: fallbackScored.length,
        candidates: fallbackScored.slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title,
          channel: item.channel,
          durationMinutes: item.durationMinutes,
          score: Number(item.score.toFixed(2)),
        })),
      },
    };
  }

  const deterministicTop = pickDeterministicTopThree(fallbackScored);
  const aiResult = await rerankWithAI(topic, filters, fallbackScored);
  const finalRanked = aiResult.ranked ?? deterministicTop;
  const aiUsed = Boolean(aiResult.ranked);

  return {
    candidates: toRankedOutput(finalRanked),
    source: "youtube",
    attempts: totalAttempts,
    ranking: {
      strategy: aiUsed ? "hybrid-ai" : "deterministic",
      aiUsed,
      aiAttempted: aiResult.attempted,
      aiFailureReason: aiResult.failureReason,
      feedbackAdjusted: feedbackSignals.sampleCount > 0,
      feedbackSamples: feedbackSignals.sampleCount,
      shortlistSize: fallbackScored.length,
      candidates: fallbackScored.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        channel: item.channel,
        durationMinutes: item.durationMinutes,
        score: Number(item.score.toFixed(2)),
      })),
    },
  };
};
