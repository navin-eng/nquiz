"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, ListChecks, PlayCircle, Grid, List as ListIcon, Search, Tag as TagIcon, X } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  isTimerEnabled: boolean;
  timeLimitMinutes: number | null;
  tags: string[];
  _count: { questions: number };
};

export function QuizDisplay({ quizzes }: { quizzes: Quiz[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    return Array.from(new Set(quizzes.flatMap(q => q.tags || []))).sort();
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (q.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (q.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag ? (q.tags || []).includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [quizzes, searchQuery, selectedTag]);

  if (quizzes.length === 0) {
    return (
      <div className="glass-panel glass-card text-center text-gray-400 py-10">
        No quizzes are available right now. Check back later.
      </div>
    );
  }

  return (
    <div>
      <div className="glass-panel glass-card mb-6 p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/10">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text"
            className="w-full bg-black/30 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder-gray-500"
            placeholder="Search quizzes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <TagIcon size={16} className="text-gray-500 hidden md:block" />
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedTag === null ? 'bg-primary text-white' : 'bg-surface border border-white/10 text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedTag === tag ? 'bg-primary text-white' : 'bg-surface border border-white/10 text-gray-400 hover:text-white'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="section-kicker">{filteredQuizzes.length} ready-to-play quiz{filteredQuizzes.length === 1 ? "" : "zes"}</p>
        <div className="segmented-control">
          <button 
            onClick={() => setViewMode("grid")}
            className={`segment-item ${viewMode === "grid" ? "is-active" : ""}`}
            title="Grid View"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`segment-item ${viewMode === "list" ? "is-active" : ""}`}
            title="List View"
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-10">No quizzes match your filters.</div>
          ) : filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel glass-card interactive-card flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {quiz.description || "No description provided."}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(quiz.tags || []).map((tag, idx) => (
                    <span key={idx} className="bg-primary/20 text-primary-light border border-primary/30 rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-300 mb-6 flex gap-3">
                  <span className="pill"><ListChecks size={15} /> {quiz._count.questions} Questions</span>
                  {quiz.isTimerEnabled && <span className="pill"><Clock size={15} /> {quiz.timeLimitMinutes} min</span>}
                </div>
              </div>
              <Link href={`/quiz/${quiz.id}`} className="btn btn-primary w-full justify-center">
                <PlayCircle size={18} />
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No quizzes match your filters.</div>
          ) : filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel glass-card interactive-card flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold">{quiz.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {(quiz.tags || []).map((tag, idx) => (
                      <span key={idx} className="bg-primary/20 text-primary-light border border-primary/30 rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  {quiz.description || "No description provided."}
                </p>
                <div className="text-sm text-gray-300 flex gap-3">
                  <span className="pill"><ListChecks size={15} /> {quiz._count.questions} Questions</span>
                  {quiz.isTimerEnabled && <span className="pill"><Clock size={15} /> {quiz.timeLimitMinutes} min</span>}
                </div>
              </div>
              <Link href={`/quiz/${quiz.id}`} className="btn btn-primary shrink-0">
                <PlayCircle size={18} />
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
