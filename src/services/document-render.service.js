import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const execFileAsync = promisify(execFile);
const CONVERT_TIMEOUT_MS = 30000;

export class DocumentConversionError extends Error {}

export function createDocumentRenderService() {
  async function renderDocx(templatePath, values) {
    const buffer = await readFile(templatePath);
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true
    });

    doc.render(values);
    return doc.getZip().generate({ type: 'nodebuffer' });
  }

  async function convertToPdf(docxBuffer) {
    const workDir = await mkdtemp(path.join(tmpdir(), 'doc-'));
    const requestId = randomUUID();
    const docxPath = path.join(workDir, `${requestId}.docx`);
    const pdfPath = path.join(workDir, `${requestId}.pdf`);

    try {
      await writeFile(docxPath, docxBuffer);
      await execFileAsync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', workDir, docxPath], {
        timeout: CONVERT_TIMEOUT_MS
      });
      return await readFile(pdfPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new DocumentConversionError('LibreOffice (soffice) não encontrado no servidor');
      }
      throw new DocumentConversionError(`Falha ao converter documento para PDF: ${error.message}`);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  async function generatePdf(templatePath, values) {
    const docxBuffer = await renderDocx(templatePath, values);
    return convertToPdf(docxBuffer);
  }

  return { renderDocx, convertToPdf, generatePdf };
}
