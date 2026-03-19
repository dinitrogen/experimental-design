import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY ?? "");

const discordWebhookUrl = defineString("DISCORD_WEBHOOK_URL", { default: "" });

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    rows: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          ivValue: { type: SchemaType.STRING },
          trial1: { type: SchemaType.NUMBER },
          trial2: { type: SchemaType.NUMBER },
          trial3: { type: SchemaType.NUMBER },
          trial4: { type: SchemaType.NUMBER, nullable: true },
          trial5: { type: SchemaType.NUMBER, nullable: true },
        },
        required: ["ivValue", "trial1", "trial2", "trial3"],
      },
    },
    notes: { type: SchemaType.STRING },
  },
  required: ["rows", "notes"],
};

interface GenerateDataInput {
  independentVar: string;
  dependentVar: string;
  controlledVars: string[];
  hypothesis: string;
  procedure: string;
  ivValues: string[];
  numTrials: number;
}

export const generateExperimentData = onCall(
  { cors: true, invoker: "public" },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const input = request.data as GenerateDataInput;

  if (!input.independentVar || !input.dependentVar || !input.ivValues?.length) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const numTrials = Math.min(Math.max(input.numTrials ?? 5, 3), 5);

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt = `You are a Science Olympiad experimental design data simulator.
A student has designed an experiment and needs realistic sample data to practice analyzing.

**Experiment Details:**
- Independent Variable (IV): ${input.independentVar}
- Dependent Variable (DV): ${input.dependentVar}
- Controlled Variables: ${input.controlledVars?.filter(Boolean).join(", ") || "Not specified"}
- Hypothesis: ${input.hypothesis || "Not specified"}
- Procedure: ${input.procedure || "Not specified"}

**Data Requirements:**
- IV Levels: ${input.ivValues.filter(Boolean).join(", ")}
- Trials per level: ${numTrials}

**Instructions:**
Generate realistic numeric data for each IV level and trial. The data should:
1. Show a plausible trend consistent with the hypothesis (if provided)
2. Include natural variation between trials (not identical values)
3. Use realistic units and magnitudes for the DV being measured
4. Occasionally include slight outliers for realism
5. Round values appropriately (e.g., 2 decimal places for most measurements)

Also provide a short "notes" string (2-3 sentences) with qualitative observations a student might make during this experiment (things they would see, hear, or notice).

${numTrials < 4 ? "Set trial4 and trial5 to null." : ""}
${numTrials < 5 ? "Set trial5 to null." : ""}

Return one row per IV level in the same order as provided.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpsError("internal", "AI returned invalid JSON.");
  }
});

// ── Discord Notification Helper ──

async function sendDiscordEmbed(
  title: string,
  color: number,
  fields: { name: string; value: string; inline?: boolean }[],
) {
  const url = discordWebhookUrl.value();
  if (!url) {
    console.log("Discord webhook not configured — skipping notification");
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            color,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    console.log("Discord notification sent:", title);
  } catch (error) {
    console.error("Discord notification failed:", error);
  }
}

// ── Report Submission Notification ──

export const notifyReportSubmitted = onDocumentUpdated(
  "submissions/{submissionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === "submitted" || after.status !== "submitted") return;

    await sendDiscordEmbed("📝 Practice Report Submitted", 0x1565c0, [
      {
        name: "Student",
        value: after.studentDisplayName || after.studentUid || "Unknown",
        inline: true,
      },
      {
        name: "Event",
        value: after.practiceEventId || "Unknown",
        inline: true,
      },
    ]);
  },
);

// ── Task Submission Notification ──

export const notifyTaskSubmitted = onDocumentUpdated(
  "taskSubmissions/{submissionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === "submitted" || after.status !== "submitted") return;

    await sendDiscordEmbed("✅ Task Submitted", 0x2e7d32, [
      {
        name: "Student",
        value: after.studentDisplayName || after.studentUid || "Unknown",
        inline: true,
      },
      {
        name: "Task",
        value: after.taskId || "Unknown",
        inline: true,
      },
    ]);
  },
);
