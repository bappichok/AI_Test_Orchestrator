import express from 'express';
import { marked } from 'marked';
import HTMLToDOCX from 'html-to-docx';

const router = express.Router();

router.post('/docx', async (req, res) => {
  const { markdown, title } = req.body;
  
  if (!markdown) {
    return res.status(400).json({ error: 'Markdown content is required' });
  }

  try {
    const htmlString = marked.parse(markdown);
    
    // Add base styling for docx conversion so it looks professional
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #333333; line-height: 1.5; }
            h1 { font-size: 20pt; color: #1a1a1a; margin-bottom: 12pt; border-bottom: 2px solid #4f46e5; padding-bottom: 4pt; font-weight: bold; }
            h2 { font-size: 14pt; color: #4f46e5; margin-top: 18pt; margin-bottom: 8pt; font-weight: bold; }
            h3 { font-size: 12pt; color: #1a1a1a; margin-top: 12pt; margin-bottom: 4pt; font-weight: bold; }
            p { margin-bottom: 10pt; }
            ul, ol { margin-left: 20pt; margin-bottom: 10pt; }
            li { margin-bottom: 4pt; }
            code { font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 2pt 4pt; font-size: 10pt; }
            strong { font-weight: bold; }
            em { font-style: italic; }
          </style>
        </head>
        <body>
          ${htmlString}
        </body>
      </html>
    `;

    const docxBuffer = await HTMLToDOCX(styledHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${title || 'Test_Plan'}.docx"`);
    res.send(docxBuffer);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Failed to generate DOCX document: ' + error.message });
  }
});

export default router;
