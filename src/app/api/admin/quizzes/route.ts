import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description, showPlayerAnalytics, tags } = await req.json();

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        showPlayerAnalytics: showPlayerAnalytics ?? true,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZZES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
