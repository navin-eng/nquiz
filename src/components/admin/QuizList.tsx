"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ListChecks, Plus, Settings, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      toast.success("Quiz created!");
      router.push(`/admin/quiz/${created.id}`);
    } else {
      toast.error("Failed to create quiz");
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setQuizzes(quizzes.filter(q => q.id !== id));
      toast.success("Quiz deleted");
      router.refresh();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="heading-2">Your Quizzes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Quiz Card */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="glass-panel glass-card interactive-card flex flex-col justify-center items-center cursor-pointer min-h-[220px] border-2 border-dashed border-white/20 hover:border-primary/50 group"
        >
          <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-200 group-hover:text-white transition-colors">Create New Quiz</h3>
        </div>

        {/* Existing Quizzes */}
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-panel glass-card flex flex-col justify-between min-h-[220px]">
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

      {/* Create Quiz Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel glass-card w-full max-w-md relative animate-slide-up">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="heading-2 mb-6">Create New Quiz</h2>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Title</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  className="input-field" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., General Knowledge 2024" 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea 
                  className="input-field min-h-[100px] resize-none" 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this quiz about?" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary py-2">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn btn-primary py-2">
                  <Plus size={18} />
                  {isCreating ? "Creating..." : "Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
