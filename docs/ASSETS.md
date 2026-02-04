# Assets Gratuitos para Champion Forge

## Fontes Principais de Assets Gratuitos

### 1. Game-icons.net (RECOMENDADO)
**URL:** https://game-icons.net/

- **4170+ icones** SVG e PNG gratuitos
- Icones atualizados semanalmente
- Categorias organizadas
- Perfeito para: habilidades, buffs, debuffs, itens
- **Licenca:** CC BY 3.0 (credito necessario)

**Categorias uteis:**
- Weapons (espadas, machados, arcos)
- Magic (fogo, gelo, raio)
- Skills (movimento, defesa, ataque)
- Items (pocoes, armaduras)

---

### 2. Kenney.nl (RECOMENDADO)
**URL:** https://kenney.nl/assets

- **60,000+ assets** gratuitos
- Estilo limpo e consistente
- 2D sprites, UI, audio
- **Licenca:** CC0 (sem credito necessario)

**Packs relevantes:**
- Generic Items
- UI Pack
- Game Icons (105 icones)
- Particle Pack
- Input Prompts

---

### 3. OpenGameArt.org
**URL:** https://opengameart.org/

**Packs especificos:**

| Pack | Quantidade | Licenca | Link |
|------|------------|---------|------|
| 16x16 Weapon RPG Icons | 300+ (10 tipos x 30 designs x 4 cores) | CC0 | [Link](https://opengameart.org/content/16x16-weapon-rpg-icons) |
| 700+ RPG Icons (Lorc) | 789 icones | CC BY 3.0 | [Link](https://opengameart.org/content/700-rpg-icons) |
| RPG Icons Set | 245 icones 64x64 | CC0 | [Link](https://opengameart.org/content/rpg-icons-set) |
| CC0 Weapon Icons | Sets variados | CC0 | [Link](https://opengameart.org/content/2d-art-iconsitemsweapons) |
| Skills/Abilities Icons | Variados | CC0 | [Link](https://opengameart.org/content/icons-for-abilities-skills-etc) |

---

### 4. Itch.io
**URL:** https://itch.io/game-assets/free

**Packs recomendados:**

| Pack | Conteudo | Licenca |
|------|----------|---------|
| RPG Skill Icons (KURAI) | 165 icones 16x16 | CC0 |
| RPG Skill Icons (Viktor) | 80 icones 64x/128x | CC0 |
| FREE RPG Icon Pack | 100+ armas e pocoes | Free |
| RPG Icon Pack | 400+ skills e spells | Free |
| Pixel Weapons Megapack | 100+ espadas | Free |
| 8000+ Raven Fantasy Icons | 8000+ icones RPG | Free |

**Links diretos:**
- [Free Icons CC0](https://itch.io/game-assets/assets-cc0/tag-icons)
- [Free 2D Sprites](https://itch.io/game-assets/free/tag-2d/tag-sprites)
- [Free RPG Icons](https://itch.io/game-assets/free/genre-rpg/tag-icons)
- [Free Weapons](https://itch.io/game-assets/free/genre-rpg/tag-weapons)

---

### 5. CraftPix.net
**URL:** https://craftpix.net/categorys/free-icons-for-games/

- Assets 2D de alta qualidade
- Game Kits completos
- UI, tilesets, personagens
- Mix de free e premium

---

## Categorias de Assets Necessarios

### Icones de Habilidades (80-100)

| Categoria | Quantidade | Fonte Recomendada |
|-----------|------------|-------------------|
| Mobilidade | 15 | Game-icons.net |
| Dano Fisico | 20 | OpenGameArt |
| Dano Magico | 15 | Game-icons.net |
| CC (Crowd Control) | 15 | Game-icons.net |
| Defensivo | 15 | OpenGameArt |
| Suporte | 10 | Kenney |
| Ultimates | 15 | Game-icons.net |

### Icones de Armas (30+)

| Tipo | Quantidade | Fonte |
|------|------------|-------|
| Espadas | 8 | 16x16 Weapon RPG Icons |
| Machados | 4 | 16x16 Weapon RPG Icons |
| Martelos | 4 | 16x16 Weapon RPG Icons |
| Lancas | 4 | OpenGameArt |
| Arcos | 4 | Pixel Weapons Megapack |
| Cajados | 4 | Game-icons.net |
| Adagas | 4 | 16x16 Weapon RPG Icons |

### Icones de Equipamentos

| Tipo | Quantidade | Fonte |
|------|------------|-------|
| Armaduras | 20 | OpenGameArt CC0 |
| Capacetes | 15 | OpenGameArt CC0 |
| Escudos | 10 | OpenGameArt CC0 |
| Aneis | 10 | Game-icons.net |
| Amuletos | 10 | Game-icons.net |
| Botas | 10 | OpenGameArt CC0 |

### Icones de Arena Shop

| Tipo | Quantidade | Fonte |
|------|------------|-------|
| Itens Ofensivos | 15 | Game-icons.net |
| Itens Defensivos | 15 | OpenGameArt |
| Itens Utilidade | 15 | Kenney |
| Consumiveis | 10 | OpenGameArt |

### UI Elements

| Elemento | Fonte |
|----------|-------|
| Barras de vida/mana | Kenney UI Pack |
| Botoes | Kenney UI Pack |
| Frames de icones | CraftPix |
| Tooltips | Kenney UI Pack |
| Inventory slots | OpenGameArt |

---

## Estilo Visual Geometrico

Para o estilo minimalista/geometrico, podemos:

### Opcao 1: Usar icones existentes
- Game-icons.net tem icones monocromaticos
- Recolorir para nosso estilo
- Funciona bem com visual limpo

### Opcao 2: Geometria programatica
```typescript
// Personagens como formas geometricas
const playerStyles = {
  warrior: { shape: 'circle', color: '#e74c3c', size: 32 },
  mage: { shape: 'diamond', color: '#9b59b6', size: 28 },
  ranger: { shape: 'triangle', color: '#2ecc71', size: 30 },
};

// Armas como formas simples
const weaponStyles = {
  sword: { shape: 'rectangle', rotation: 45 },
  staff: { shape: 'line', glow: true },
  bow: { shape: 'arc', string: true },
};
```

### Opcao 3: Hibrido
- Icones para UI/inventory (packs gratuitos)
- Geometria para gameplay em tempo real
- Melhor dos dois mundos

---

## Lista de Downloads Recomendados

### Prioridade Alta
1. [ ] Game-icons.net - Download completo SVG
2. [ ] Kenney UI Pack
3. [ ] 16x16 Weapon RPG Icons (OpenGameArt)
4. [ ] RPG Icons Set 245 (OpenGameArt)

### Prioridade Media
5. [ ] RPG Skill Icons (KURAI - itch.io)
6. [ ] 700+ RPG Icons (Lorc)
7. [ ] Kenney Game Icons
8. [ ] Pixel Weapons Megapack

### Prioridade Baixa
9. [ ] 8000+ Raven Fantasy Icons
10. [ ] CraftPix free packs
11. [ ] Additional OpenGameArt packs

---

## Licencas - Resumo

| Fonte | Licenca | Credito |
|-------|---------|---------|
| Kenney | CC0 | Nao obrigatorio |
| Game-icons.net | CC BY 3.0 | Sim, "Lorc, game-icons.net" |
| OpenGameArt (CC0) | CC0 | Nao obrigatorio |
| OpenGameArt (CC BY) | CC BY | Sim |
| Itch.io (varia) | Verificar cada | Verificar cada |

### Formato de Credito Recomendado
```
CREDITS
=======
Icons: Game-icons.net by Lorc, Delapouite, and contributors
UI: Kenney.nl
Additional: OpenGameArt.org contributors
```

---

## Ferramentas de Edicao

### Para recolorir/modificar:
- **GIMP** (gratuito) - Edicao completa
- **Photopea** (online gratuito) - Photoshop online
- **Piskel** (gratuito) - Pixel art
- **Aseprite** ($20) - Melhor para pixel art

### Para gerar variantes:
- Scripts de batch recolor
- CSS filters em runtime
- SVG manipulation (game-icons.net)

---

## Proximos Passos

1. [ ] Baixar Game-icons.net completo
2. [ ] Baixar Kenney UI Pack
3. [ ] Selecionar 100 icones para habilidades
4. [ ] Selecionar 30 icones para armas
5. [ ] Criar paleta de cores do jogo
6. [ ] Organizar assets em pastas
7. [ ] Testar integracao com Canvas/React
