# Figma AI Technical Architecture Prompt — NeuralArena

> **Purpose:** This prompt provides complete technical architecture information for Figma AI to CREATE A NEW UI/UX DESIGN and generate React/TypeScript code that integrates perfectly with NeuralArena's existing frontend (ThemeforFrontend) and backend (neuralarena/backend).
>
> **Important:** CREATE A NEW DESIGN based on the backend/frontend architecture below. Do not assume any existing design is perfect — design UI components, layouts, and flows that fit the technical specifications and game mechanics documented here. This is not about copying an existing design — it's about creating a design that matches the technical architecture.

---

## PROJECT OVERVIEW

**NeuralArena** is a hybrid game/data platform where players train browser-side ML models to solve vision tasks through tactical annotation gameplay.

### Core Concept
- Players train "Pet Detectives" (ML models) in their browser
- Annotation gameplay wrapped in card game mechanics (Balatro/MTG-inspired)
- Backend manages round lifecycle, scoring, persistence, quality control
- Frontend handles all model training/inference locally
- Data outputs are high-quality, logic-aware supervision for ML

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS v4, Framer Motion, React Router v7
- **Backend:** FastAPI (Python), SQLite, DINOv2/CLIPSeg for features
- **ML:** Browser-side SGD models (Regression, SVM, MLP, CNN, Transformer)
- **State:** React Context (GameContext) + IndexedDB for feature caching

---

## FRONTEND ARCHITECTURE

### Directory Structure
```
ThemeforFrontend/
├── src/
│   ├── main.tsx              # Bootstrap entry
│   ├── app/
│   │   ├── App.tsx           # Provider shell + Router
│   │   ├── routes.ts         # Route definitions (lazy-loaded)
│   │   ├── context/
│   │   │   ├── GameContext.tsx       # Global game state (auth, economy, team, round)
│   │   │   └── ToastContext.tsx      # UI notifications
│   │   ├── api/
│   │   │   ├── arenaApi.ts           # Backend API contracts
│   │   │   └── shared/
│   │   │       └── api/
│   │   │           ├── client.ts            # HTTP client
│   │   │           ├── roundApi.ts          # Round endpoints
│   │   │           ├── lobbyApi.ts          # Lobby endpoints
│   │   │           ├── authApi.ts           # Auth endpoints
│   │   │           ├── playerApi.ts         # Player state endpoints
│   │   │           └── modApi.ts            # Moderator endpoints
│   │   ├── pages/
│   │   │   ├── BoardPage.tsx        # Corkboard hub (primary landing)
│   │   │   ├── Battle.tsx           # Main annotation gameplay (LARGE monolith)
│   │   │   ├── Results.tsx          # Post-round debrief
│   │   │   ├── Loadout.tsx          # Squad assembly
│   │   │   ├── DeckDraftScreen.tsx  # Gwent-style card draft
│   │   │   ├── HubPage.tsx          # Mission selection
│   │   │   ├── PvP2.tsx             # PvP arena with ghost mode
│   │   │   ├── Market.tsx           # Card shop
│   │   │   ├── LeaderboardPage.tsx  # Rankings
│   │   │   ├── ModDashboard.tsx     # Admin console (LARGE monolith)
│   │   │   └── ... (other pages)
│   │   ├── components/
│   │   │   ├── Root.tsx                    # App shell + navbar
│   │   │   ├── DetectivePageShell.tsx       # Noir background wrapper
│   │   │   ├── detective/
│   │   │   │   ├── CasefileUI.tsx          # DetectiveRouteShell, CaseHeroHeader, CasePanel
│   │   │   │   ├── Polaroid.tsx            # Photo frame component
│   │   │   │   ├── StickyNote.tsx          # Sticky note component
│   │   │   │   ├── ManillaFolder.tsx        # Folder component
│   │   │   │   ├── Pin.tsx                 # Pin component
│   │   │   │   ├── LivePetCompanion.tsx    # Pet animation
│   │   │   │   ├── ActivePetGuide.tsx      # Pet guide UI
│   │   │   │   └── PetLearningIndicator.tsx
│   │   │   ├── PokemonCard.tsx             # Card component
│   │   │   └── arena/
│   │   │       ├── ArenaHUD.tsx
│   │   │       ├── ArenaLayout.tsx
│   │   │       └── ... (arena components)
│   │   ├── lib/
│   │   │   ├── pokemonModel.ts      # Browser ML implementations (5 architectures)
│   │   │   ├── featureCache.ts      # IndexedDB + memory feature caching
│   │   │   ├── modelTuning.ts       # Runtime tuning parameters
│   │   │   └── cardSystem.ts        # Card definitions + compatibility logic
│   │   ├── config/
│   │   │   └── masterConfig.ts      # Gameplay/model tuning constants
│   │   ├── data/
│   │   │   └── pokemon.ts           # Pokemon catalog + stats
│   │   └── hooks/
│   │       └── usePokemonModel.ts   # Frontend ML hook
│   └── styles/
│       ├── index.css               # Global styles + font imports
│       └── theme.css               # CSS variables (detective theme)
```

### Routing (routes.ts)
All routes use React Router v7 lazy loading:
```typescript
{ path: 'battle', lazy: async () => ({ Component: (await import('./pages/Battle')).Battle }) }
```

**Key Routes:**
- `/` → BoardPage (corkboard hub)
- `/hub` → HubPage (mission selection)
- `/deck-draft` → DeckDraftScreen (card draft)
- `/loadout` → Loadout (squad assembly)
- `/battle` → Battle (main gameplay)
- `/results` → Results (debrief)
- `/pvp2` → PvP2 (PvP with other players and ghost, /pvp is not working)
- `/market` → Market (shop)
- `/leaderboard` → LeaderboardPage
- `/mod` → ModDashboard (admin)

---

## GAME CONTEXT (Global State)

`GameContext.tsx` is the central state authority. It provides:

### Auth & Player
```typescript
isLoggedIn: boolean
loggedInPlayer: any | null
playerName: string
authLogin(username, password): Promise<{ok, error?}>
authRegister(username, password): Promise<{ok, error?}>
authLogout(): void
```

### Economy
```typescript
coins: number                    // Start: 10,000
diamonds: number                 // Start: 60
addCoins(amount): void
spendCoins(amount): boolean
addDiamonds(amount): void
spendDiamonds(amount): boolean
```

### Ranked Mode
```typescript
isRankedMode: boolean
currentStake: number
inRoundMarketEligible: boolean   // isRankedMode && currentStake > 0
stakeDiamonds(amount): boolean
```

### Inventory & Team
```typescript
inventory: Pokemon[]             // Player's owned Pokemon
teamEnsembles: TeamEnsembles     // [Q1[], Q2[], Q3[]] — up to 4 Pokemon each question..... VERY VERY IMPORTANT NOW ONLY ONE POKEMON PER ROUND NO ENSEMBLE, JUST ONE POKEMON!!!!
lastRoundTeamEnsembles: TeamEnsembles | null
addToEnsemble(qIdx, pokemon): void
removeFromEnsemble(qIdx, slotIdx): void
clearEnsemble(qIdx): void
autoSelectEnsembles(): void
```

### Glue Strategy (Model Fusion)
```typescript
glueStrategy: GlueStrategy       // 'average' | 'weighted' | 'max' | 'pessimistic' | 'majority_vote' | 'product'
setGlueStrategy(g): void
```

### Scores & Progression
```typescript
totalScore: number
lastRoundScore: number
roundResults: RoundResult[]
recordRound(results, accuracy?, theme?): void
leaderboard: LeaderboardEntry[]
roundsPlayed: number
```

### Round State
```typescript
roundId: string | null
imageSequence: string[]          // Train images
testImageIds: string[]           // Test images (unseen)
backendTools: BackendTool[]
evaluationResults: EvaluateResponse | null
roundTimeLimitSeconds: number    // Default: 180
roundType: RoundType             // 'dojo' | 'standard' | 'expert' | 'tournament'
selectedTheme: string
activeAssignment: RoundAssignment | null
```

### Honeypot (Integrity)
```typescript
honeypotAccuracy: number
honeypotSeen: number
```

### Deck Run (Gwent-style)
```typescript
activeDeck: Pokemon[]
exhaustedPokemon: number[]
deckRoundsPlayed: number
startDeckRun(deck): void
clearDeckRun(): void
```

### Roguelite Run State
```typescript
runRoundIndex: number
roundsSinceRedraft: number
currentRoundDeck: any[]
roundLockedSkillSlots: Record<string, boolean>
roundGlobalTactical: { sabotage, defense }
startRoundDeck(heroes): void
advanceRunRound(): void
needsRedraft(): boolean
```

### Usage Pattern
```typescript
import { useGame } from '../context/GameContext';

const YourPage = () => {
  const { playerName, coins, teamEnsembles, glueStrategy, ... } = useGame();
  // ...
};
```

---

## API CONTRACTS (arenaApi.ts)

### Base HTTP Client
```typescript
// src/app/shared/api/client.ts
apiFetch<T>(path, options?): Promise<T>
getBaseUrl(): string  // Resolves to http://127.0.0.1:8002 (local) or env var
```

### Key Types
```typescript
interface BackendTool {
  id: string
  name: string
  type: 'probe' | 'probe2' | 'sweep'
  description: string
  color: string
}

interface RoundAssignment {
  group_id: number
  round_number: number
  image_ids: string[]
  logical_set: {
    set_id: number
    question_ids: string[]
    questions: LogicalSetQuestion[]
  }
}

interface RoundStartResponse {
  round_id: string
  image_sequence: string[]
  tools: BackendTool[]
  test_image_ids: string[]
  honeypot_image_ids?: string[]
  ghost_seed_image_ids?: string[]
  time_limit_seconds: number
  mode: string
  honeypot_status: HoneypotStatus
  assignment?: RoundAssignment | null
  ghost_player?: { name, available, annotation_count, source } | null
  ghost_training_heatmaps?: Record<string, Record<string, number[][]>> | null
  ghost_annotation_count?: number
  ghost_name?: string | null
}

interface AnnotateResponse {
  latency_ms: number
  honeypot_result: { is_honeypot, passed, running_accuracy, health, warning_state } | null
  boot: boolean
  annotation_count: number
}

interface EvaluateResponse {
  by_tool: Record<string, {
    by_image: Record<string, {
      heatmap: number[][]
      overlay_mask: number[][]
      accuracy: number
      answer_key_mask: number[][] | null
      ghost_heatmap?: number[][]
      ghost_accuracy?: number
    }>
    accuracy_overall: number
    ghost_accuracy_overall?: number
  }>
  total_accuracy: number
  test_image_ids: string[]
  ghost_total_accuracy?: number
  ghost_name?: string
  ghost_heatmaps?: Record<string, Record<string, number[][]>>
  consensus_agreement?: number
}
```

### Key Endpoints
```typescript
arenaApi.startRound({ mode?, player_id?, lobby_id?, ghost_opponent? })
arenaApi.getImageUrl(imageId)  // Returns URL string
arenaApi.annotate({ round_id, image_id, tool_id, points?, mask?, architecture?, pokemon_uid?, ovr_weight?, glue? })
arenaApi.endRound({ round_id, player_id?, mode?, score?, annotation_count?, coins_earned?, consensus_agreement?, lobby_id? })
arenaApi.evaluate(image_ids[], player_name?)
arenaApi.getAnswerKey(imageId)  // Returns { by_tool: Record<string, number[][]> }
```

### Domain-Specific APIs
```typescript
// Round API (roundApi.ts)
startRound(body)
getImageUrl(imageId)
getRoundObjectMetadata(imageIds[])
annotate(body)
endRound(body)
evaluate(image_ids[], player_name?)
dojoConfig()
dojoAnnotate(body)

// Lobby API (lobbyApi.ts)
createLobby(body)
joinLobby(body)
getLobbyStatus(lobby_id)
getLobbyResults(lobby_id)
submitAnnotations(body)

// Auth API (authApi.ts)
login(username, password)
register(username, password)
logout()

// Player API (playerApi.ts)
getPlayerState(player_id)
savePlayer(body)

// Mod API (modApi.ts)
getImages()
uploadImage(file)
updateAnswerKey(body)
getAnswerKeyStatus()
...
```

---

## BROWSER ML ARCHITECTURE (pokemonModel.ts)

### Model Interface
```typescript
interface IModel {
  readonly fitted: boolean
  readonly dim: number
  fit(X: Float32Array[], y: number[], lr?, epochs?): void
  predictProba(x: Float32Array): number
  predictHeatmap(features: Float32Array, featureType?): number[][]
}
```

### Five Architectures
1. **LogisticRegressionModel** — Linear SGD, fast baseline
2. **SVMModel** — Modified-huber SGD, margin-based
3. **MLPModel** — 2-hidden-layer neural net, ReLU, SGD
4. **CNNModel** — LogisticRegression on 3×3 context-expanded features
5. **TransformerModel** — Non-parametric cosine cross-attention

### Feature Dimensions
```typescript
FEATURE_DIMS = {
  dino: { cols: 30, dim: 384 },      // DINOv2 features
  clip: { cols: 30, dim: 768 },      // CLIP features
  combined: { cols: 30, dim: 1152 }  // DINO + CLIP concatenated
}
```

### Heatmap Generation
All models predict on 30×30 patch grid (IMAGE_SIZE=420px, CELL=14px):
```typescript
predictHeatmap(features: Float32Array, featureType?: string): number[][]
// Returns 30×30 heatmap [0,1] values
```

### Usage Pattern (usePokemonModel.ts)
```typescript
import { usePokemonModel } from '../hooks/usePokemonModel';

const { trainModel, predictHeatmap, seedFromMasks } = usePokemonModel();

// Train on annotations
trainModel({
  architecture: 'MLP',
  toolId: 'tool_1',
  annotations: [{ x, y, label }],  // or mask
  features: dinoFeatures,
  lr: 0.5,
  epochs: 5
});

// Predict
const heatmap = predictHeatmap({
  architecture: 'MLP',
  toolId: 'tool_1',
  features: dinoFeatures
});

// Ghost seeding (from honeypot answer keys)
seedFromMasks({
  architecture: 'MLP',
  toolId: 'tool_1',
  masks: { image_id: number[][] },
  features: { image_id: Float32Array }
});
```

---

## CARD SYSTEM (cardSystem.ts)

### Card Definition
```typescript
interface CardDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'part' | 'boost'
  rarity: 'common' | 'rare' | 'epic'
  color: string
  compatibleArchitectures: string[]  // Empty = universal
  accuracyGain: number
  slotType: 'part_common_1' | 'part_common_2' | 'part_rare' | 'part_epic' | 'boost' | 'tactical'
  ovrWeightMult: number              // Multiplier on sub-model weight
  extraLr: number | null             // Bonus training LR
  extraEpochs: number | null         // Bonus training epochs
  role?: 'boost' | 'sabotage' | 'defense'
  focusCost?: number
}
```

### Card Effects
Cards modify hero models at two points:
1. **Post-annotation compile** (when player clicks FINISH) — extra training passes + weight boosts
2. **Test-time inference** — ovrWeight multipliers affect ensemble prediction weighting

### Architecture Colors
```typescript
Regression: '#5DB44B'
SVM: '#C8C8E0'
MLP: '#FF7C26'
CNN: '#A890F0'
Transformer: '#FF6DAE'
```

### Hand Drawing
```typescript
drawFullDeck(slotArchitectures): HandCard[]  // 11-card fixed composition
drawCardsForSlots(slotArchitectures): HandCard[]  // 3-card targeted draw
```

---

## BACKEND ARCHITECTURE

### Entry Point
`neuralarena/backend/main.py` — FastAPI application with modular routers

### Routers (Modular Structure)
```python
from api_health import create_health_router
from api_dojo import create_dojo_router
from api_detective import create_detective_router
from api_lobby import create_lobby_router
from api_cycling import create_cycling_router
from api_mod_core import create_mod_core_router
from api_core_ops import create_core_ops_router
from api_mod_content import create_mod_content_router
from api_mod_gqa import create_mod_gqa_router
from api_round import create_round_router
from api_player import create_player_router

app.include_router(create_health_router(...))
app.include_router(create_dojo_router(...))
# ... etc
```

### Database Schema (db.py)
```sql
-- Players
CREATE TABLE players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT DEFAULT '',
  created_at REAL NOT NULL,
  total_score INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 10000,
  diamonds INTEGER DEFAULT 60,
  trust REAL DEFAULT 1.0,
  league TEXT DEFAULT 'bronze',
  rounds_played INTEGER DEFAULT 0,
  dojo_completed INTEGER DEFAULT 0,
  roster_json TEXT DEFAULT '[]',
  purchases_json TEXT DEFAULT '[]',
  inventory_json TEXT DEFAULT '[]'
);

-- Annotations
CREATE TABLE annotations (
  ann_id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  ann_type TEXT NOT NULL,  -- 'probe' or 'sweep'
  data_json TEXT NOT NULL,  -- JSON blob of points/mask
  architecture TEXT DEFAULT 'Regression',
  pokemon_uid TEXT,
  created_at REAL NOT NULL
);

-- Trust Scores
CREATE TABLE trust_scores (
  player_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  trust REAL DEFAULT 1.0,
  honeypot_accuracy REAL DEFAULT 1.0,
  consensus_agreement REAL DEFAULT 0.0,
  updated_at REAL NOT NULL,
  PRIMARY KEY (player_id, tool_id)
);

-- Lobbies
CREATE TABLE lobbies (
  lobby_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  created_at REAL NOT NULL,
  started_at REAL,
  finished_at REAL,
  result_json TEXT
);

-- Matches
CREATE TABLE matches (
  match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lobby_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  score REAL DEFAULT 0,
  rank INTEGER DEFAULT 0,
  consensus_agreement REAL DEFAULT 0,
  annotation_count INTEGER DEFAULT 0,
  created_at REAL NOT NULL
);

-- Lobby Heatmaps
CREATE TABLE lobby_heatmaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lobby_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  heatmap_json TEXT NOT NULL,
  created_at REAL NOT NULL
);

-- Cycling Engine Tables
CREATE TABLE lobby_cycles (
  cycle_id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL,
  P INTEGER NOT NULL,  -- total players
  G INTEGER NOT NULL,  -- partitions
  Ls INTEGER NOT NULL,  -- logical sets count
  images_per_player INTEGER DEFAULT 20,
  image_blocks_json TEXT NOT NULL,
  player_groups_json TEXT NOT NULL,
  logical_sets_json TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at REAL NOT NULL,
  completed_at REAL
);

CREATE TABLE cycle_rounds (
  round_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at REAL,
  completed_at REAL,
  metrics_json TEXT
);

CREATE TABLE round_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  ...
);
```

### Backend Engines
```python
# dino_engine.py — Feature extraction and serving
get_image_ids()
get_features(image_id)
is_loaded()
get_loading_status()
invalidate_image_id_cache()

# clipseg_engine.py — Prompt segmentation
# sam_engine.py — SAM support (optional)

# answer_key_builder.py — Ground truth and scoring
get_ground_truth_mask(image_id, tool_id)
sweep_accuracy(pred_mask, gt_mask)
probe_accuracy(pred_points, gt_mask)
build_answer_key(image_id, tool_id, prompt)
save_answer_key(image_id, tool_id, heatmap)
save_honeypot_key(image_id, tool_id, heatmap)
invalidate_gt_cache()

# honeypot_engine.py — Hidden GT integrity
load_honeypot_index()
seed_honeypots()
check_honeypot(image_id, tool_id, annotation)
record_honeypot_result(player_id, tool_id, passed)
get_running_accuracy(player_id, tool_id)
get_status(player_id, tool_id)
should_boot(player_id, tool_id)
start_round(player_id)
end_round(player_id)

# pokemon_engine.py — Legacy backend-training compatibility
reset_tool_models()
add_annotation()
flash_train()
predict_heatmap()
predict_heatmaps_batch()
export_weights()
get_tool_ids_with_models()
preload_feature_cache()
flash_train_all_forced()
get_cached_features()
set_tool_glue(tool_id, glue)
get_ensemble_info()
recommend_best_squad(available_architectures)

# task_dispatcher.py — Trust, league, partition metrics
compute_league()
# ... partition metrics, image queueing

# cycling_engine.py — Large-lobby assignment cycling
CyclingEngine, CyclePlan, RoundPlan, PlayerAssignment
# Latin Square rotation logic

# demo_pipeline.py — Benchmark/manual demo pipeline
materialize_iteration_ground_truth()
# ...
```

### Backend Constants (config.py)
```python
DATA_DIR = ...
IMAGES_DIR = ...
IMAGE_SIZE = 420
PATCH_GRID = 30
TRAIN_DIR = ...
TEST_DIR = ...
DOJO_DIR = ...
ANSWER_KEY_DIR = ...
HONEYPOTS_DIR = ...
ARENA_CONFIG_PATH = ...
MAX_IMAGES_PER_ROUND = ...
TEST_IMAGES_PER_ROUND = ...
TIME_LIMITS_SECONDS = {'dojo': 180, 'standard': 180, 'expert': 300, 'tournament': 300}
```

---

## POKEMON DATA MODEL

### Pokemon Interface
```typescript
interface Pokemon {
  id: number
  name: string
  types: string[]
  rarity: string
  architecture: string  // 'Regression' | 'SVM' | 'MLP' | 'CNN' | 'Transformer'
  stats: {
    accuracy: number   // 0-100
    pace: number       // 0-100
    spatial: number    // 0-100
    verbal: number     // 0-100
  }
  price: number
  priceCurrency: 'coins' | 'diamonds'
}
```

### Starter Inventory
```typescript
STARTER_INVENTORY_IDS = [/* Pokemon IDs */]
```

### Overall Rating Calculation
```typescript
overall = accuracy * 0.45 + pace * 0.25 + spatial * 0.2 + verbal * 0.1
```

---

## UI/UX DESIGN REQUIREMENTS

### Design Philosophy
- **Detective Noir Theme** — Serious, professional game aesthetic inspired by detective case files, corkboards, and investigation
- **Balatro/MTG-inspired Card Mechanics** — Tactical card play with visual feedback
- **Browser ML Training Visualization** — Show model learning in real-time with heatmaps, confidence indicators, and training progress
- **Progressive Information Disclosure** — Reveal game mechanics gradually through gameplay, not tutorials
- **Competitive Progression** — Clear visual indicators of player advancement, league promotion, and skill growth

### Critical Game Mechanics to Design UI For

#### 1. Single Pokemon Per Round (CRITICAL)
**VERY VERY IMPORTANT: ONLY ONE POKEMON PER ROUND, NO ENSEMBLES. JUST ONE POKEMON!!!!**

UI Must Support:
- Pokemon selection screen (Loadout) where player chooses ONE Pokemon for the round
- Clear visual indication of selected Pokemon vs inventory
- Pokemon stats display (accuracy, pace, spatial, verbal) with visual bars
- Architecture type indicator (Regression/SVM/MLP/CNN/Transformer) with color coding
- Pokemon preview with sprite and stat breakdown
- Post-round Pokemon performance summary showing how the model performed

#### 2. Annotation Gameplay (Battle Page)
UI Must Support:
- **Image Canvas** — 420×420px annotation area with zoom/pan
- **Tool Selection** — Probe (point) vs Sweep (mask) tool toggle with clear visual distinction
- **Annotation Input** — Click-to-annotate for probe, drag-to-paint for sweep
- **Heatmap Overlay** — Real-time model confidence visualization (30×30 grid)
- **Training Progress** — Visual indicator of model learning from annotations
- **Focus Bar** — Resource management for annotation actions
- **Timer** — Countdown display for round time limit
- **Tool Metadata** — Question/prompt text, tool color, description
- **Ghost Preview** — Optional ghost opponent heatmap comparison

#### 3. Card System Integration
UI Must Support:
- **Card Hand Display** — 11-card hand layout with drag-and-drop assignment
- **Card Types** — Part cards (architecture-specific), Boost cards (universal), Tactical cards (sabotage/defense)
- **Card Rarity** — Common (gray), Rare (purple), Epic (gold) visual distinction
- **Card Compatibility** — Visual indicator of which Pokemon slot a card can target
- **Card Effects Preview** — Show accuracy gain, ovrWeight multiplier, training bonus
- **Gwent-style Draft Animation** — Card draw animation during deck draft phase
- **Post-annotation Compile** — Visual feedback when cards modify model weights
- **Test-time Multipliers** — Show card effects during final evaluation

#### 4. PvP2 Arena (Multiplayer with Ghost)
UI Must Support:
- **Lobby Browser** — List of active lobbies with player count, mode, stakes
- **Lobby Creation** — Configure lobby settings (mode, ranked stake, ghost opponent)
- **Waiting Room** — Show joined players, lobby status, ready indicators
- **Ghost Mode Toggle** — Option to play against ghost opponent
- **Split-screen Reveal** — Side-by-side player vs ghost accuracy comparison
- **Consensus Agreement Display** — Show how player annotations compare to lobby consensus
- **Real-time Opponent Presence** — Tiny avatars with live action pings showing opponent activity

#### 5. Corkboard Hub (BoardPage - Primary Landing)
UI Must Support:
- **Interactive Corkboard Layout** — Nodes representing game modes, features, progression
- **Red String Connections** — SVG lines connecting related nodes with mouse parallax
- **Node Types** — Polaroid photos, sticky notes, manilla folders for different content
- **Mouse Parallax Effects** — Subtle depth movement on mouse hover
- **Progression Visualization** — Unlock paths showing player advancement
- **Mission Selectors** — Clickable nodes to navigate to different game modes

#### 6. Detective Theme Components
UI Must Support:
- **DetectiveRouteShell** — Noir radial vignette background with scanlines overlay
- **CaseHeroHeader** — Page header with eyebrow, title, description, redacted labels
- **CasePanel** — Decorative panel with accent colors for content grouping
- **CaseChip** — Label chips for metadata tags
- **CaseButton** — Styled buttons with detective aesthetic
- **Polaroid** — Photo frame component with pin and caption
- **StickyNote** — Sticky note component with customizable colors
- **ManillaFolder** — Folder component with tab and content area
- **Pin** — Decorative pin component
- **DetectiveStamp** — Rubber stamp visual for case file status
- **DetectiveRedactedLabel** — Redacted text effect for classified information

#### 7. Live Pet Companion
UI Must Support:
- **Pet Animation** — Live animated Pokemon companion in corner of screen
- **Pet State** — Show pet's current state (idle, training, predicting, celebrating)
- **Pet Learning Indicator** — Visual feedback when pet learns from annotations
- **Pet Guide UI** — Contextual hints and tips from the pet companion
- **Pet Personality** — Different animations/behaviors based on Pokemon type

#### 8. Results & Debrief
UI Must Support:
- **Per-Tool Accuracy Breakdown** — Bar charts showing accuracy by tool
- **Heatmap Comparison** — Player heatmap vs answer key vs ghost heatmap
- **Consensus Agreement** — How player annotations compare to other players
- **Honeypot Status** — Hidden integrity check results (pass/fail, running accuracy)
- **Score Breakdown** — Points from accuracy, bonuses, penalties
- **Pokemon Performance** — How the selected Pokemon performed on this round
- **Card Effect Summary** — Which cards contributed to performance
- **Progression Updates** — League promotion, coin/diamond rewards, XP gain

#### 9. Market (Card Shop)
UI Must Support:
- **Card Catalog** — Browse all available cards with rarity and compatibility
- **Purchase Interface** — Buy cards with coins/diamonds
- **Card Preview** — Detailed view of card effects and compatibility
- **Inventory Display** — Show owned cards and available slots
- **Architecture Filtering** — Filter cards by compatible architecture

#### 10. Leaderboard
UI Must Support:
- **Rank Display** — Player ranking with visual tier indicators
- **Score Breakdown** — Total score, recent round score, win count
- **Pokemon Roster** — Show which Pokemon top players use
- **League Indicators** — Bronze/Silver/Gold/Diamond league badges
- **Player Search** — Find specific players

#### 11. HubPage (Mission Selection)
UI Must Support:
- **Mission Cards** — Different game modes (Dojo, Standard, Expert, Tournament)
- **Difficulty Indicators** — Visual representation of challenge level
- **Reward Preview** — Show potential rewards for each mission
- **Prerequisites** — Show unlock requirements
- **Mission Descriptions** — Explain what each mode entails

#### 12. Loadout (Squad Assembly)
UI Must Support:
- **Pokemon Selection** — Choose ONE Pokemon from inventory (CRITICAL: NO ENSEMBLES)
- **Stat Comparison** — Compare Pokemon stats side-by-side
- **Architecture Preview** — Show ML architecture type and capabilities
- **Inventory Management** — View all owned Pokemon with filters
- **Purchase Prompt** — Suggest Pokemon to buy if inventory is limited

### CSS Variables for Detective Theme
```css
--det-bg-dark: #0A0E14
--det-bg-panel: #151922
--det-bg-surface: #1E2430
--det-text-primary: #F8FAFC
--det-text-secondary: #B8C4D0
--det-text-muted: #64748B
--det-accent-green: #22C55E
--det-accent-amber: #F59E0B
--det-accent-red: #EF4444
--det-accent-blue: #3B82F6
--det-border: #334155
--det-border-light: #475569
--det-font-main: 'Rajdhani', sans-serif
--det-font-display: 'Space Grotesk', sans-serif
--det-font-hand: 'Caveat', cursive
```

### Architecture Color Coding
```typescript
Regression: '#5DB44B'  // Green
SVM: '#C8C8E0'        // Purple-gray
MLP: '#FF7C26'        // Orange
CNN: '#A890F0'        // Lavender
Transformer: '#FF6DAE' // Pink
```

### Animation Patterns (Framer Motion)
- **Card Draw** — Slide in from deck with slight rotation
- **Card Hover** — Scale up 1.05 with shadow increase
- **Card Play** — Move to target slot with fade out
- **Annotation** — Ripple effect on click/paint
- **Heatmap Reveal** — Fade in with scan effect
- **Pet Animation** — Idle breathing animation, celebration bounce
- **Progress Bar** — Smooth fill with overshoot effect
- **Modal Open** — Scale up from center with backdrop blur
- **Toast Notification** — Slide in from top with auto-dismiss

### Responsive Requirements
- **Desktop** — Full-width layout with sidebar navigation
- **Tablet** — Stacked layout with collapsible panels
- **Mobile** — Single-column layout with bottom navigation
- **Canvas** — Annotation canvas must be responsive while maintaining 420×420 aspect ratio

---

## GAMEPLAY FLOWS

### Solo Loop
```
LOADOUT (Select ONE Pokemon) → BATTLE_INTRO → BATTLE_PLAYING (Annotate with cards) → BATTLE_AUTOTEST (Model predicts on test images) → BATTLE_DONE → RESULTS (Accuracy breakdown, rewards)
```

### PvP Loop
```
LOBBY_CREATE → LOBBY_WAITING (Other players join) → LOBBY_READY → BATTLE_ASSIGNMENT → PVP_ANNOTATION → PVP_SUBMIT → PVP_RESULTS (Consensus scoring, ghost comparison)
```

### Ghost Loop
```
GHOST_SEED (Train from honeypot answer keys) → GHOST_TRAIN (Model learns) → GHOST_PREDICT (Predict on test images) → GHOST_REVEAL (Compare to player performance)
```

---

## COMPONENT PATTERNS

### Page Shell Pattern
Most pages use `DetectiveRouteShell`:
```typescript
import { DetectiveRouteShell, CaseHeroHeader, CasePanel } from '../components/detective/CasefileUI';

const YourPage = () => {
  return (
    <DetectiveRouteShell caseLabel="Your Label" caseMeta="Your Meta">
      <CaseHeroHeader
        eyebrow="EYEBROW TEXT"
        title="PAGE TITLE"
        description="Description text"
      />
      <CasePanel title="Panel Title" accent="#F59E0B">
        {/* content */}
      </CasePanel>
    </DetectiveRouteShell>
  );
};
```

### State Access Pattern
```typescript
import { useGame } from '../context/GameContext';

const { playerName, coins, teamEnsembles, glueStrategy, ... } = useGame();
```

### API Call Pattern
```typescript
import arenaApi from '../api/arenaApi';

const response = await arenaApi.startRound({ mode: 'standard', player_id: playerId });
```

---

## KEY INTEGRATION POINTS

### When Generating Code for Pages

1. **Use GameContext** for all game state access
2. **Use arenaApi** for all backend communication
3. **Use usePokemonModel** for ML training/prediction
4. **Use cardSystem** for card compatibility logic
5. **Wrap in DetectiveRouteShell** for detective-themed pages
6. **Follow lazy-loading pattern** in routes.ts

### When Generating Components

1. **Use TypeScript interfaces** for all props
2. **Use inline styles** with CSS variables (not Tailwind utilities)
3. **Use Framer Motion** for animations (standard patterns)
4. **Import from correct paths** (see directory structure)
5. **Export as default or named export** consistently

### Data Flow

```
User Action → Component → GameContext State → arenaApi → Backend → Database
                                                    ↓
                                            Feature Cache (IndexedDB)
                                                    ↓
                                            Browser ML (pokemonModel.ts)
```

---

## CRITICAL CONSTRAINTS

1. **Browser-side ML only** — No backend model training during rounds
2. **GameContext is single source of truth** — Don't duplicate state
3. **arenaApi is single API client** — Don't make direct fetch calls
4. **Detective theme uses CSS variables** — Use `--det-*` tokens
5. **Lazy-load all routes** — Use React Router v7 lazy loading
6. **TypeScript strict mode** — Define all interfaces explicitly
7. **IndexedDB for features** — Use featureCache.ts for feature fetching
8. **SQLite for persistence** — Backend owns all durable state
9. **No UI libraries** — Custom components only (no shadcn, MUI, etc.)
10. **Framer Motion for animations** — Standard patterns only

---

## FILES TO REFERENCE WHEN GENERATING

### Frontend
- `src/app/routes.ts` — Route definitions
- `src/app/context/GameContext.tsx` — State contracts
- `src/app/api/arenaApi.ts` — API contracts
- `src/app/lib/pokemonModel.ts` — ML implementations
- `src/app/lib/cardSystem.ts` — Card system
- `src/app/hooks/usePokemonModel.ts` — ML hook
- `src/app/config/masterConfig.ts` — Tuning constants

### Backend
- `neuralarena/backend/main.py` — Router definitions
- `neuralarena/backend/db.py` — Database schema
- `neuralarena/backend/config.py` — Constants
- `neuralarena/backend/dino_engine.py` — Features
- `neuralarena/backend/honeypot_engine.py` — Integrity
- `neuralarena/backend/cycling_engine.py` — Lobby cycling

---

## SUMMARY

**What Figma AI Must Know:**
1. Project is a browser-side ML annotation game with card mechanics
2. Frontend uses React 19 + TypeScript + GameContext for state
3. Backend uses FastAPI + SQLite for persistence
4. ML runs entirely in browser (5 architectures)
5. Cards modify models at compile-time and test-time
6. Ghost mode trains from honeypot answer keys
7. PvP uses lobbies with consensus scoring
8. Detective theme uses CSS variables (not Tailwind utilities)
9. All API calls go through arenaApi
10. All game state goes through GameContext

**What Figma AI Should Do:**
1. **CREATE A NEW UI/UX DESIGN** based on the backend/frontend architecture and game mechanics documented above — do not assume any existing design is perfect
2. Design all UI components, layouts, and flows to match the technical specifications (see UI/UX DESIGN REQUIREMENTS section)
3. Generate React components that integrate with existing architecture (GameContext, arenaApi, usePokemonModel, cardSystem)
4. Use GameContext for all state access (auth, economy, inventory, team, round, honeypot, deck run)
5. Use arenaApi for all backend communication (round start, annotate, evaluate, lobby, auth, player, mod)
6. Follow the file structure and patterns documented above (lazy-loading routes, component paths, TypeScript interfaces)
7. Use inline styles with CSS variables from the detective theme (--det-* tokens)
8. Implement the detective theme components (DetectiveRouteShell, CaseHeroHeader, CasePanel, Polaroid, StickyNote, etc.)
9. Design for the "ONE POKEMON PER ROUND" constraint — no ensembles, single Pokemon selection in Loadout
10. Implement Framer Motion animations for cards, annotations, heatmaps, pet companion, and UI transitions
11. Design responsive layouts (desktop, tablet, mobile) with proper breakpoints
12. Preserve all existing data contracts and API shapes (BackendTool, RoundAssignment, RoundStartResponse, AnnotateResponse, EvaluateResponse, etc.)
13. Use architecture color coding for Pokemon and card types (Regression green, SVM purple-gray, MLP orange, CNN lavender, Transformer pink)
14. Design the corkboard hub (BoardPage) with interactive nodes, red string connections, and mouse parallax effects
15. Design PvP2 arena with lobby browser, waiting room, split-screen reveal, and ghost mode toggle
16. Design card system with 11-card hand layout, drag-and-drop assignment, rarity visual distinction, and compatibility indicators
17. Design live pet companion with animations, state indicators, learning feedback, and guide UI
18. Design results/debrief with per-tool accuracy breakdown, heatmap comparison, consensus agreement, honeypot status, and progression updates
