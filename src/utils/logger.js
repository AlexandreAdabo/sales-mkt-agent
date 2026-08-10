function write(level, message, metadata) {
  const suffix = metadata === undefined ? '' : ` ${serialize(metadata)}`;
  const line = `[${new Date().toISOString()}] [${level}] ${message}${suffix}`;
  const output = level === 'ERROR' ? console.error : console.log;
  output(line);
}

function serialize(value) {
  if (value instanceof Error) return value.stack ?? value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = {
  info: (message, metadata) => write('INFO', message, metadata),
  warn: (message, metadata) => write('WARN', message, metadata),
  error: (message, error) => write('ERROR', message, error)
};
