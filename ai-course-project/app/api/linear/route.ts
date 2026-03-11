import { NextRequest, NextResponse } from "next/server";
import { LINEAR_ASSIGNED_QUERY } from "@/lib/linear";

export async function GET(_req: NextRequest) {
  const apiKey = process.env.LINEAR_PERSONAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { connected: false, issues: [] },
      { status: 200 }
    );
  }

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: LINEAR_ASSIGNED_QUERY }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { connected: true, issues: [] },
        { status: 200 }
      );
    }

    const json = await res.json();
    const issues = json?.data?.viewer?.assignedIssues?.nodes ?? [];

    return NextResponse.json(
      { connected: true, issues },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=300" },
      }
    );
  } catch {
    return NextResponse.json(
      { connected: true, issues: [] },
      { status: 200 }
    );
  }
}
