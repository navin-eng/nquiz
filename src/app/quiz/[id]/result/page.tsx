import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuizResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resultId?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) return notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true },
  });

  if (!quiz) return notFound();

  let score = 0;
  let total = quiz.questions.length;
  let userAnswers: Record<string, number> = {};

  if (resolvedSearchParams.resultId) {
    const result = await prisma.result.findUnique({
      where: { id: resolvedSearchParams.resultId },
    });
    if (result && result.userId === session.user.id) {
      score = result.score;
      total = result.totalQuestions;
      if (result.answers) {
        userAnswers = JSON.parse(result.answers);
      }
    }
  }

  const percentage = Math.round((score / total) * 100) || 0;

  let message = "";
  let suggestion = "";
  let colorClass = "";

  if (percentage >= 80) {
    message = "Excellent Work!";
    suggestion = "You have a solid understanding of these concepts.";
    colorClass = "text-success-light";
  } else if (percentage >= 50) {
    message = "Good Job!";
    suggestion = "You did well, but review the topics you struggled with below.";
    colorClass = "text-warning-light";
  } else {
    message = "Keep Trying!";
    suggestion = "Review the explanations below and attempt the quiz again.";
    colorClass = "text-danger-light";
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="glass-panel glass-card w-full text-center mb-8">
        <Trophy size={64} className={`mx-auto mb-6 ${colorClass}`} />
        
        <h1 className="heading-1 !text-4xl mb-2">{message}</h1>
        <p className="text-gray-400 mb-8">You completed: {quiz.title}</p>
        
        <div className="text-6xl font-black mb-2 text-gradient">
          {score} <span className="text-3xl text-gray-500">/ {total}</span>
        </div>
        <p className={`text-xl font-bold mb-8 ${colorClass}`}>
          {percentage}% Score
        </p>

        <div className="stat-card text-left mb-8 flex gap-4 items-start max-w-2xl mx-auto">
          <Lightbulb className="text-primary shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold mb-1">Improvement Suggestion</h4>
            <p className="text-sm text-gray-300">{suggestion}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Link href="/dashboard" className="btn btn-secondary flex-1 justify-center">
            <ArrowLeft size={18} /> Dashboard
          </Link>
          <Link href={`/quiz/${quiz.id}`} className="btn btn-primary flex-1 justify-center">
            Retake Quiz
          </Link>
        </div>
      </div>

      {Object.keys(userAnswers).length > 0 && (
        <div className="w-full mt-4 flex flex-col gap-6">
          <h2 className="text-2xl font-bold mb-2">Review Your Answers</h2>
          {quiz.questions.map((q, idx) => {
            const userAnswerIdx = userAnswers[q.id];
            const isCorrect = userAnswerIdx === q.correctOptionIndex;
            const options = JSON.parse(q.options);

            return (
              <div key={q.id} className="glass-panel glass-card flex flex-col gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${isCorrect ? 'bg-success' : 'bg-danger'}`}></div>
                <div className="flex items-start gap-4 pl-2">
                  <div className="mt-1 shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="text-success" size={24} />
                    ) : (
                      <XCircle className="text-danger" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-4">
                      {idx + 1}. {q.text}
                    </h3>
                    <div className="flex flex-col gap-2 mb-4">
                      {options.map((opt: string, optIdx: number) => {
                        let optClass = "";
                        if (optIdx === q.correctOptionIndex) {
                          optClass = "is-correct";
                        } else if (optIdx === userAnswerIdx && !isCorrect) {
                          optClass = "is-wrong";
                        } else {
                          optClass = "is-muted";
                        }

                        return (
                          <div key={optIdx} className={`option-button ${optClass}`}>
                            <span>{opt}</span>
                            {optIdx === q.correctOptionIndex && <CheckCircle2 size={16} />}
                            {optIdx === userAnswerIdx && !isCorrect && <XCircle size={16} />}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex gap-3 items-start mt-4">
                        <Lightbulb className="text-primary mt-0.5 shrink-0" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-primary mb-1">Explanation</p>
                          <p className="text-sm text-gray-300">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
