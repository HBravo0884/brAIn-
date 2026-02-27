import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { jsPDF } from 'jspdf';

/**
 * Export data as a Word document
 * @param {object} data - The data to export
 * @param {string} filename - The filename for the export
 */
export const exportToWord = async (data) => {
  try {
    const sections = [];

    // Title
    sections.push(
      new Paragraph({
        text: data.title || 'Document',
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Add fields
    if (data.fields) {
      data.fields.forEach(field => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: field.label + ': ',
                bold: true,
              }),
              new TextRun({
                text: field.value || '',
              }),
            ],
          })
        );
        sections.push(new Paragraph({ text: '' })); // Empty line
      });
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title || 'document'}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    return false;
  }
};

/**
 * Export data as a PDF
 * @param {object} data - The data to export
 * @param {string} filename - The filename for the export
 */
export const exportToPDF = (data) => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(data.title || 'Document', 20, yPosition);
    yPosition += 15;

    // Add fields
    if (data.fields) {
      doc.setFontSize(12);
      data.fields.forEach(field => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        // Label
        doc.setFont(undefined, 'bold');
        doc.text(field.label + ':', 20, yPosition);
        yPosition += 7;

        // Value
        doc.setFont(undefined, 'normal');
        const value = field.value || 'N/A';
        const lines = doc.splitTextToSize(value, 170);
        lines.forEach(line => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 7;
        });

        yPosition += 5; // Extra spacing between fields
      });
    }

    // Save
    doc.save(`${data.title || 'document'}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

/**
 * Export data as JSON
 * @param {object} data - The data to export
 * @param {string} filename - The filename for the export
 */
export const exportToJSON = (data, filename = 'data.json') => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return false;
  }
};

/**
 * Generate document from template with filled data
 * @param {object} template - The template to use
 * @param {object} data - The data to fill the template with
 */
export const generateFromTemplate = (template, data) => {
  const filledFields = template.fields.map(field => ({
    label: field.label,
    value: data[field.id] || '',
    type: field.type,
  }));

  return {
    title: template.name,
    fields: filledFields,
    generatedDate: new Date().toISOString(),
  };
};
