declare module 'pdf-parse/lib/pdf-parse.js' {
  import type { Result, Options } from 'pdf-parse';
  function pdfParse(dataBuffer: Buffer, options?: Options): Promise<Result>;
  export default pdfParse;
}
