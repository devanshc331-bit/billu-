import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
    }
    
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximum file size is 20 MB." }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    // pdf-parse v1 exports a simple async function
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    let text: string = data.text;
    
    text = text.replace(/\s+/g, ' ').trim();
    
    if (!text) {
      return NextResponse.json({ error: "No readable text was found in the document." }, { status: 400 });
    }
    
    return NextResponse.json({ text, filename: file.name });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: "Failed to extract text from file." }, { status: 500 });
  }
}
