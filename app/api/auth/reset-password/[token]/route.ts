import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { password } = await req.json();
    const { token } = await params;

    if (!password) {
        return NextResponse.json({ message: "Secret Phrase is required." }, { status: 400 });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await connectToDatabase();

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: "This path has faded away or is invalid." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({ message: "Your Secret Phrase has been forged anew." }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}