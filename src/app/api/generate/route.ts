import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: "Please upload a file or paste notes." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_key' || process.env.GEMINI_API_KEY.includes('sk-')) {
      return NextResponse.json({ error: "Gemini API Key is missing or invalid! Please get a free key from Google AI Studio and put it in .env.local as GEMINI_API_KEY." }, { status: 401 });
    }

    const prompt = `You are an expert AI Study Assistant.
I will provide you with some study material (notes or extracted text).
Please generate the following structured study aids from the content exactly matching this JSON format. Do not return markdown blocks, ONLY return raw JSON.

{
  "summary": "string (150-300 words, beginner-friendly, overview, main concepts, conclusions)",
  "keyPoints": [
    { "title": "string", "explanation": "string" }
  ],
  "flashcards": [
    { "front": "string", "back": "string" }
  ],
  "quiz": [
    {
      "question": "string",
      "type": "mcq" | "short_answer",
      "options": ["string", "string", "string", "string"], // only for mcq
      "correctAnswer": "string",
      "explanation": "string"
    }
  ],
  "revisionSheet": {
    "definitions": [{ "term": "string", "definition": "string" }],
    "formulas": [{ "name": "string", "formula": "string" }],
    "dates": [{ "event": "string", "date": "string" }],
    "vocabulary": [{ "word": "string", "meaning": "string" }],
    "importantFacts": ["string", "string"],
    "conceptsToMemorize": ["string", "string"]
  }
}

Content to process:
${text}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const textOutput = response.text();
    
    if (!textOutput) {
      throw new Error("Failed to parse data");
    }

    const parsedData = JSON.parse(textOutput);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Generation error:", error);
    
    if (error.message?.includes('API key not valid')) {
      return NextResponse.json({ error: "The provided Gemini API key is invalid." }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to generate study materials." }, { status: 500 });
  }
}
