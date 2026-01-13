# Guia de Configuração do Supabase Storage para Profile Images

## 📦 Bucket Atual

O app está configurado para usar o bucket: **`driver_profile`**

Você pode ver isso no arquivo [DriverAvatar.tsx](components/DriverAvatar.tsx#L68-L70):
```typescript
const { data: urlData, error: urlError } = await supabase.storage
  .from('driver_profile')  // <-- Nome do bucket
  .createSignedUrl(profileUrl, 60 * 60 * 24 * 7);
```

## 🚀 Passo a Passo para Configurar

### 1. Criar a Coluna `profile_url` na Tabela

Execute no **Supabase SQL Editor**:

```sql
-- Adicionar coluna profile_url (se não existir)
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS profile_url TEXT NULL;

-- Adicionar comentário
COMMENT ON COLUMN drivers_uk.profile_url IS 'Path to driver profile image in Supabase Storage';
```

### 2. Criar o Bucket `driver_profile`

**Opção A: Via Dashboard (RECOMENDADO)**

1. Vá para **Storage** no menu lateral do Supabase
2. Clique em **New bucket**
3. Configure:
   - **Name**: `driver_profile`
   - **Public bucket**: ❌ **OFF** (deve ser privado)
   - **Allowed MIME types**: `image/*`
   - **File size limit**: 5 MB (ou o que preferir)
4. Clique em **Create bucket**

**Opção B: Via SQL**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver_profile', 'driver_profile', false)
ON CONFLICT (id) DO NOTHING;
```

### 3. Configurar Políticas de Storage (RLS)

Execute no **Supabase SQL Editor**:

```sql
-- Permitir usuários fazerem upload de suas próprias fotos
CREATE POLICY "Users can upload their own profile image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários atualizarem suas próprias fotos
CREATE POLICY "Users can update their own profile image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários deletarem suas próprias fotos
CREATE POLICY "Users can delete their own profile image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir todos verem as fotos de perfil
CREATE POLICY "Users can view all profile images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver_profile');
```

### 4. Verificar se está funcionando

```sql
-- Verificar se o bucket existe
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'driver_profile';

-- Verificar políticas
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%profile%';
```

## 📝 Como Funciona no App

### Estrutura de Arquivos

O app salva as imagens com esta estrutura:
```
driver_profile/
  └── {user-uid}/
      └── profile.{ext}
```

Exemplo:
```
driver_profile/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── profile.jpg
```

### Fluxo de Upload

1. Usuário seleciona uma imagem
2. App converte para base64
3. Upload para `driver_profile/{userId}/profile.{ext}`
4. Deleta foto antiga (se existir)
5. Atualiza `profile_url` na tabela `drivers_uk`
6. Gera URL assinada (signed URL) com validade de 7 dias
7. Armazena URL em cache por 6 horas

### Código Relevante

**Upload** - [DriverAvatar.tsx:128-143](components/DriverAvatar.tsx#L128-L143)
```typescript
const fileName = `${userId}/profile.${fileExt}`;

await supabase.storage
  .from('driver_profile')
  .upload(fileName, decode(image.base64), {
    contentType: image.mimeType || 'image/jpeg',
    upsert: true,
  });
```

**Update Database** - [DriverAvatar.tsx:153-156](components/DriverAvatar.tsx#L153-L156)
```typescript
await supabase
  .from('drivers_uk')
  .update({ profile_url: fileName })
  .eq('uid', userId);
```

## 🔒 Segurança

- ✅ Bucket é **privado** (não público)
- ✅ Apenas usuários autenticados podem acessar
- ✅ Usuários só podem modificar suas próprias fotos
- ✅ URLs são assinadas com tempo de expiração
- ✅ Cache local para melhor performance

## 🐛 Troubleshooting

### Erro: "new row violates row-level security policy"
- Verifique se as políticas de Storage foram criadas
- Confirme que o usuário está autenticado

### Erro: "Bucket not found"
- Verifique se o bucket `driver_profile` existe
- Confirme o nome exato (case-sensitive)

### Imagem não aparece
- Verifique se `profile_url` está salvo corretamente no banco
- Confirme que a URL assinada não expirou
- Limpe o cache do app

## 📚 Referências

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
