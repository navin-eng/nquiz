"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ListChecks, PlayCircle, Grid, List as ListIcon } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  isTimerEnabled: boolean;
  timeLimitMinutes: number | null;
  _count: { questions: number };
};

export function QuizDisplay({ quizzes }: { quizzes: Quiz[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (quizzes.length === 0) {
    return (
      <div className="glass-panel glass-card text-center text-gray-400 py-10">
        No quizzes are available right now. Check back later.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="section-kicker">{quizzes.length} ready-to-play quiz{quizzes.length === 1 ? "" : "zes"}</p>
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
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel glass-card interactive-card flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {quiz.description || "No description provided."}
                </p>
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
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel glass-card interactive-card flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{quiz.title}</h3>
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
