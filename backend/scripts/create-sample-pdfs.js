const fs = require('fs');
const path = require('path');

// Simple function to create a basic PDF structure
function createSimplePDF(title, content) {
  // This is a minimal PDF structure - in a real scenario you'd use a proper PDF library
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -20 Td
(${content.replace(/\n/g, ') Tj 0 -15 Td (')}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`;

  return Buffer.from(pdfHeader, 'utf8');
}

// Sample documents content
const sampleDocuments = [
  {
    filename: 'trasporto-merci-italia.pdf',
    title: 'Regolamento Trasporto Merci in Italia',
    content: `REGOLAMENTO TRASPORTO MERCI IN ITALIA

Articolo 1 - Definizioni
Per trasporto di merci si intende il movimento di beni da un luogo all'altro mediante veicoli autorizzati.

Articolo 2 - Autorizzazioni
Tutti i trasportatori devono essere in possesso di:
- Licenza di trasporto merci
- Assicurazione RC professionale
- Certificato di idoneità del veicolo

Articolo 3 - Documenti di Trasporto
Ogni spedizione deve essere accompagnata da:
- Documento di trasporto (DDT)
- Fattura o documento equivalente
- Certificato di origine (se richiesto)

Articolo 4 - Responsabilità
Il trasportatore è responsabile delle merci dal momento della presa in carico fino alla consegna.

Articolo 5 - Tempi di Consegna
I tempi di consegna devono essere concordati contrattualmente e rispettati salvo cause di forza maggiore.

Articolo 6 - Sanzioni
Le violazioni del presente regolamento comportano sanzioni amministrative da €500 a €5000.`
  },
  {
    filename: 'gdpr-privacy-policy.pdf',
    title: 'GDPR Privacy Policy - Gusto Italiano',
    content: `INFORMATIVA PRIVACY GDPR - GUSTO ITALIANO

1. TITOLARE DEL TRATTAMENTO
Gusto Italiano S.r.l.
Via Roma 123, 20100 Milano (MI)
Email: privacy@gusto-italiano.com

2. FINALITÀ DEL TRATTAMENTO
I dati personali vengono trattati per:
- Gestione ordini e spedizioni
- Assistenza clienti
- Marketing diretto (con consenso)
- Adempimenti fiscali e contabili

3. BASE GIURIDICA
Il trattamento è basato su:
- Esecuzione del contratto (art. 6.1.b GDPR)
- Consenso dell'interessato (art. 6.1.a GDPR)
- Obbligo legale (art. 6.1.c GDPR)

4. CATEGORIE DI DATI
Trattiamo le seguenti categorie di dati:
- Dati anagrafici (nome, cognome, indirizzo)
- Dati di contatto (email, telefono)
- Dati di pagamento (tramite processori sicuri)

5. CONSERVAZIONE
I dati vengono conservati per:
- Dati contrattuali: 10 anni
- Dati di marketing: fino a revoca del consenso
- Dati fiscali: secondo normativa vigente

6. DIRITTI DELL'INTERESSATO
Hai diritto a:
- Accesso ai tuoi dati (art. 15 GDPR)
- Rettifica (art. 16 GDPR)
- Cancellazione (art. 17 GDPR)
- Limitazione del trattamento (art. 18 GDPR)
- Portabilità (art. 20 GDPR)
- Opposizione (art. 21 GDPR)

7. SICUREZZA
Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali.

8. TRASFERIMENTI
I dati possono essere trasferiti a fornitori UE per servizi di spedizione e pagamento.

9. CONTATTI
Per esercitare i tuoi diritti contatta: privacy@gusto-italiano.com`
  },
  {
    filename: 'catalogo-prodotti-italiani.pdf',
    title: 'Catalogo Prodotti Italiani - Gusto Italiano',
    content: `CATALOGO PRODOTTI ITALIANI 2024

PASTA ARTIGIANALE
- Spaghetti di Gragnano IGP - €4.50/500g
- Penne Rigate Biologiche - €3.80/500g
- Tagliatelle all'Uovo - €5.20/400g
- Orecchiette Pugliesi - €4.20/500g

FORMAGGI DOP
- Parmigiano Reggiano 24 mesi - €28.00/kg
- Gorgonzola DOP dolce - €18.50/kg
- Mozzarella di Bufala Campana - €22.00/kg
- Pecorino Romano - €24.00/kg

SALUMI E AFFETTATI
- Prosciutto di Parma 18 mesi - €45.00/kg
- Salame Milano - €32.00/kg
- Bresaola della Valtellina IGP - €55.00/kg
- Mortadella Bologna IGP - €18.00/kg

OLIO EXTRAVERGINE
- Olio Toscano IGP - €15.00/500ml
- Olio Pugliese Coratina - €12.50/500ml
- Olio Ligure Taggiasca - €18.00/250ml

CONSERVE E SUGHI
- Pomodori San Marzano DOP - €4.50/400g
- Pesto Genovese DOP - €8.50/180g
- Olive Taggiasche - €12.00/300g
- Aceto Balsamico di Modena IGP - €25.00/250ml

DOLCI TRADIZIONALI
- Panettone Milanese - €18.00/1kg
- Cannoli Siciliani - €15.00/6pz
- Amaretti di Saronno - €8.50/200g
- Baci di Dama Piemontesi - €12.00/250g

VINI SELEZIONATI
- Chianti Classico DOCG - €22.00/750ml
- Barolo DOCG - €45.00/750ml
- Prosecco di Valdobbiadene DOCG - €18.00/750ml
- Brunello di Montalcino DOCG - €65.00/750ml

Tutti i prodotti sono certificati e provengono direttamente dai produttori italiani.
Spedizione gratuita per ordini superiori a €50.
Garanzia di qualità 100% italiana.`
  }
];

// Create sample-documents directory if it doesn't exist
const sampleDir = path.join(__dirname, '..', 'sample-documents');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Generate PDF files
sampleDocuments.forEach(doc => {
  const pdfBuffer = createSimplePDF(doc.title, doc.content);
  const filePath = path.join(sampleDir, doc.filename);
  
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Created: ${doc.filename} (${pdfBuffer.length} bytes)`);
});

console.log('\nSample PDF documents created successfully!');
console.log(`Location: ${sampleDir}`); 