import { askClaude } from './ai';

/**
 * Format a document according to Howard University brand guidelines
 */
export const formatDocumentToHowardStandards = async (documentText, documentType = 'general') => {
  // Read the Howard Identity Guide
  let howardGuideExcerpt = '';

  try {
    // Try to read the guide if available
    const guidePath = '/Users/entreprneuros/Downloads/Howard_Identity_Guide_Update_8_28_25 1.txt';
    // In browser, we'll pass key guidelines directly
    howardGuideExcerpt = `
Howard University Brand Guidelines Summary:

BRAND VOICE:
- Professional, authoritative, and inspiring
- Reflects Howard's legacy of excellence and leadership
- Emphasizes global impact and historical significance
- Uses inclusive, empowering language

WRITING STYLE:
- Clear, concise, and purposeful
- Active voice preferred
- Proper use of Howard University (full name on first reference, then "Howard")
- Capitalize University when referring to Howard University
- Use "Bison" (singular and plural) for athletic references

FORMATTING STANDARDS:
- Headings: Bold, sentence case or title case
- Body text: Professional, academic tone
- Lists: Use bullet points for clarity
- Emphasis: Bold for key terms, italics for emphasis
- Spacing: Clean, well-organized with clear sections

COLORS (for reference):
- Primary: Howard Blue (#003A63), Red (#E51937)
- Secondary: Supporting palette for variety

TYPOGRAPHY:
- Professional, readable fonts
- Consistent hierarchy (H1, H2, body text)
- Adequate spacing and margins

KEY MESSAGING:
- Howard is Essential
- Howard is Global
- Excellence in Truth and Service
- Legacy of leadership and innovation
`;
  } catch (error) {
    console.log('Using default Howard guidelines');
  }

  const prompt = `You are a professional document formatter for Howard University. Your task is to reformat the following document to match Howard University's brand identity and style guidelines.

${howardGuideExcerpt}

DOCUMENT TYPE: ${documentType}

ORIGINAL DOCUMENT:
${documentText}

INSTRUCTIONS:
1. Reformat the document to match Howard University's brand voice and style
2. Ensure proper formatting, headings, and structure
3. Use appropriate Howard terminology and messaging
4. Maintain the core content but improve clarity and professionalism
5. Add proper spacing and organization
6. Use markdown formatting for the output
7. If it's a grant document, ensure it emphasizes Howard's excellence and impact
8. If it's a budget document, ensure clarity and professional presentation
9. If it's a progress report, emphasize achievements and ongoing work

OUTPUT the reformatted document in clean markdown format.`;

  const formattedDocument = await askClaude(prompt, { max_tokens: 8192 });
  return formattedDocument;
};

/**
 * Format multiple document types
 */
export const formatDocumentByType = async (documentText, type) => {
  const typePrompts = {
    'grant-proposal': `Format this as a professional grant proposal following Howard University standards. Emphasize Howard's excellence, research capabilities, and impact.`,
    'progress-report': `Format this as a formal progress report for Howard University. Use clear sections: Executive Summary, Progress on Aims, Budget Status, Challenges, Next Steps.`,
    'budget-justification': `Format this as a detailed budget justification for Howard University. Clearly explain each expense category and its necessity.`,
    'meeting-minutes': `Format this as professional meeting minutes for Howard University. Include: Date, Attendees, Discussion Points, Decisions, Action Items.`,
    'memo': `Format this as an official Howard University memorandum. Include proper header (TO, FROM, DATE, RE) and professional body.`,
    'letter': `Format this as an official Howard University letter. Include proper letterhead format, date, address, salutation, body, and signature block.`,
  };

  const specificPrompt = typePrompts[type] || '';

  const prompt = `You are formatting a document for Howard University.

DOCUMENT TYPE: ${type}

${specificPrompt}

Apply Howard University brand guidelines:
- Professional, authoritative tone
- Clear structure and formatting
- Proper use of Howard University name and branding
- Excellence-focused messaging
- Clean markdown formatting

ORIGINAL DOCUMENT:
${documentText}

OUTPUT the professionally formatted document in markdown.`;

  return await askClaude(prompt, { max_tokens: 8192 });
};

/**
 * Extract text from different file types
 */
export const extractTextFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'd need a PDF library, but for now return message
      resolve('[PDF content - install pdf-parse library for full support]');
    } else if (file.name.endsWith('.docx')) {
      // For DOCX, we'd need mammoth.js, but for now return message
      resolve('[DOCX content - install mammoth library for full support]');
    } else {
      // Try reading as text
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });
};
