# Enriquecimento de lead

Extraia somente informações explicitamente presentes ou fortemente sustentadas pelo conteúdo do site oficial fornecido.

Não invente dados, não estime CNPJ ou porte e não trate telefone comum como WhatsApp sem evidência explícita. Extraia `email` somente quando estiver explicitamente presente no site. Quando não houver evidência suficiente, retorne `null`. Produza exclusivamente o objeto solicitado pelo schema JSON.
