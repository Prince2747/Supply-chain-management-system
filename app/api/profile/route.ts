import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile from the database using Prisma
    const profile = await prisma.profile.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        warehouseId: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
          }
        }
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      warehouseId: profile.warehouseId,
      warehouse: profile.warehouse,
    });

  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}