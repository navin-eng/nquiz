import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuizEditor } from "@/components/admin/QuizEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuizAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    return notFound();
  }

  // Convert options back to array for the client
  const mappedQuiz = {
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      options: JSON.parse(q.options) as string[],
    })),
  };

  return (
    <div className="animate-fade-in">
      <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary-hover mb-6 transition-colors font-medium">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="heading-1 mb-2">Edit Quiz: {quiz.title}</h1>
        <p className="section-kicker">Tune the quiz experience, import questions, and keep answer options ready for players.</p>
      </div>

      <QuizEditor quiz={mappedQuiz} />
    </div>
  );
}
