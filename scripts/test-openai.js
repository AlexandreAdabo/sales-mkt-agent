import 'dotenv/config';

import { chat } from '../src/services/ai.service.js';

try {

  const response = await chat(
    'Responda apenas: integração OpenAI funcionando'
  );

  console.log(response);

} catch (error) {

  console.error('Erro ao testar OpenAI:');

  console.error(error);

}