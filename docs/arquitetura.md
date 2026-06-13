# E-book: Arquitetura React Native + Monorepo DTask (Versão 4.1)

Guia consolidado de arquitetura para aplicações React Native modernas utilizando:

* Expo
* React Native
* Zustand
* React Query
* Monorepo
* Clean Architecture
* DI
* DTOs
* Mappers
* Governança arquitetural
* Testabilidade
* Evolução controlada

---

# Sumário

1. Filosofia Central
2. Estrutura do Monorepo
3. Responsabilidades das Camadas
4. Estrutura Enterprise
5. Fluxo Completo da Arquitetura
6. Server State vs Client State
7. Hooks
8. UseCases
9. DTOs, Mappers e Entidades
10. Repository Pattern
11. React Query (@tanstack/react-query)
12. Zustand
13. Comunicação entre Features (EventBus)
14. Injeção de Dependência (DI)
15. Validação e Schemas
16. Testes
17. Governança Arquitetural
18. Convenções de Nomenclatura
19. Barrel Exports
20. Packages e Compartilhamento
21. Evolução Arquitetural
22. Anti-patterns
23. Checklist Final
24. Regra Final

---

# 1. Filosofia Central

Antes de criar qualquer arquivo:

* Hook
* Store
* Service
* Repository
* DTO
* Entity
* Component

pergunte:

> "Quem é o dono dessa responsabilidade?"

---

## Algoritmo de Decisão

```txt
É infraestrutura global?
↓
Core

É regra de negócio?
↓
Feature

É reutilização local?
↓
Shared

É reutilização entre apps?
↓
Packages
```

---

## Resumo

```txt
Core       → infraestrutura global
Feature    → domínio e regra de negócio
Shared     → reutilização local
Packages   → reutilização entre aplicações
```

---

# 2. Estrutura do Monorepo

```txt
dtask/

├── apps/
│   │
│   ├── mobile/
│   │   │
│   │   ├── app/
│   │   ├── core/
│   │   ├── shared/
│   │   └── features/
│   │
│   └── web/
│       │
│       ├── app/
│       ├── core/
│       ├── shared/
│       └── features/
│
└── packages/
    │
    ├── ui/
    ├── hooks/
    ├── utils/
    ├── domain/
    ├── types/
    └── constants/
```

---

# 3. Responsabilidades das Camadas

# Core

Infraestrutura global.

```txt
core/

├── config/
├── navigation/
├── providers/
├── theme/
│
└── infrastructure/
    │
    ├── api/
    ├── storage/
    ├── analytics/
    ├── events/
    └── di/
```

---

## Responsabilidades

```txt
config       → variáveis globais
navigation   → rotas
providers    → providers globais
theme        → design system
api          → cliente HTTP
storage      → persistência
analytics    → tracking
events       → EventBus
di           → container de dependência
```

---

## Regra

```txt
Core NÃO depende de Feature
Core NÃO depende de Shared
```

---

# Features

Representam domínios.

```txt
features/

├── auth/
├── goals/
├── tasks/
└── profile/
```

---

## Estrutura Recomendada

```txt
goals/

├── domain/
├── data/
├── presentation/
└── schemas/
```

---

# Shared

Reutilização local da aplicação.

```txt
shared/

├── components/
├── hooks/
├── utils/
├── constants/
└── schemas/
```

---

## Regra

```txt
Shared NÃO possui regra de negócio
```

---

# Packages

Código compartilhado entre aplicações.

```txt
packages/

├── ui/
├── hooks/
├── utils/
├── domain/
├── types/
└── constants/
```

---

## Regra

```txt
Packages NÃO dependem de apps
Packages NÃO dependem de features
```

---

# 4. Estrutura Enterprise

```txt
goals/

├── domain/
│   │
│   ├── entities/
│   ├── ports/
│   └── usecases/
│
├── data/
│   │
│   ├── repositories/
│   ├── dto/
│   └── mappers/
│
├── presentation/
│   │
│   ├── components/
│   ├── hooks/
│   ├── react-query/
│   └── stores/
│
└── schemas/
```

---

## Responsabilidades

```txt
domain        → regra pura
data          → infraestrutura e transformação
presentation  → UI + comportamento
schemas       → validação
```

---

# 5. Fluxo Completo da Arquitetura

## Fluxo Principal

```txt
┌──────────────────────────────────────────┐
│             SCREEN (UI)                  │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│          HOOK (useCreateGoal)            │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ REACT QUERY (useCreateGoalMutation)      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│     USECASE (CreateGoalUseCase)          │
│ regras + validações                      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│       REPOSITORY (GoalRepository)        │
│ dto + mapper + infraestrutura            │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│                API                       │
└──────────────────────────────────────────┘
```

---

## Fluxo de Retorno

```txt
API
 ↓
DTO
 ↓
Mapper
 ↓
Entity
 ↓
React Query Cache
 ↓
Hook
 ↓
Screen
```

---

# 6. Server State vs Client State

Separação obrigatória.

---

# React Query

Responsável exclusivamente por:

```txt
✓ cache servidor
✓ sincronização
✓ paginação
✓ infinite scroll
✓ mutations
✓ retry
✓ revalidação
✓ optimistic updates
```

---

## Nunca usar React Query para:

```txt
❌ modal
❌ estado visual
❌ seleção temporária
❌ wizard
❌ formulário local
```

---

# Zustand

Responsável exclusivamente por:

```txt
✓ estado visual
✓ modal
✓ filtros
✓ seleção
✓ formulários temporários
✓ wizard
```

---

## Nunca usar Zustand para:

```txt
❌ fetch API
❌ cache servidor
❌ sincronização HTTP
❌ CRUD remoto
```

---

# Regra Final

```txt
Server State → React Query
Client State → Zustand
```

---

# 7. Hooks

Categorias:

```txt
hooks/

ui/
business/
device/
```

---

## Tipos

```txt
UI
→ comportamento visual

Business
→ orquestra fluxo

Device
→ APIs nativas
```

---

## Exemplo

```ts
export function useCreateGoal() {

  const mutation = useCreateGoalMutation()

  async function create(data: GoalInput) {
    return mutation.mutateAsync(data)
  }

  return { create }
}
```

---

## Regras

```txt
✓ hooks orquestram
✓ hooks conectam camadas

❌ hooks não possuem regra pesada
❌ hooks não fazem fetch direto
❌ hooks não armazenam estado global
```

---

# 8. UseCases

Toda regra importante pertence ao domínio.

---

## Exemplo

```ts
export class CreateGoalUseCase {

  constructor(
    private repository: IGoalRepository
  ) {}

  async execute(data: GoalInput) {

    if (data.title.length < 3) {
      throw new Error('Título inválido')
    }

    return this.repository.create(data)
  }
}
```

---

## Responsabilidades

```txt
✓ regras de negócio
✓ validação de domínio
✓ orquestração de domínio

❌ HTTP
❌ UI
❌ React
```

---

# 9. DTOs, Mappers e Entidades

---

## Fluxo

```txt
API JSON
 ↓
DTO
 ↓
Mapper
 ↓
Entity
```

---

# DTO

```ts
export type GoalResponseDTO = {
  id: string
  title: string
  progress: number
  created_at: string
}
```

---

# Entity

```ts
export class Goal {

  constructor(
    public readonly id: string,
    public title: string,
    public progress: number
  ) {}

  complete() {
    this.progress = 100
  }

  isComplete() {
    return this.progress === 100
  }
}
```

---

# Mapper

```ts
export class GoalMapper {

  static toEntity(dto: GoalResponseDTO): Goal {

    return new Goal(
      dto.id,
      dto.title,
      dto.progress
    )
  }

}
```

---

# 10. Repository Pattern

Responsável pela comunicação externa.

---

## Exemplo Completo

```ts
import { Goal } from '../../domain/entities/Goal'
import { GoalMapper } from '../mappers/GoalMapper'

export class GoalRepository
implements IGoalRepository {

  constructor(
    private apiClient: ApiClient
  ) {}

  async create(
    data: GoalInput
  ): Promise<Goal> {

    const dto =
      GoalMapper.toDTO(data)

    const response =
      await this.apiClient.post<GoalResponseDTO>(
        '/goals',
        dto
      )

    return GoalMapper.toEntity(
      response.data
    )
  }
}
```

---

## Responsabilidades

```txt
✓ API
✓ banco
✓ cache local
✓ transformação DTO

❌ regra de negócio
❌ UI
```

---

# 11. React Query (@tanstack/react-query)

Estrutura:

```txt
presentation/

└── react-query/

    ├── keys.ts
    ├── useGoalsQuery.ts
    └── useCreateGoalMutation.ts
```

---

## Mutation

```ts
import {
  useMutation,
  useQueryClient
} from '@tanstack/react-query'

export const useCreateGoalMutation = () => {

  const queryClient =
    useQueryClient()

  const createGoalUseCase =
    container.get(
      TOKENS.createGoalUseCase
    )

  return useMutation({

    mutationFn:
      (data: GoalInput) =>
        createGoalUseCase.execute(data),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ['goals']
      })

    }

  })
}
```

---

## Query

```ts
import { useQuery }
from '@tanstack/react-query'

export const useGoalsQuery = () => {

  const repository =
    container.get(
      TOKENS.goalRepository
    )

  return useQuery({

    queryKey: ['goals'],

    queryFn: () =>
      repository.findAll()

  })

}
```

---

# 12. Zustand

Zustand gerencia apenas estado local compartilhado.

---

## Exemplo

```ts
type GoalUIState = {

  selectedGoalId: string | null
  modalOpen: boolean

  setSelectedGoal:
    (id: string) => void

  toggleModal:
    () => void

}
```

---

# Exemplo de Store

```ts
export const useGoalUIStore =
create<GoalUIState>((set) => ({

  selectedGoalId: null,
  modalOpen: false,

  setSelectedGoal:
    (id) =>
      set({
        selectedGoalId: id
      }),

  toggleModal:
    () =>
      set((state) => ({
        modalOpen: !state.modalOpen
      }))

}))
```

---

# Regra

```txt
Store NÃO faz API.
```

---

# 13. Comunicação entre Features (EventBus)

Features não devem importar outras features.

---

## Fluxo

```txt
Feature A
 ↓
Evento
 ↓
Feature B
```

---

## EventBus

```ts
type Events = {

  'goal:completed': {
    goalId: string
  }

  'auth:logout': void

}

type Handler<T> =
  (data: T) => void

class EventBus {

  private listeners = {} as {

    [K in keyof Events]?:
      Handler<Events[K]>[]

  }

  emit<K extends keyof Events>(
    event: K,
    data: Events[K]
  ) {

    this.listeners[event]
      ?.forEach(
        handler => handler(data)
      )

  }

  on<K extends keyof Events>(
    event: K,
    handler: Handler<Events[K]>
  ) {

    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event]
      ?.push(handler)

  }

}

export const eventBus =
  new EventBus()
```

---

## Uso

```ts
eventBus.emit(
  'goal:completed',
  {
    goalId: '123'
  }
)
```

---

## Listener

```ts
eventBus.on(
  'goal:completed',
  ({ goalId }) => {

    showNotification(
      `Meta ${goalId} concluída`
    )

  }
)
```

---

## Regras

```txt
✓ eventos desacoplam features

✓ eventos representam acontecimentos

❌ eventos não substituem usecases

❌ eventos não substituem stores
```

---

# 14. Injeção de Dependência (DI)

Preferir DI tipada.

---

# Tokens

```ts
export const TOKENS = {

  goalRepository:
    Symbol(),

  createGoalUseCase:
    Symbol()

}
```

---

# Container

```ts
container.register(

  TOKENS.goalRepository,

  () =>
    new GoalRepository(
      apiClient
    )

)
```

---

## Benefícios

```txt
✓ type safety
✓ autocomplete
✓ desacoplamento
✓ testes melhores
```

---

# Regras

```txt
❌ evitar strings mágicas
❌ evitar any
```

---

# 15. Validação e Schemas

Validação centralizada.

---

## Exemplo

```ts
import { z } from 'zod'

export const GoalSchema =
z.object({

  title:
    z.string()
      .min(3),

  description:
    z.string()
      .optional()

})
```

---

# Regras

```txt
✓ schemas validam entrada
✓ usecases validam domínio
```

---

# 16. Testes

Estrutura:

```txt
usecases/__tests__/
repositories/__tests__/
hooks/__tests__/
```

---

## Exemplo

```ts
describe(
'CreateGoalUseCase',
() => {

  it(
  'deve validar título',
  async () => {

    const repositoryMock = {
      create: jest.fn()
    }

    const useCase =
      new CreateGoalUseCase(
        repositoryMock
      )

    await expect(

      useCase.execute({
        title: 'ab'
      })

    )
    .rejects
    .toThrow()

  })

})
```

---

## Regras

```txt
✓ mockar contratos
✓ testar domínio isolado

❌ mockar container inteiro
❌ testar implementação interna
```

---

# 17. Governança Arquitetural

---

# Dependências Permitidas

```txt
Feature → Shared
Feature → Core
Feature → Packages

Shared → Core
Shared → Packages

Packages → Packages
```

---

# Dependências Proibidas

```txt
Feature → Feature
Shared → Feature
Packages → Apps
Packages → Features
```

---

# dependency-cruiser

```bash
npm i -D dependency-cruiser
```

---

## Regra

```js
module.exports = {

  forbidden: [

    {

      name:
        'no-feature-to-feature',

      from: {
        path: 'src/features/.*'
      },

      to: {
        path:
          'src/features/(?!.*__tests__).*'
      }

    }

  ]

}
```

---

# CI

```yaml
Lint
TypeCheck
Tests
Build
Coverage
DependencyCruiser
```

---

# 18. Convenções de Nomenclatura

| Tipo       | Convenção           | Exemplo           |
| ---------- | ------------------- | ----------------- |
| Feature    | kebab-case          | goals             |
| Entity     | PascalCase          | Goal              |
| UseCase    | PascalCase          | CreateGoalUseCase |
| Repository | PascalCase          | GoalRepository    |
| Hook       | camelCase           | useCreateGoal     |
| DTO        | PascalCase + DTO    | GoalResponseDTO   |
| Mapper     | PascalCase + Mapper | GoalMapper        |
| Schema     | PascalCase + Schema | GoalSchema        |
| Store      | PascalCase + Store  | GoalUIStore       |

---

# 19. Barrel Exports

---

## Estrutura

```txt
components/

├── GoalCard.tsx
├── GoalProgress.tsx
└── index.ts
```

---

## index.ts

```ts
export * from './GoalCard'
export * from './GoalProgress'
```

---

## Regra

```txt
✓ usar em components
✓ usar em hooks
✓ usar em utils

❌ evitar em services
❌ evitar em stores
```

---

# 20. Packages e Compartilhamento

---

# Permitido

```txt
packages/ui
packages/utils
packages/domain
packages/types
```

---

# Evitar

```txt
packages/services
packages/stores
packages/features
```

---

## Motivo

```txt
services dependem de infraestrutura
stores dependem de domínio
features possuem contexto próprio
```

---

# 21. Evolução Arquitetural

---

## Fluxo de Evolução

```txt
Store gigante
 ↓
Extrair regras
 ↓
Criar UseCases
 ↓
Criar Repositories
 ↓
Separar DTO
 ↓
Adicionar DI
 ↓
Governança
```

---

# Estratégia

```txt
Comece simples.
Evolua apenas quando necessário.
```

---

# 22. Anti-patterns

---

# ❌ Store Fazendo API

```ts
const useGoalStore = create(() => ({

  fetchGoals: async () => {
    await api.get('/goals')
  }

}))
```

---

# ❌ Hook com Regra de Negócio

```ts
const useCreateGoal = () => {

  if(title.length < 3){
    throw new Error()
  }

}
```

---

# ❌ Feature Importando Feature

```ts
import { AuthStore }
from '@features/auth'
```

---

# ❌ Repository com Regra de Negócio

```ts
async create(data){

  if(data.title.length < 3){
    throw new Error()
  }

}
```

---

# ❌ Entidade Dependendo de DTO

```ts
class Goal {

  constructor(
    dto: GoalDTO
  ) {}

}
```

---

# ❌ Zustand Como Server State

```ts
const useGoalStore = create(() => ({

  goals: [],
  fetchGoals(){}

}))
```

---

# ❌ Shared Contendo Domínio

```txt
shared/hooks/useCreateGoal
```

---

# ❌ Evento Substituindo Fluxo Principal

```txt
Screen
 ↓
EventBus
 ↓
API
```

---

# 23. Checklist Final

```txt
□ responsabilidades claras

□ usecases centralizam regras

□ repositories isolam infraestrutura

□ DTO separado de entidade

□ mapper definido

□ React Query apenas server state

□ Zustand apenas client state

□ stores sem fetch

□ hooks sem regra pesada

□ DI tipada com tokens

□ features desacopladas

□ EventBus apenas para comunicação

□ schemas definidos

□ testes por contrato

□ governança automatizada

□ dependency-cruiser configurado

□ barrel exports controlados

□ packages independentes
```

---

# 24. Regra Final

```txt
Arquitetura não é árvore de pastas.

Arquitetura é:

Responsabilidade
        ↓
Pertencimento
        ↓
Isolamento
        ↓
Evolução
```

---

## Princípio Final

```txt
Comece simples.

Extraia quando houver duplicação.

Isole quando houver complexidade.

Governança quando houver escala.
```

---

**Versão:** 4.1
**Projeto:** DTask Architecture Guide
**Ano:** 2026

---

*"Arquitetura não serve para deixar o projeto bonito. Serve para impedir o caos conforme o sistema cresce."*

