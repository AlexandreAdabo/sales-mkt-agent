export function createContentService({ contentRepository, aiService }) {
  function loadPreviousIdeas(limit = 100) {
    return contentRepository.listRecent(limit);
  }

  async function generateIdeas(icp, previousIdeas) {
    return aiService.generateContentIdeas(icp, previousIdeas);
  }

  function filterDuplicates(ideas, previousIdeas) {
    return ideas.filter((idea) => !contentRepository.isDuplicate(idea, previousIdeas));
  }

  function saveIdeas(ideas) {
    const generatedAt = new Date().toISOString();
    return contentRepository.saveMany(ideas.map((idea) => ({ ...idea, generatedAt })));
  }

  return { loadPreviousIdeas, generateIdeas, filterDuplicates, saveIdeas };
}
