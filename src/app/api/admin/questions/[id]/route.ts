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

    await prisma.question.delete({
      where: {
        id,
      },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[QUESTION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
