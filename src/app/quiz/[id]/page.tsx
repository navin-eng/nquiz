import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true },
  });

  if (!quiz || quiz.questions.length === 0) {
    return notFound();
  }

  const safeQuestions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    explanation: q.explanation,
    options: JSON.parse(q.options) as string[],
    correctOptionIndex: q.correctOptionIndex,
  }));

  const safeQuiz = {
    id: quiz.id,
    title: quiz.title,
    isTimerEnabled: quiz.isTimerEnabled,
    timerType: quiz.timerType,
    timeLimitMinutes: quiz.timeLimitMinutes,
    timeLimitPerQuestion: quiz.timeLimitPerQuestion,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleAnswers: quiz.shuffleAnswers,
    showPlayerAnalytics: quiz.showPlayerAnalytics,
    questions: safeQuestions,
  };

  return <QuizPlayer quiz={safeQuiz} />;
}
