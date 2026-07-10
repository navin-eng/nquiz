"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ListChecks, Plus, Settings, Trash2 } from "lucide-react";

type QuizWithCounts = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  _count: {
    questions: number;
    results: number;
  };
};

export function QuizList({ initialQuizzes }: { initialQuizzes: QuizWithCounts[] }) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    
    setIsCreating(true);
    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc }),
    });

    if (res.ok) {
      const created = await res.json();
      router.push(`/admin/quiz/${created.id}`);
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setQuizzes(quizzes.filter(q => q.id !== id));
      router.refresh();
    }
  };

  return (
    <div>
      <div className="glass-panel glass-card mb-8">
        <h2 className="heading-2 mb-4">Create New Quiz</h2>
        <form onSubmit={handleCreate} className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="input-group flex-1 !mb-0">
            <label className="input-label">Title</label>
            <input 
              type="text" 
              required
              className="input-field" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., General Knowledge 2024" 
            />
          </div>
          <div className="input-group flex-1 !mb-0">
            <label className="input-label">Description</label>
            <input 
              type="text" 
              className="input-field" 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description" 
            />
          </div>
          <button type="submit" disabled={isCreating} className="btn btn-primary h-[46px] w-full lg:w-auto">
            <Plus size={18} />
            {isCreating ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <h2 className="heading-2 mb-4">Your Quizzes</h2>
      {quizzes.length === 0 ? (
        <div className="text-gray-400 text-center py-10 glass-panel">
          No quizzes found. Create one above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel glass-card interactive-card flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {quiz.description || "No description provided."}
                </p>
                <div className="flex gap-3 text-sm text-gray-300 mb-6">
                  <span className="pill"><ListChecks size={15} /> {quiz._count.questions} Questions</span>
                  <span className="pill"><BarChart3 size={15} /> {quiz._count.results} Plays</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <Link href={`/admin/quiz/${quiz.id}`} className="btn btn-secondary text-sm px-3 py-1.5 flex-1 mr-2 justify-center">
                  <Settings size={16} />
                  Manage
                </Link>
                <button onClick={() => handleDelete(quiz.id)} className="btn btn-danger px-3 py-1.5" title="Delete quiz">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
