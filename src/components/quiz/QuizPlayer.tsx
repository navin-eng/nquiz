"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bell, CheckCircle2, XCircle, Clock, ChevronRight, ChevronLeft, Maximize, Minimize, Lightbulb } from "lucide-react";

type SafeQuestion = {
  id: string;
  text: string;
  explanation?: string | null;
  options: string[];
  correctOptionIndex?: number;
};

type SafeQuiz = {
  id: string;
  title: string;
  isTimerEnabled: boolean;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showPlayerAnalytics: boolean;
  questions: SafeQuestion[];
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function QuizPlayer({ quiz }: { quiz: SafeQuiz }) {
  const router = useRouter();

  const preparedQuestions = useMemo(() => {
    let qs = quiz.questions.map(q => {
      let opts = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
      if (quiz.shuffleAnswers) {
        opts = shuffleArray(opts);
      }
      return { ...q, displayOptions: opts };
    });
    if (quiz.shuffleQuestions) {
      qs = shuffleArray(qs);
    }
    return qs;
  }, [quiz]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.isTimerEnabled && quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsPosition, setAnalyticsPosition] = useState<{ x: number; y: number } | null>(null);
  const analyticsDragRef = useRef<{ offsetX: number; offsetY: number; width: number; height: number } | null>(null);

  const clampAnalyticsPosition = useCallback((x: number, y: number, width: number, height: number) => {
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers }),
      });

      if (res.ok) {
        const data = await res.json();
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        router.push(`/quiz/${quiz.id}/result?resultId=${data.resultId}`);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [answers, quiz.id, router, submitting]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      const submitTimer = window.setTimeout(() => {
        void handleSubmit();
      }, 0);
      return () => window.clearTimeout(submitTimer);
    }
    const timer = setInterval(() => setTimeLeft((t) => (t ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [handleSubmit, timeLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!analyticsPosition) return;

    const handleResize = () => {
      setAnalyticsPosition((position) => {
        if (!position) return position;
        const dragBox = analyticsDragRef.current;
        return clampAnalyticsPosition(position.x, position.y, dragBox?.width ?? 84, dragBox?.height ?? 150);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [analyticsPosition, clampAnalyticsPosition]);

  const handleAnalyticsPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    const rect = event.currentTarget.getBoundingClientRect();
    analyticsDragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setAnalyticsPosition(clampAnalyticsPosition(rect.left, rect.top, rect.width, rect.height));
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAnalyticsPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragBox = analyticsDragRef.current;
    if (!dragBox) return;

    event.preventDefault();
    setAnalyticsPosition(
      clampAnalyticsPosition(
        event.clientX - dragBox.offsetX,
        event.clientY - dragBox.offsetY,
        dragBox.width,
        dragBox.height
      )
    );
  };

  const handleAnalyticsPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    analyticsDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleSelect = (questionId: string, originalIndex: number) => {
    // If the answer is already selected, don't allow changing it (locking mechanism for real-time feedback)
    if (answers[questionId] !== undefined) return;
    setAnswers({ ...answers, [questionId]: originalIndex });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const stats = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    
    preparedQuestions.forEach(q => {
      const ans = answers[q.id];
      if (ans !== undefined) {
        attempted++;
        if (q.correctOptionIndex === ans) correct++;
        else wrong++;
      }
    });

    return { attempted, correct, wrong, remaining: preparedQuestions.length - attempted };
  }, [answers, preparedQuestions]);

  const currentQ = preparedQuestions[currentIndex];
  const isLast = currentIndex === preparedQuestions.length - 1;
  const progress = Math.round(((currentIndex + 1) / preparedQuestions.length) * 100);

  if (submitting) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="glass-panel text-center animate-pulse">
          <h2 className="heading-2">Submitting Quiz...</h2>
          <p className="text-gray-400">Evaluating your answers.</p>
        </div>
      </div>
    );
  }

  const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  const analyticsPanel = (
    <>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider flex items-center gap-2"><BarChart3 size={16} /> Live Analytics</h3>
        <span className="pill text-primary">{accuracy}% Accuracy</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${(stats.attempted / preparedQuestions.length) * 100}%` }}></div>
          <div className="text-xs text-gray-400 mb-1">Attempted</div>
          <div className="text-2xl font-bold">{stats.attempted}</div>
        </div>
        <div className="stat-card text-center bg-success/10 border-success/20">
          <div className="text-xs text-success-light mb-1">Correct</div>
          <div className="text-2xl font-bold text-success">{stats.correct}</div>
        </div>
        <div className="stat-card text-center bg-danger/10 border-danger/20">
          <div className="text-xs text-danger-light mb-1">Wrong</div>
          <div className="text-2xl font-bold text-danger">{stats.wrong}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-xs text-gray-400 mb-1">Remaining</div>
          <div className="text-2xl font-bold">{stats.remaining}</div>
        </div>
      </div>
    </>
  );

  return (
    <div className={`w-full animate-fade-in ${isFullscreen ? 'h-screen flex flex-col justify-center items-center bg-black p-4 z-50 fixed inset-0 overflow-y-auto' : 'max-w-4xl mx-auto mt-8 px-4'}`}>
      <div className={`w-full ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
        <div className="glass-panel glass-card mb-6 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <div className="text-sm text-gray-400">
              Question {currentIndex + 1} of {preparedQuestions.length}
            </div>
            </div>
            <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <div className={`pill font-mono text-lg ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                  <Clock size={20} />
                  {formatTime(timeLeft)}
                </div>
              )}
              <button 
                onClick={toggleFullscreen}
                className="icon-btn"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
          <div className="bg-black/20 rounded-lg overflow-hidden h-1">
            <div className="h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {isLast && (
          <div className="glass-panel glass-card mb-6 p-4">
            {analyticsPanel}
          </div>
        )}

        <div className="glass-panel glass-card mb-6">
          <h2 className="text-2xl font-semibold mb-6">{currentQ.text}</h2>
          <div className="flex flex-col gap-3">
            {currentQ.displayOptions.map((opt) => {
              const hasAnswered = answers[currentQ.id] !== undefined;
              const isSelected = answers[currentQ.id] === opt.originalIndex;
              const isCorrectOption = currentQ.correctOptionIndex === opt.originalIndex;
              
              let optionClass = "";
              let Icon = null;

              if (hasAnswered) {
                if (isSelected && isCorrectOption) {
                  optionClass = "is-correct";
                  Icon = <CheckCircle2 className="text-success shrink-0" />;
                } else if (isSelected && !isCorrectOption) {
                  optionClass = "is-wrong";
                  Icon = <XCircle className="text-danger shrink-0" />;
                } else if (!isSelected && isCorrectOption) {
                  optionClass = "is-correct";
                  Icon = <CheckCircle2 className="text-success/50 shrink-0" />;
                } else {
                  optionClass = "is-muted";
                }
              }

              return (
                <button
                  key={opt.originalIndex}
                  onClick={() => handleSelect(currentQ.id, opt.originalIndex)}
                  disabled={hasAnswered}
                  className={`option-button ${optionClass}`}
                >
                  <span>{opt.text}</span>
                  {Icon}
                </button>
              );
            })}
          </div>
          
          {currentQ.explanation && (
            <div className="mt-6">
              {!showExplanation ? (
                <button 
                  onClick={() => setShowExplanation(true)}
                  className="btn btn-secondary text-sm"
                >
                  <Lightbulb size={16} /> Show Hint / Explanation
                </button>
              ) : (
                <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex gap-3 items-start animate-fade-in">
                  <Lightbulb className="text-primary mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Explanation</p>
                    <p className="text-sm text-gray-300">{currentQ.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => {
              setShowExplanation(false);
              setCurrentIndex((i) => Math.max(0, i - 1));
            }}
            disabled={currentIndex === 0}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {isLast ? (
            <button 
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={Object.keys(answers).length < preparedQuestions.length}
            >
              Submit Quiz <CheckCircle2 size={18} />
            </button>
          ) : (
            <button
              onClick={() => {
                setShowExplanation(false);
                setCurrentIndex((i) => Math.min(preparedQuestions.length - 1, i + 1));
              }}
              className="btn btn-primary"
            >
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
        
        {isLast && Object.keys(answers).length < preparedQuestions.length && (
          <p className="text-sm text-warning mt-4 text-center">
            Please answer all questions before submitting.
          </p>
        )}
      </div>
      {quiz.showPlayerAnalytics && !isLast && (
        <div
          className={`analytics-widget ${analyticsOpen ? "is-open" : ""} ${analyticsPosition ? "is-dragged" : ""}`}
          onPointerDown={handleAnalyticsPointerDown}
          onPointerMove={handleAnalyticsPointerMove}
          onPointerUp={handleAnalyticsPointerUp}
          onPointerCancel={handleAnalyticsPointerUp}
          style={
            analyticsPosition
              ? { left: analyticsPosition.x, top: analyticsPosition.y, right: "auto", transform: "none" }
              : undefined
          }
        >
          {analyticsOpen && (
            <div
              className="glass-panel glass-card analytics-popover animate-fade-in"
              id="live-analytics-panel"
            >
              {analyticsPanel}
            </div>
          )}
          <div className="analytics-rail">
            <button
              type="button"
              className="analytics-bell"
              onClick={() => setAnalyticsOpen(true)}
              aria-label="Show live analytics"
            >
              <Bell size={15} />
            </button>
            <button
              type="button"
              className="analytics-toggle"
              onClick={() => setAnalyticsOpen((open) => !open)}
              aria-controls="live-analytics-panel"
              aria-expanded={analyticsOpen}
              aria-label={analyticsOpen ? "Hide live analytics" : "Show live analytics"}
            >
              {analyticsOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
