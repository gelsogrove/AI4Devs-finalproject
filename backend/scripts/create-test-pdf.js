const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createTestPDF() {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    
    // Get a font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add content
    const { width, height } = page.getSize();
    
    // Title
    page.drawText('International Transportation Law', {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Subtitle
    page.drawText('Legal Framework and Regulations', {
      x: 50,
      y: height - 80,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Content
    const content = `
The International Maritime Organization (IMO) is a specialized agency of the United Nations 
responsible for regulating shipping. The IMO develops and maintains a comprehensive 
regulatory framework for shipping, including safety, environmental concerns, legal matters, 
technical co-operation, maritime security and the efficiency of shipping.

Key IMO Conventions and Regulations:

• SOLAS (Safety of Life at Sea) Convention: The most important treaty addressing maritime safety
• MARPOL (Marine Pollution) Convention: Prevents pollution from ships  
• STCW (Standards of Training, Certification and Watchkeeping) Convention: Sets qualification 
  standards for masters, officers and watch personnel
• MLC (Maritime Labour Convention): Ensures decent working and living conditions for seafarers

International Transportation Law encompasses various legal frameworks governing the movement 
of goods and passengers across international borders. This includes maritime law, aviation law, 
and land transportation regulations.

Maritime Transportation:
The Hague Rules, Hague-Visby Rules, and Hamburg Rules govern the carriage of goods by sea. 
These international conventions establish the rights and responsibilities of carriers and 
shippers in maritime transportation.

Bills of Lading serve as crucial documents in international maritime trade, functioning as:
- Receipt for goods shipped
- Contract of carriage between shipper and carrier  
- Document of title to the goods

Liability and Insurance:
International transportation involves complex liability frameworks. Carriers may limit their 
liability under various international conventions, but must maintain adequate insurance coverage.

Customs and Trade Regulations:
International transportation must comply with customs regulations of both origin and destination 
countries. This includes proper documentation, duty payments, and compliance with import/export 
restrictions.

Environmental Regulations:
Modern international transportation law increasingly addresses environmental concerns, including 
emissions standards, ballast water management, and sustainable transportation practices.
`;

    // Split content into lines and add to PDF
    const lines = content.trim().split('\n');
    let yPosition = height - 120;
    
    for (const line of lines) {
      if (yPosition < 50) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
        page = newPage;
      }
      
      page.drawText(line.trim(), {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
      });
      
      yPosition -= 15;
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Write PDF to file
    const pdfPath = path.join(uploadsDir, 'transport-law.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);
    
    console.log('✅ PDF created successfully:', pdfPath);
    console.log('📄 File size:', fs.statSync(pdfPath).size, 'bytes');
    
  } catch (error) {
    console.error('❌ Error creating PDF:', error);
    process.exit(1);
  }
}

createTestPDF(); 