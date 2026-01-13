# Google Maps Setup Guide

## Como obter e configurar a Google Maps API Key

### Passo 1: Criar projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. No menu, vá em **APIs & Services > Credentials**

### Passo 2: Criar API Key

1. Clique em **Create Credentials > API key**
2. Copie a chave gerada

### Passo 3: Habilitar APIs necessárias

No Google Cloud Console, vá em **APIs & Services > Library** e habilite:

1. **Directions API** (para calcular rotas)
2. **Maps SDK for Android** (se usar Android)
3. **Maps SDK for iOS** (se usar iOS)

### Passo 4: Configurar no projeto

#### Opção 1: Arquivo .env (Recomendado)

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

#### Opção 2: Direto no código

Edite o arquivo `config/maps.ts`:

```typescript
export const GOOGLE_MAPS_API_KEY = 'SUA_CHAVE_AQUI';
```

### Passo 5: Adicionar ao .gitignore

Certifique-se de que o `.env` está no `.gitignore`:

```
.env
.env.local
```

### Passo 6: Restart do servidor

Depois de adicionar a chave, reinicie o servidor Expo:

```bash
npm start
```

## Testando

Quando uma oferta de job chegar:

1. ✅ O mapa deve mostrar dois marcadores (coleta e entrega)
2. ✅ Uma linha azul deve conectar os dois pontos (rota)
3. ✅ O mapa deve ajustar automaticamente para mostrar ambos os pontos

## Troubleshooting

### Erro: "REQUEST_DENIED"
- Verifique se a API Key está correta
- Certifique-se de que a Directions API está habilitada

### Rota não aparece
- Verifique os logs do console
- Certifique-se de que as coordenadas de coleta e entrega são válidas

### API Key inválida
- Certifique-se de que não há espaços extras na chave
- Verifique se você reiniciou o servidor Expo após adicionar a chave
