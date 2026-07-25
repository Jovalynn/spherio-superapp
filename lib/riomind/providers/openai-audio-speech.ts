import OpenAI from "openai";

export async function speakTextWithOpenAI(text: string, language = "en", voice = "alloy") {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const openai = new OpenAI({ apiKey });

  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice as any,
    input: text,
    instructions: `Speak naturally and clearly in ${language}. Keep the meaning faithful to the meeting transcript.`,
    response_format: "mp3",
  });

  const arrayBuffer = await audio.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
