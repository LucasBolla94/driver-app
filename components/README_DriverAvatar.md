# DriverAvatar Component

Componente reutilizável para exibir e gerenciar a foto de perfil do motorista.

## Funcionalidades

- ✅ Exibe foto do usuário do Supabase Storage
- ✅ Placeholder com ícone quando não há foto
- ✅ Upload de foto (modo editável)
- ✅ URLs assinadas para bucket privado
- ✅ Cache busting automático
- ✅ Tamanho personalizável
- ✅ Borda personalizável
- ✅ Loading states

## Uso

### Básico (Somente Visualização)

```tsx
import DriverAvatar from '@/components/DriverAvatar';

<DriverAvatar
  userId={driverData.userId}
  profileUrl={driverData.profile_url}
  size={80}
  editable={false}
/>
```

### Com Upload (Editável)

```tsx
<DriverAvatar
  userId={driverData.userId}
  profileUrl={driverData.profile_url}
  size={100}
  editable={true}
  borderColor="#000000"
  borderWidth={3}
  onPhotoUpdated={() => {
    // Callback após upload bem-sucedido
    console.log('Foto atualizada!');
  }}
/>
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `userId` | `string` | **required** | ID do usuário (UID do Supabase) |
| `profileUrl` | `string \| null` | `undefined` | Caminho da foto no storage (ex: `{userId}/profile.jpg`) |
| `size` | `number` | `100` | Tamanho do avatar em pixels |
| `editable` | `boolean` | `false` | Se true, mostra botão de câmera para upload |
| `borderColor` | `string` | `#000000` | Cor da borda |
| `borderWidth` | `number` | `3` | Largura da borda em pixels |
| `onPhotoUpdated` | `() => void` | `undefined` | Callback chamado após upload bem-sucedido |

## Exemplos de Uso no App

### 1. Tela de Profile (Editável)
```tsx
<DriverAvatar
  userId={driverData.userId}
  profileUrl={driverData.profile_url}
  size={100}
  editable={true}
  borderColor="#000000"
  borderWidth={3}
  onPhotoUpdated={refresh}
/>
```

### 2. Header da Home (Não Editável)
```tsx
<DriverAvatar
  userId={driverUserId}
  profileUrl={driverProfileUrl}
  size={80}
  editable={false}
  borderColor="#E5E5E5"
  borderWidth={0}
/>
```

### 3. Lista de Motoristas (Pequeno)
```tsx
<DriverAvatar
  userId={driver.id}
  profileUrl={driver.profile_url}
  size={40}
  editable={false}
/>
```

## Fluxo de Upload

1. Usuário clica no botão da câmera
2. Solicita permissão para acessar galeria
3. Abre seletor de imagem com editor 1:1
4. Converte imagem para base64
5. Remove foto antiga (se existir)
6. Faz upload para `driver_profile/{userId}/profile.{ext}`
7. Atualiza campo `profile_url` na tabela `drivers`
8. Recarrega a foto
9. Chama callback `onPhotoUpdated` (se fornecido)

## Dependências

- `expo-image-picker` - Seleção de imagens
- `base64-arraybuffer` - Conversão para upload
- `@expo/vector-icons` - Ícones
- `@supabase/supabase-js` - Storage

## Estrutura de Storage

- **Bucket**: `driver_profile` (privado)
- **Caminho**: `{userId}/profile.{ext}`
- **Exemplo**: `abc123-def456/profile.jpg`
- **URLs**: Assinadas com validade de 7 dias
