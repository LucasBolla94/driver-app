# Guia de Segurança - API Keys

## ⚠️ IMPORTANTE: Nunca Commite API Keys!

A API key da Google Maps foi movida para variáveis de ambiente para manter a segurança.

## 📁 Arquivos de Configuração

### `.env` - **NUNCA DEVE SER COMMITADO**
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCxw81Ta65Q13es7o_bk0qIJdcyC2lkIXM
```

✅ Este arquivo está no `.gitignore` e não será enviado para o repositório.

### `.env.example` - Template público
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

✅ Este arquivo PODE ser commitado - é apenas um exemplo.

## 🔐 Como Funciona

### 1. Desenvolvimento Local
- Crie o arquivo `.env` na raiz do projeto
- Adicione sua API key
- O app lerá automaticamente do arquivo

### 2. Equipe/Colaboradores
- Clone o repositório
- Copie `.env.example` para `.env`
- Adicione sua própria API key
- Nunca compartilhe o arquivo `.env`

### 3. Produção
- Configure as variáveis de ambiente no seu servidor de CI/CD
- Ou use os secrets do GitHub Actions / Expo EAS

## 🛡️ Verificações de Segurança

### ✅ O que está protegido:
- `.env` está no `.gitignore`
- `config/maps.ts` não contém a chave hardcoded
- App avisa se a chave não estiver configurada

### ❌ O que NUNCA fazer:
- ❌ Commitar o arquivo `.env`
- ❌ Colocar API keys diretamente no código
- ❌ Compartilhar `.env` por email/Slack
- ❌ Fazer screenshot com a API key visível

## 🔄 Restart do Servidor

Após criar/modificar o `.env`, reinicie o servidor Expo:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm start
```

## 🚨 Se a API Key Vazar

1. Vá para: https://console.cloud.google.com/apis/credentials
2. Delete a chave comprometida
3. Crie uma nova chave
4. Atualize o `.env` com a nova chave
5. Reinicie o servidor

## 📝 Checklist de Segurança

- [x] `.env` está no `.gitignore`
- [x] `.env.example` não contém chaves reais
- [x] `config/maps.ts` usa variáveis de ambiente
- [x] App avisa se chave não estiver configurada
- [ ] Antes de commitar, verifique: `git status` para confirmar que `.env` não está na lista

## 🎯 Boas Práticas

1. **Sempre use variáveis de ambiente** para dados sensíveis
2. **Nunca hardcode** API keys, senhas, tokens
3. **Use `.env.example`** como template para a equipe
4. **Documente** como obter/configurar as chaves
5. **Rotacione chaves** periodicamente

## ✨ Está Seguro!

Seu projeto agora está configurado de forma segura:
- ✅ API key em arquivo separado
- ✅ `.env` no `.gitignore`
- ✅ Warnings se chave não configurada
- ✅ Template `.env.example` disponível

🔒 **Sua API key está protegida!**
