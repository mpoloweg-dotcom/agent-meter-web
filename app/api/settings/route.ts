import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Strategy = "patient" | "fast";

async function ensureSettingsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS agent_settings (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      strategy TEXT NOT NULL DEFAULT 'patient'
               CHECK (strategy IN ('patient', 'fast')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    INSERT INTO agent_settings (id, strategy)
    VALUES (1, 'patient')
    ON CONFLICT (id) DO NOTHING
  `);
  await query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS source_system TEXT`);
}

async function getSettingsResponse() {
  const [settings] = await query<{ strategy: Strategy; updated_at: string }>(`
    SELECT strategy, updated_at
    FROM agent_settings
    WHERE id = 1
  `);
  const [usage] = await query<{ patient_used: string; fast_used: string }>(`
    SELECT
      COUNT(*) FILTER (
        WHERE timestamp >= NOW() - INTERVAL '7 days'
          AND source_system = 'agent-meter'
      ) AS patient_used,
      COUNT(*) FILTER (
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
          AND source_system = 'agent-meter'
      ) AS fast_used
    FROM trades
  `);

  const strategy = settings?.strategy === "fast" ? "fast" : "patient";
  const patientUsed = Number(usage?.patient_used ?? 0);
  const fastUsed = Number(usage?.fast_used ?? 0);
  return {
    strategy,
    updatedAt: settings?.updated_at ?? null,
    checkIntervalMinutes: 15,
    sources: ["Bloomberg", "Reuters", "Trading Economics"],
    tactics: {
      patient: { limit: 3, windowHours: 168, used: patientUsed },
      fast: { limit: 3, windowHours: 24, used: fastUsed },
    },
  };
}

export async function GET() {
  try {
    await ensureSettingsSchema();
    return NextResponse.json(await getSettingsResponse());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: { strategy?: unknown } = await request.json();
    if (body.strategy !== "patient" && body.strategy !== "fast") {
      return NextResponse.json({ error: "Nepoznata taktika." }, { status: 400 });
    }

    await ensureSettingsSchema();
    await query(
      `UPDATE agent_settings
       SET strategy = $1, updated_at = NOW()
       WHERE id = 1`,
      [body.strategy]
    );
    return NextResponse.json(await getSettingsResponse());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
