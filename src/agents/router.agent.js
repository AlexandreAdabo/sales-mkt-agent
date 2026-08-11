export function createRouterAgent({ conversationService }) {
  const handle = (message) => conversationService.reply(message);
  return { handle };
}
