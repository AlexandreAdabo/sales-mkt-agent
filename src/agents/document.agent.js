import { DOCUMENT_CATEGORIES } from '../config/document-categories.js';
import { logger } from '../utils/logger.js';
import { DocumentConversionError } from '../services/document-render.service.js';

const MAX_DISCORD_UPLOAD_BYTES = 8 * 1024 * 1024;

function buildOutputFilename(session) {
  const category = DOCUMENT_CATEGORIES.find((entry) => entry.folder === session.categoryFolder);
  const number = category ? session.values[category.numberField] : null;

  if (category && number) {
    const sanitized = String(number).trim().replace(/[^\p{L}\p{N}-]+/gu, '-');
    return `${category.filePrefix}-${sanitized}.pdf`;
  }

  return `${session.templateName.replace(/\s+/g, '-')}.pdf`;
}

export function createDocumentAgent({ documentTemplateService, documentSessionService, documentRenderService, discordClient }) {
  async function handle({ content, userId, channelId }) {
    const text = content.trim();

    const selectMatch = text.match(/^!doc(?:\s+(\d+))?$/i);
    if (selectMatch) {
      return selectMatch[1] ? handleSelectTemplate(channelId, userId, Number(selectMatch[1])) : handleListTemplates();
    }

    const session = documentSessionService.getSession(channelId, userId);
    if (!session) {
      return 'Nenhuma sessão ativa. Envie `!doc` para ver os modelos disponíveis.';
    }

    return handleFieldSubmission(channelId, userId, session, text);
  }

  async function handleListTemplates() {
    const templates = await documentTemplateService.listAllTemplates();
    const lines = templates.map(
      (template) => `${template.globalIndex}. [${template.categoryDisplayName}] ${template.displayName}`
    );
    return ['**Modelos de documento disponíveis:**', ...lines, '', 'Envie `!doc <número>` para escolher um modelo.'].join('\n');
  }

  async function handleSelectTemplate(channelId, userId, globalIndex) {
    const entry = await documentTemplateService.resolveByGlobalIndex(globalIndex);
    if (!entry) {
      return `Modelo ${globalIndex} não encontrado. Envie \`!doc\` para ver a lista atualizada.`;
    }

    const fields = await documentTemplateService.extractFields(entry.categoryFolder, entry.templateId);
    if (!fields || fields.length === 0) {
      return 'Este modelo não possui campos dinâmicos configurados. Contate o administrador.';
    }

    documentSessionService.startSession(channelId, userId, {
      categoryFolder: entry.categoryFolder,
      templateId: entry.templateId,
      templateName: entry.displayName,
      fields
    });

    const lines = fields.map((field) => `${field} - {{${field}}}`);
    return [
      `**Informações do modelo "[${entry.categoryDisplayName}] ${entry.displayName}"**`,
      ...lines,
      '',
      'Responda com um campo por linha, no formato `Campo - valor`. Para campos com múltiplos itens (ex: atividades, observações), separe com `;`.'
    ].join('\n');
  }

  async function handleFieldSubmission(channelId, userId, session, text) {
    const { parsed, malformedLines } = documentSessionService.parseFieldLines(text);
    const { matched, unknownFields } = documentSessionService.matchFieldsToSession(session, parsed);

    if (Object.keys(matched).length > 0) {
      documentSessionService.applyValues(session, matched);
    }

    const warnings = [];
    if (malformedLines.length > 0) {
      warnings.push(`Linhas não reconhecidas (formato "Campo - valor" esperado): ${malformedLines.join(' | ')}`);
    }
    if (unknownFields.length > 0) {
      warnings.push(`Campos não reconhecidos neste modelo: ${unknownFields.join(', ')}`);
    }

    const { missing, complete } = documentSessionService.validateComplete(session);
    if (!complete) {
      const messages = [...warnings, `Faltam os seguintes campos: ${missing.join(', ')}`];
      return messages.join('\n');
    }

    try {
      const template = await documentTemplateService.getTemplate(session.categoryFolder, session.templateId);
      const pdfBuffer = await documentRenderService.generatePdf(template.path, session.values);

      if (pdfBuffer.length > MAX_DISCORD_UPLOAD_BYTES) {
        documentSessionService.clearSession(channelId, userId);
        return 'O PDF gerado excede o limite de upload do Discord. Contate o administrador.';
      }

      await discordClient.sendFile(channelId, {
        buffer: pdfBuffer,
        filename: buildOutputFilename(session)
      });
      documentSessionService.clearSession(channelId, userId);
      return [...warnings, 'Documento gerado com sucesso.'].filter(Boolean).join('\n');
    } catch (error) {
      logger.error('Falha ao gerar documento em PDF', error);
      if (error instanceof DocumentConversionError) {
        return 'Não foi possível converter o documento para PDF no momento. Contate o administrador.';
      }
      return 'Ocorreu um erro ao gerar o documento. Tente novamente ou contate o administrador.';
    }
  }

  return { handle };
}
