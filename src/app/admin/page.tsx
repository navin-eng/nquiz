import { prisma } from "@/lib/prisma";
import { QuizList } from "@/components/admin/QuizList";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true, results: true },
      },
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="heading-1 mb-2">Admin Dashboard</h1>
          <p className="section-kicker">Create, tune, import, and review quizzes from one focused workspace.</p>
        </div>
      </div>
      
      <QuizList initialQuizzes={quizzes} />
    </div>
  );
}
