# Champion Forge

Jogo desenvolvido com MySys Game SDK.

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env

# Rodar migrações
npm run db:migrate

# Iniciar desenvolvimento
npm run dev
```

## Estrutura

- `src/client/` - Frontend React + Vite
- `src/server/` - Backend Node.js + Express + Socket.IO
- `src/shared/` - Tipos e constantes compartilhados
