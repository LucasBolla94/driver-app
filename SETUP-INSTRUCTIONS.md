# Instruções de Setup - Driver App

## 🚀 Setup Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Google Maps API Key

**IMPORTANTE: Nunca commite sua API key!**

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione sua API key:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

3. **NÃO commite o arquivo `.env`** - ele já está no `.gitignore`

### 3. Configurar Supabase Realtime

Execute no Supabase SQL Editor:

```sql
-- Criar tabela job_offers_uk
-- Execute o arquivo: CREATE-job-offers-uk-CORRECT.sql

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE job_offers_uk;
```

Ou no Dashboard:
- Database > Replication
- Marque `job_offers_uk`
- Clique em Save

### 4. Iniciar o App

```bash
npm start
```

Ou para limpar cache:
```bash
npm start -- --clear
```

## 📱 Testar no Dispositivo

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## 🧪 Testar Sistema de Ofertas

### 1. Abra o app e faça login
### 2. Fique online (swipe na tela inicial)
### 3. Execute no Supabase SQL Editor:

```sql
INSERT INTO job_offers_uk (
    job_id,
    driver_uid,
    status,
    expires_at,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_time_after,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_time_before,
    price_driver,
    distance
) VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    'SEU-UID-AQUI'::uuid, -- Substitua pelo seu UID
    'waiting',
    NOW() + INTERVAL '10 minutes',
    '103 Middleton St, Glasgow G51 1SQ, UK',
    55.8529372,
    -4.2990195,
    'ASAP (Next 60 min)',
    '17 Bruce St, Clydebank G81 1TT, UK',
    55.9002114,
    -4.4063518,
    '15:00',
    12.50,
    '10.5 km'
);
```

### 4. Verificar no App
- ✅ Notificação deve aparecer
- ✅ Mapa mostra marcadores e rota
- ✅ Vibração
- ✅ Pode aceitar ou rejeitar

## 📚 Documentação Disponível

- **[SISTEMA-COMPLETO-RESUMO.md](SISTEMA-COMPLETO-RESUMO.md)** - Visão geral completa
- **[SECURITY-GUIDE.md](SECURITY-GUIDE.md)** - Guia de segurança
- **[SETUP-GOOGLE-MAPS.md](SETUP-GOOGLE-MAPS.md)** - Configuração do Google Maps
- **[JOB-OFFERS-COMPLETE-SYSTEM.md](JOB-OFFERS-COMPLETE-SYSTEM.md)** - Sistema de ofertas detalhado
- **[DEBUG-STEP-BY-STEP.md](DEBUG-STEP-BY-STEP.md)** - Troubleshooting

## 🔧 Troubleshooting

### API Key não funciona
1. Verifique se o arquivo `.env` existe na raiz
2. Verifique se a chave está correta
3. Reinicie o servidor Expo (`npm start`)

### Notificações não aparecem
1. Verifique se Realtime está habilitado no Supabase
2. Verifique os logs do console
3. Veja [DEBUG-STEP-BY-STEP.md](DEBUG-STEP-BY-STEP.md)

### Rota não aparece no mapa
1. Certifique-se de que a Google Directions API está habilitada
2. Verifique se a API key está configurada
3. Veja os logs para erros

## ✅ Checklist de Setup

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado
- [ ] API Key do Google Maps configurada
- [ ] Supabase Realtime habilitado
- [ ] App rodando sem erros
- [ ] Teste de oferta funcionando

## 🎉 Pronto!

Sistema configurado e pronto para uso!

Para dúvidas ou problemas, consulte a documentação ou verifique os logs do console.
