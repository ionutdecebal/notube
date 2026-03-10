"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { getDemoState, hydrateDemoStateFromServer } from "@/lib/session-storage";

export default function BackupsDemoPage() {
  return (
    <Suspense fallback={<BackupsPageFallback />}>
      <BackupsDemoContent />
    </Suspense>
  );
}

function BackupsDemoContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState(() => getDemoState());
  const backups = state.videoCandidates.filter((video) => state.session.backupVideoIds.includes(video.id));

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (!sessionId || sessionId === state.session.id) return;
    void hydrateDemoStateFromServer(sessionId).then((next) => {
      if (next) setState(next);
    });
  }, [searchParams, state.session.id]);

  return (
    <PageShell title="Backups" description="Two alternatives unlocked after you complete the focus loop.">
      <section className="grid gap-4 sm:grid-cols-2">
        {backups.map((video, index) => (
          <Card key={video.id} className="space-y-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
              {index === 0 ? "Backup 1: simpler explanation" : "Backup 2: deeper explanation"}
            </p>
            <h2 className="text-lg font-semibold text-zinc-100">{video.title}</h2>
            <p className="text-sm text-zinc-400">
              {video.channel} • {video.durationMinutes} min
            </p>
            <p className="text-sm text-zinc-300">{video.reasonSelected}</p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

function BackupsPageFallback() {
  return (
    <PageShell title="Backups" description="Two alternatives unlocked after you complete the focus loop.">
      <p className="text-sm text-zinc-400">Loading backups...</p>
    </PageShell>
  );
}
