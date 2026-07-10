import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type QuestionPayload = {
  text: string;
  explanation?: string;
  options: string[];
  correctOptionIndex: number;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { quizId, questions } = await req.json();
    console.log("RECEIVED QUESTIONS PAYLOAD:", JSON.stringify(questions, null, 2));

    if (!quizId || !Array.isArray(questions)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    const createdQuestions = await prisma.$transaction(
      (questions as QuestionPayload[]).map((q) =>
        prisma.question.create({
          data: {
            quizId,
            text: q.text,
            explanation: q.explanation || null,
            options: JSON.stringify(q.options),
            correctOptionIndex: q.correctOptionIndex,
          },
        })
      )
    );

    return NextResponse.json(createdQuestions, { status: 201 });
  } catch (error) {
    console.error("[QUESTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
