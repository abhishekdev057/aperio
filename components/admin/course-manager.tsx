"use client";

import { useState } from "react";
import { Check, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type SkillOption = { id: string; name: string; skillType: string };
type CourseRow = Record<string, unknown>;
type Lesson = { id?: string; title: string; kind: string; content: string; resourceUrl: string | null; durationMin: number | null; position: number };

const KINDS = ["reading", "exercise", "video", "quiz", "project"];
const emptyLesson = (position: number): Lesson => ({ title: "", kind: "reading", content: "", resourceUrl: "", durationMin: null, position });

function Editor({ skills, initial, onSaved, onCancel }: { skills: SkillOption[]; initial?: Record<string, unknown>; onSaved: (c: CourseRow) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(String(initial?.title ?? ""));
  const [summary, setSummary] = useState(String(initial?.summary ?? ""));
  const [level, setLevel] = useState(String(initial?.level ?? "mid"));
  const [track, setTrack] = useState(String(initial?.track ?? "technical"));
  const [published, setPublished] = useState(Boolean(initial?.published));
  const [skillIds, setSkillIds] = useState<string[]>(Array.isArray(initial?.skillIds) ? (initial!.skillIds as string[]) : []);
  const [lessons, setLessons] = useState<Lesson[]>(Array.isArray(initial?.lessons) && (initial!.lessons as Lesson[]).length ? (initial!.lessons as Lesson[]) : [emptyLesson(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: initial?.id,
          title,
          summary,
          level,
          track,
          published,
          skillIds,
          lessons: lessons
            .filter((l) => l.title.trim())
            .map((l, i) => ({ ...l, resourceUrl: l.resourceUrl || null, durationMin: l.durationMin ? Number(l.durationMin) : null, position: i })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Save failed.");
      onSaved(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[16px] border bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{initial?.id ? "Edit course" : "New course"}</h2>
        <button onClick={onCancel} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X size={16} /></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium">Title</span><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Backend fundamentals for mid engineers" /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium">Summary</span><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 w-full rounded-[9px] border bg-[var(--surface-elevated)] px-3 text-sm">
            {["junior", "mid", "senior", "all"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium">Track</span>
          <select value={track} onChange={(e) => setTrack(e.target.value)} className="h-10 w-full rounded-[9px] border bg-[var(--surface-elevated)] px-3 text-sm">
            {["technical", "soft", "mixed"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs font-medium">Skills covered ({skillIds.length})</span>
        <div className="max-h-40 overflow-auto rounded-[10px] border p-2">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => {
              const on = skillIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSkillIds((ids) => (on ? ids.filter((x) => x !== s.id) : [...ids, s.id]))}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium ${on ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--muted-strong)]"}`}
                >
                  {s.name}{s.skillType === "soft" ? " ·s" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Lessons ({lessons.filter((l) => l.title.trim()).length})</span>
          <button onClick={() => setLessons((ls) => [...ls, emptyLesson(ls.length)])} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]"><Plus size={12} />Add lesson</button>
        </div>
        <div className="mt-2 space-y-2">
          {lessons.map((l, i) => (
            <div key={i} className="rounded-[10px] border bg-[var(--surface-elevated)] p-3">
              <div className="flex gap-2">
                <Input value={l.title} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder={`Lesson ${i + 1} title`} className="flex-1" />
                <select value={l.kind} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} className="h-10 rounded-[9px] border bg-[var(--surface)] px-2 text-xs">
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <button onClick={() => setLessons((ls) => ls.filter((_, j) => j !== i))} className="grid size-10 shrink-0 place-items-center rounded-[9px] text-[var(--muted)] hover:text-[var(--critical)]"><Trash2 size={14} /></button>
              </div>
              <Textarea value={l.content} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))} rows={2} placeholder="Lesson content / instructions" className="mt-2" />
              <div className="mt-2 flex gap-2">
                <Input value={l.resourceUrl ?? ""} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, resourceUrl: e.target.value } : x)))} placeholder="https://resource (optional)" className="flex-1" />
                <Input type="number" value={l.durationMin ?? ""} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, durationMin: e.target.value ? Number(e.target.value) : null } : x)))} placeholder="min" className="w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={published} onChange={(e) => setPublished(e.target.checked)} />Published</label>
        <Button size="sm" onClick={save} disabled={saving || !title.trim()}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}Save course</Button>
        {error && <span className="text-xs text-[var(--critical)]">{error}</span>}
      </div>
    </div>
  );
}

export function CourseManager({ initialCourses, skills }: { initialCourses: CourseRow[]; skills: SkillOption[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState("");

  async function openEdit(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/v1/admin/courses/${id}`);
    const json = await res.json();
    setLoadingId("");
    if (res.ok) {
      setEditing(json.data);
      setCreating(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/v1/admin/courses/${id}`, { method: "DELETE" });
    setCourses((c) => c.filter((x) => x.id !== id));
  }

  function afterSave(saved: CourseRow) {
    setCourses((c) => {
      const exists = c.some((x) => x.id === saved.id);
      const row = {
        ...saved,
        lessons: Array.isArray((saved as { lessons?: unknown[] }).lessons) ? (saved as { lessons: unknown[] }).lessons.length : 0,
        enrollments: 0,
      };
      return exists ? c.map((x) => (x.id === saved.id ? { ...x, ...row } : x)) : [row, ...c];
    });
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">LMS</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build courses; published ones are auto-recommended to users by skill-gap overlap.</p>
        </div>
        {!creating && !editing && <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}><Plus size={14} />New course</Button>}
      </div>

      {(creating || editing) && (
        <Editor
          skills={skills}
          initial={editing ?? undefined}
          onSaved={afterSave}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}

      <div className="overflow-hidden rounded-[14px] border bg-[var(--surface)]">
        {courses.map((c) => (
          <div key={String(c.id)} className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                {String(c.title)}
                <span className={`rounded px-1.5 text-[10px] font-semibold ${c.published ? "bg-[var(--positive-soft)] text-[var(--positive)]" : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>{c.published ? "published" : "draft"}</span>
              </p>
              <p className="text-xs text-[var(--muted)]">{String(c.track)} · {String(c.level)} · {Number(c.lessons)} lessons · {Number(c.enrollments)} enrolled</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(String(c.id))} disabled={loadingId === c.id}>{loadingId === c.id ? <LoaderCircle size={13} className="animate-spin" /> : "Edit"}</Button>
              <button onClick={() => remove(String(c.id))} className="grid size-8 place-items-center rounded-[8px] text-[var(--muted)] hover:text-[var(--critical)]"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!courses.length && <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No courses yet.</p>}
      </div>
    </div>
  );
}
