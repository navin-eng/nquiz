"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, Clock, Save, Shuffle, Trash2 } from "lucide-react";
import { QuestionUpload } from "./QuestionUpload";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
};

type QuizType = {
  id: string;
  title: string;
  description: string | null;
  isTimerEnabled: boolean;
  timerType: string;
  timeLimitMinutes: number | null;
  timeLimitPerQuestion: number | null;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showPlayerAnalytics: boolean;
  tags: string[];
  questions: Question[];
};

export function QuizEditor({ quiz }: { quiz: QuizType }) {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    title: quiz.title,
    description: quiz.description || "",
    isTimerEnabled: quiz.isTimerEnabled,
    timerType: quiz.timerType,
    timeLimitMinutes: quiz.timeLimitMinutes || 5,
    timeLimitPerQuestion: quiz.timeLimitPerQuestion || 30,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleAnswers: quiz.shuffleAnswers,
    showPlayerAnalytics: quiz.showPlayerAnalytics,
    tags: quiz.tags || [],
  });

  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !settings.tags.includes(val)) {
        setSettings({ ...settings, tags: [...settings.tags, val] });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSettings({ ...settings, tags: settings.tags.filter(t => t !== tagToRemove) });
  };

  const saveSettings = async () => {
    setSaving(true);
    await fetch(`/api/admin/quizzes/${quiz.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    router.refresh();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Settings Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="glass-panel glass-card">
          <h2 className="heading-2 mb-4">Quiz Settings</h2>
          
          <div className="input-group">
            <label className="input-label">Title</label>
            <input 
              type="text" 
              className="input-field" 
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea 
              className="input-field min-h-[100px] resize-y" 
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.tags.map((tag, idx) => (
                <div key={idx} className="bg-primary/20 text-primary-light border border-primary/30 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="hover:text-white transition-colors ml-1"
                    title="Remove tag"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <input 
              type="text" 
              className="input-field" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type a tag and press Enter"
            />
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <label className="stat-card flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.isTimerEnabled}
                onChange={(e) => setSettings({ ...settings, isTimerEnabled: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <Clock size={17} className="text-primary" />
              <span className="font-medium">Enable Timer</span>
            </label>
            
            {settings.isTimerEnabled && (
              <div className="flex flex-col gap-3 ml-7 mb-3 p-3 bg-black/10 border border-white/5 rounded-xl">
                <div className="input-group !mb-0">
                  <label className="input-label text-xs">Timer Type</label>
                  <select 
                    className="input-field bg-surface-strong"
                    value={settings.timerType}
                    onChange={(e) => setSettings({ ...settings, timerType: e.target.value })}
                  >
                    <option value="GLOBAL">Entire Quiz Timer</option>
                    <option value="PER_QUESTION">Per-Question Timer</option>
                  </select>
                </div>
                
                {settings.timerType === "GLOBAL" ? (
                  <div className="input-group !mb-0">
                    <label className="input-label text-xs">Time Limit (Minutes)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field bg-surface-strong" 
                      value={settings.timeLimitMinutes}
                      onChange={(e) => setSettings({ ...settings, timeLimitMinutes: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                ) : (
                  <div className="input-group !mb-0">
                    <label className="input-label text-xs">Seconds Per Question</label>
                    <input 
                      type="number" 
                      min="5"
                      className="input-field bg-surface-strong" 
                      value={settings.timeLimitPerQuestion}
                      onChange={(e) => setSettings({ ...settings, timeLimitPerQuestion: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                )}
              </div>
            )}

            <label className="stat-card flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.shuffleQuestions}
                onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <Shuffle size={17} className="text-primary" />
              <span className="font-medium">Shuffle Questions</span>
            </label>

            <label className="stat-card flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.shuffleAnswers}
                onChange={(e) => setSettings({ ...settings, shuffleAnswers: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <Shuffle size={17} className="text-primary" />
              <span className="font-medium">Shuffle Answers</span>
            </label>

            <label className="stat-card flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPlayerAnalytics}
                onChange={(e) => setSettings({ ...settings, showPlayerAnalytics: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <BarChart3 size={17} className="text-primary" />
              <span className="font-medium">Show Player Analytics</span>
            </label>
          </div>

          <button onClick={saveSettings} disabled={saving} className="btn btn-primary w-full justify-center">
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Questions Column */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        <QuestionUpload quizId={quiz.id} />

        <div className="glass-panel glass-card">
          <h2 className="heading-2 mb-4">Questions ({quiz.questions.length})</h2>
          
          {quiz.questions.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No questions added yet. Add some above!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="stat-card relative group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-semibold text-lg">{idx + 1}. {q.text}</h3>
                    <button 
                      onClick={() => deleteQuestion(q.id)}
                      className="icon-btn shrink-0"
                      title="Delete question"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${oIdx === q.correctOptionIndex ? "bg-success/20 border-success/50 text-success-light" : "bg-black/20 border-white/10"}`}>
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {oIdx === q.correctOptionIndex && <CheckCircle2 size={16} className="shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
