import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { sendEmail } from "@/utils/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "No tale found under this inscription." }, { status: 404 });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiration (10 minutes)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset url
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const message = `You requested to restore your secret phrase for the Astral Loom.\n\nRewrite your destiny by following this path: \n\n${resetUrl}\n\nIf you did not request this, simply ignore this parchment.`;

    try {
      await sendEmail({
        to: user.email,
        subject: "The Astral Loom: Restore Secret Phrase",
        text: message,
      });

      return NextResponse.json({ message: "A raven has been sent to your inscribed email." }, { status: 200 });
    } catch (error) {
      console.error(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      return NextResponse.json({ message: "Email could not be dispatched." }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}