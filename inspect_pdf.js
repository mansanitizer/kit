const pdf = require('pdf-parse');
console.log('Type:', typeof pdf);
console.log('Keys:', Object.keys(pdf));
if (typeof pdf === 'function') console.log('It is a function');
if (pdf.PDFParse) console.log('Has PDFParse property');
