import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { quizId, answers } = await req.json();

    if (!quizId || !answers) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    // Fetch quiz questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Grade answers
    let score = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });

    // Save result
    const result = await prisma.result.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score,
        totalQuestions,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ score, totalQuestions, resultId: result.id });
  } catch (error) {
    console.error("[QUIZ_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
