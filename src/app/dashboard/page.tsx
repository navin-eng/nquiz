import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuizDisplay } from "@/components/dashboard/QuizDisplay";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const [quizzes, results] = await Promise.all([
    prisma.quiz.findMany({
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.result.findMany({
      where: { userId: session.user.id },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    })
  ]);

  const validQuizzes = quizzes.filter(q => q._count.questions > 0);

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <section>
        <div className="mb-6">
          <h1 className="heading-1 mb-2">Available Quizzes</h1>
          <p className="section-kicker">Pick a quiz, get instant feedback, and review every explanation when you finish.</p>
        </div>
        <QuizDisplay quizzes={validQuizzes} />
      </section>

      <section>
        <h2 className="heading-2 mb-6">Your Recent Results</h2>
        {results.length === 0 ? (
          <div className="glass-panel glass-card text-center text-gray-400 py-10">
            You have not taken any quizzes yet.
          </div>
        ) : (
          <div className="glass-panel glass-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-4 font-medium">Quiz</th>
                  <th className="p-4 font-medium">Score</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const percentage = Math.round((r.score / r.totalQuestions) * 100);
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium">{r.quiz.title}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${percentage >= 70 ? 'bg-success/20 text-success-light' : percentage >= 40 ? 'bg-warning/20 text-warning-light' : 'bg-danger/20 text-danger-light'}`}>
                          {r.score} / {r.totalQuestions} ({percentage}%)
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(r.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
