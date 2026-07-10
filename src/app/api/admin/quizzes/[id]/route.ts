import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    await prisma.quiz.delete({
      where: {
        id,
      },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      description,
      isTimerEnabled,
      timeLimitMinutes,
      shuffleQuestions,
      shuffleAnswers,
      showPlayerAnalytics,
    } = body;

    const quiz = await prisma.quiz.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        isTimerEnabled,
        timeLimitMinutes,
        shuffleQuestions,
        shuffleAnswers,
        showPlayerAnalytics,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
