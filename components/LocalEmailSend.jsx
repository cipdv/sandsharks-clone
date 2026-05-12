"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getLocalDevelopmentEmailJobStatus,
  sendLocalDevelopmentEmailBlast,
  sendNextLocalDevelopmentEmailBatch,
} from "@/app/_actions";

function formatDateTime(value) {
  if (!value) {
    return "Now";
  }

  return new Date(value).toLocaleString();
}

export default function LocalEmailSend({ members, pendingJobs = [] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendToAllEligible, setSendToAllEligible] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() =>
    new Set(),
  );
  const [result, setResult] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        member.firstName.toLowerCase().includes(normalizedSearch) ||
        member.lastName.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [members, searchTerm]);

  const selectedCount = selectedIds.size;
  const eligibleCount = members.filter((member) => member.emailList).length;

  function toggleMemberSelection(memberId) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }

      return next;
    });
  }

  function selectVisibleMembers() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const member of filteredMembers) {
        next.add(member.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function startProcessing(jobId) {
    const response = await fetch("/api/local-email-send/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });
    const responseText = await response.text();

    try {
      return JSON.parse(responseText);
    } catch (error) {
      return {
        success: false,
        message: `Failed to start the local email batch runner. The server returned a non-JSON response (${response.status}).`,
      };
    }
  }

  useEffect(() => {
    if (!activeJobId) {
      return undefined;
    }

    const pollStatus = async () => {
      const status = await getLocalDevelopmentEmailJobStatus(activeJobId);

      if (!status.success || !status.job) {
        return;
      }

      setResult((current) => ({
        ...(current || {}),
        jobId: status.job.id,
        jobProgress: {
          totalCount: status.job.totalCount,
          sentCount: status.job.sentCount,
          queuedCount: status.job.queuedCount,
          failedCount: status.job.failedCount,
        },
        nextSafeSendAt: status.job.nextSafeSendAt,
      }));

      if (status.job.lastRunCompletedAt) {
        setActiveJobId(null);
        router.refresh();
      }
    };

    const interval = setInterval(pollStatus, 5000);
    pollStatus();

    return () => clearInterval(interval);
  }, [activeJobId, router]);

  function handleSubmit(event) {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      const response = await sendLocalDevelopmentEmailBlast({
        subject,
        body,
        sendToAllEligible,
        selectedMemberIds: Array.from(selectedIds),
      });

      setResult(response);
      if (response.success && response.jobId) {
        const startResponse = await startProcessing(response.jobId);
        if (!startResponse.success) {
          setResult(startResponse);
          setActiveJobId(null);
          return;
        }
        setActiveJobId(response.jobId);
      } else {
        setActiveJobId(null);
      }
      router.refresh();
    });
  }

  function handleSendNextBatch(jobId) {
    setResult(null);

    startTransition(async () => {
      const response = await sendNextLocalDevelopmentEmailBatch(jobId);
      setResult(response);
      if (response.success && response.jobId) {
        const startResponse = await startProcessing(response.jobId);
        if (!startResponse.success) {
          setResult(startResponse);
          setActiveJobId(null);
          return;
        }
        setActiveJobId(response.jobId);
      } else {
        setActiveJobId(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">Development-only Gmail sender</p>
        <p className="mt-1 text-sm">
          This page is separate from Resend and only works in local development.
          It paces sends and enforces a conservative local daily cap of 280
          recipients for `sandsharks.org@gmail.com`.
        </p>
        <p className="mt-1 text-sm">
          Re-running the same draft with the same recipient set resumes the same
          database-backed job and skips members already marked as sent.
        </p>
      </div>

      {pendingJobs.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Unfinished Local Email Jobs
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Click `Next batch` to continue an existing local Gmail send without
              resending completed recipients.
            </p>
          </div>

          <div className="space-y-4">
            {pendingJobs.map((job) => {
              const isWaitingForWindow = Boolean(job.nextSafeSendAt);

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{job.subject}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Job #{job.id} · Created {formatDateTime(job.createdAt)}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {job.sentCount}/{job.totalCount} sent, {job.queuedCount} queued,{" "}
                        {job.failedCount} failed.
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Send after: {formatDateTime(job.nextSafeSendAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendNextBatch(job.id)}
                      disabled={isPending || isWaitingForWindow}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {isWaitingForWindow ? "Waiting for next window" : "Next batch"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="local-email-subject"
                className="block text-sm font-medium text-slate-700"
              >
                Subject
              </label>
              <input
                id="local-email-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Email subject"
                required
              />
            </div>

            <div>
              <label
                htmlFor="local-email-body"
                className="block text-sm font-medium text-slate-700"
              >
                Body
              </label>
              <textarea
                id="local-email-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={12}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Write the email body. Basic markdown formatting is supported."
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recipients</h2>
              <p className="text-sm text-slate-600">
                Choose specific members, or send to all active email-list members.
              </p>
            </div>

            <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={sendToAllEligible}
                onChange={() => setSendToAllEligible((current) => !current)}
              />
              Send to all eligible members ({eligibleCount})
            </label>
          </div>

          {!sendToAllEligible && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search members by name or email"
                  className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={selectVisibleMembers}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Select visible
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Clear selection
                </button>
                <span className="text-sm text-slate-600">
                  {selectedCount} selected
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 divide-y divide-slate-200">
                  {filteredMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-slate-600">{member.email}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 ${
                              member.emailList
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {member.emailList ? "On email list" : "Opted out"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                            {member.memberType}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              result.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {result.jobId ? (
              <p className="mt-2 text-xs">Local email job ID: {result.jobId}</p>
            ) : null}
            {result.jobProgress ? (
              <p className="mt-2 text-xs">
                Progress: {result.jobProgress.sentCount}/{result.jobProgress.totalCount} sent,
                {" "}
                {result.jobProgress.queuedCount} queued,{" "}
                {result.jobProgress.failedCount} failed.
              </p>
            ) : null}
            {result.nextSafeSendAt ? (
              <p className="mt-2 text-xs">
                Send after: {formatDateTime(result.nextSafeSendAt)}
              </p>
            ) : null}
            {result.success && result.pacing ? (
              <p className="mt-2 text-xs">
                Batch size {result.pacing.batchSize}, {result.pacing.delayBetweenEmailsMs / 1000}s
                between emails, {result.pacing.delayBetweenBatchesMs / 1000}s
                between batches. Daily total after this run:{" "}
                {result.dailyCountAfterSend}/{result.dailyCap}.
              </p>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-sky-700 px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Sending locally..." : "Send local Gmail email"}
          </button>
        </div>
      </form>
    </div>
  );
}
