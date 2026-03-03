declare module 'pdfmake/js/Printer.js' {
  import { Readable } from 'node:stream';

  interface TFontDictionary {
    [fontName: string]: {
      normal: string;
      bold: string;
      italics: string;
      bolditalics: string;
    };
  }

  interface PdfKitDocument extends Readable {
    end(): void;
  }

  class PdfPrinter {
    constructor(fonts: TFontDictionary);
    createPdfKitDocument(docDefinition: Record<string, unknown>): Promise<PdfKitDocument>;
  }

  export default PdfPrinter;
}
