# セットアップページ実装要件調査レポート

**調査日**: 2025-11-04  
**対象**: `/front` セットアップページおよび関連機能

## 概要

現在のフロントエンドはモック状態で動作している。実際のバックエンドAPIとの連携や外部サービスとの統合が必要。セットアップページから順に実装要件を洗い出した。

---

## 1. 状態管理リファクタリング (必須)

### 現状
- `sessionStorage`を直接操作（`app/setup/page.tsx`, `app/home/page.tsx`）
- useState + useEffect の組み合わせで同期
- ページ間でデータ共有が煩雑

### 必要な実装

#### 1.1 Jotaiによる状態管理への移行
**該当ファイル**: 
- `app/setup/page.tsx` (L18-20, L44-48, L63-70)
- `app/home/page.tsx` (L20-27, L43-48, L62-92)

**実装内容**:
1. Jotai導入: `npm install jotai`
2. Atomの作成:
   - `userDataAtom` - ユーザー全体のデータ
   - `nicknameAtom` - ニックネーム
   - `destinationsAtom` - 目的地配列
3. sessionStorage同期用のAtomEffect作成
4. 既存のuseState/sessionStorage操作をAtomに置き換え

**実装例**:
```typescript
// app/lib/store.ts (新規作成)
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { UserData } from './types';

export const userDataAtom = atomWithStorage<UserData | null>(
  'userData',
  null,
  {
    getItem: (key) => {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: (key, value) => {
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      sessionStorage.removeItem(key);
    },
  }
);
```

**データモデル** (`app/lib/types.ts`):
```typescript
UserData {
  nickname: string
  destinations: Destination[]
}

Destination {
  id: string
  name: string
  address: string
  placeId?: string  // Google Places API用
  latitude: number
  longitude: number
  frequency: Frequency
  createdAt: string
}

Frequency {
  days: number[]  // 0-6 (日-土)
  time: string    // HH:MM
}
```

---

## 2. Google Maps API統合 (必須)

### 現状
- モックの検索結果を使用
- 緯度経度はハードコード
- 地図表示は疑似的なグリッド表示

### 必要な実装

#### 2.1 Google Maps Places API - 場所検索
**該当ファイル**: 
- `app/components/setup/DestinationStep.tsx` (L17-32)
- `app/components/AddDestinationDialog.tsx` (L29-34)

**実装内容**:
- テキスト検索 → Place候補の取得
- Place Details APIで詳細情報（住所、座標、placeId）取得
- オートコンプリート機能（推奨）

**必要なデータ**:
- `placeId` (Google Places固有ID)
- `name` (施設名)
- `formatted_address` (住所)
- `geometry.location` (緯度経度)

**参考**: 
```tsx
// 現在のモックコード (L17-23)
const mockSearchResults = [
  { name: '新宿御苑', address: '東京都新宿区内藤町11', lat: 35.6851, lng: 139.7101 },
  // ... 実際はPlaces API Autocomplete or Text Searchで取得
];
```

#### 2.2 Google Maps JavaScript API - 地図表示
**該当ファイル**: 
- `app/components/MapView.tsx` (L88-231)

**実装内容**:
- Google Maps埋め込み
- マーカー表示（目的地ごと）
- 現在地マーカー
- マップクリックでInfoWindow表示
- マップ中心の自動計算（複数マーカーに対応）

**必要な機能**:
- `google.maps.Map` 初期化
- `google.maps.Marker` 配置
- Geolocation APIとの連携（既に実装済み: L18-40）

**現在の疑似実装**: L107-231（グリッド背景 + 手動配置のpin）

#### 2.3 環境変数設定
**必要な設定**:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**取得方法**:
1. Google Cloud Platformでプロジェクト作成
2. Maps JavaScript API有効化
3. Places API有効化
4. APIキー作成（HTTPリファラー制限推奨）

**使用ライブラリ**: `@react-google-maps/api` (決定済み)

---

## 3. 位置情報・通知機能 (今後必要になる可能性大)

### 現状
- Geolocation APIで現在位置取得のみ実装 (`MapView.tsx` L18-40)

### 今後必要になる機能

#### 3.1 プッシュ通知
**用途**: 
- 指定曜日・時刻に「今日は○○へ行く日です！」と通知
- 目的地付近到達時の通知

**実装方法**: PWA + Web Push API + Service Worker (決定済み)

**実装時の検討事項**:
- 通知トリガー: 指定時刻 or 位置情報ベース or 両方
- スケジューリング: クライアント側（Notification API + setTimeout/setInterval）
- 権限取得のタイミングとUX設計

#### 3.2 訪問履歴・チェックイン機能
**用途**: 
- 実際に訪れたかどうかの記録
- 習慣化の達成率計算

**必要なAPI追加**:
```
POST /api/destinations/:id/visits  - 訪問記録
GET  /api/destinations/:id/visits  - 訪問履歴取得
```

**現在未実装**: `TaskHistory.tsx`コンポーネントは存在するが未調査

---

## 4. UI/UX改善項目 (優先度: 中)

### 4.1 バリデーション強化
**該当箇所**:
- ニックネーム: 最大20文字（実装済み）
- 場所検索: 未選択時の次へボタン制御（実装済み）
- 頻度設定: 曜日0個の場合の制御（実装済み）

**追加検討**:
- ニックネーム最小文字数
- 特殊文字制限
- 重複目的地チェック

### 4.2 エラーハンドリング
**現状**: `toast`でエラー表示のみ
**追加検討**:
- API通信エラー時のリトライ
- ネットワークオフライン検知
- Fallback UI

### 4.3 ローディング状態
**現状**: 一部実装（位置情報取得時など）
**追加検討**:
- API呼び出し中のスケルトンUI
- Suspense境界の設定

---

## 5. スクリーンサイズ最適化 (対応済み)

✅ **完了**: 2025-11-04
- 余白削減
- 縦スクリーンに収まるよう調整
- スクロール不要化

---

## 実装の優先順位

### Phase 1: 最小構成 (MVP)
1. **Jotaiによる状態管理リファクタリング** ⭐ 最優先
2. **Google Maps Places API統合**（場所検索）
3. **Google Maps JavaScript API統合**（地図表示）

### Phase 2: 機能拡張
4. **訪問履歴機能**（チェックイン、達成率）
5. **PWAプッシュ通知機能**（リマインダー）
6. **エラーハンドリング改善**

### Phase 3: 体験向上
7. **オートコンプリート強化**
8. **Service Worker最適化**（オフライン対応）
9. **アニメーション追加**

---

## 技術選定結果

### ✅ 認証・データベース
**決定**: なし（sessionStorageで管理）
**理由**: MVP段階ではバックエンド不要、クライアント完結

**実装方針**:
- sessionStorageを**Jotai**で状態管理
- 現在の直接sessionStorage操作をAtomに置き換え
- ページリロード時のデータ永続化はsessionStorageのまま

### ✅ Google Maps
**決定**: ライブラリ使用予定
**候補**:
- `@react-google-maps/api` (推奨)
- `@googlemaps/react-wrapper`

### ✅ 位置情報
**決定**: Web Geolocation API使用
**現状**: 既に実装済み (`MapView.tsx` L18-40)
**追加実装**: 不要（現状で十分）

### ✅ 通知機能
**決定**: PWAプッシュ通知として実装
**方式**: Web Push API + Service Worker
**実装時期**: Phase 2以降
**検討事項**: 
- 通知トリガーのタイミング（指定時刻、位置情報ベース）
- Service Workerのスケジューリング方法
- ブラウザ通知権限の取得UX

---

## 補足: 現在使用中のパッケージ

```json
"dependencies": {
  "next": "16.0.1",
  "react": "19.2.0",
  "@radix-ui/*": "...", // UI components (shadcn/ui)
  "lucide-react": "^0.487.0",  // Icons
  "sonner": "...",  // Toast notifications
  // Google Maps関連は未導入
}
```

**追加が必要なパッケージ候補**:
- `@googlemaps/react-wrapper` または `@react-google-maps/api`
- `@types/google.maps`

---

## まとめ

### 即座に実装が必要な項目
1. **Jotaiによる状態管理リファクタリング** - sessionStorageの直接操作を排除
2. **Google Maps API統合** (Places検索 + 地図表示)

### Phase 2で実装する項目
3. **訪問履歴・チェックイン機能**
4. **PWAプッシュ通知** (Web Push API + Service Worker)

---

## 次のアクション

### 1. パッケージ追加
```bash
npm install jotai
npm install @react-google-maps/api
npm install @types/google.maps --save-dev
```

### 2. 環境変数設定
```.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Issue切り分け候補

#### Phase 1: 状態管理とセットアップページ実装

**Issue #1: Jotaiを導入して全体の状態管理をリファクタリングする**
- **担当**: @yotu (本人担当)
- **対象**: 全体
- **内容**:
  - `jotai` パッケージのインストール
  - `app/lib/store.ts` 作成
  - `userDataAtom` の実装（atomWithStorageでsessionStorage連携）
  - Provider設定（`app/layout.tsx`）
  - `app/setup/page.tsx` のJotai対応（useState → useAtom）
  - `app/home/page.tsx` のJotai対応（useState → useAtom）
  - sessionStorage直接操作の削除
- **成果物**: Jotai環境構築完了、全ページがJotaiで動作
- **影響範囲**: プロジェクト全体
- **優先度**: 🔴 最高

---

**Issue #2: DestinationStepコンポーネントにGoogle Maps Places API検索を実装する**
- **対象**: `app/components/setup/DestinationStep.tsx`
- **内容**:
  - `@react-google-maps/api` インストール
  - Google Maps Places Autocomplete実装
  - モック検索結果をAPI呼び出しに置き換え
  - placeId、座標の取得
  - 環境変数 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 設定
- **成果物**: セットアップページで実際の場所検索が可能
- **依存**: なし（並行作業可能）
- **優先度**: 🟡 中

---

**Issue #3: MapViewにGoogle Maps地図を実装する**
- **対象**: `app/components/MapView.tsx`
- **内容**:
  - `@react-google-maps/api` の GoogleMap コンポーネント使用
  - モックのグリッド背景を実際の地図に置き換え
  - Marker配置（目的地ごと）
  - 現在地Marker追加
  - InfoWindow表示（マーカークリック時）
- **成果物**: ホームページで実際の地図表示
- **依存**: Issue #2完了推奨（API key共通利用）
- **優先度**: 🟡 中

---

#### Phase 2: 目的地追加ダイアログの実装

**Issue #4: AddDestinationDialogにGoogle Maps Places API検索を実装する**
- **対象**: `app/components/AddDestinationDialog.tsx`
- **内容**:
  - Issue #2と同様の検索機能実装
  - モック検索結果をAPI呼び出しに置き換え
  - （Issue #2のコンポーネント化・共通化を検討）
- **成果物**: ホームページから新規目的地追加が可能
- **依存**: Issue #2完了後（コード再利用）
- **優先度**: 🟢 中

---

#### Phase 3: 訪問履歴とチェックイン機能

**Issue #5: 訪問履歴データモデルを設計・実装する**
- **対象**: `app/lib/types.ts`, `app/lib/store.ts`
- **内容**:
  - Visit型の定義
  - visitHistoryAtom の追加
  - sessionStorageへの保存対応
- **成果物**: 訪問履歴データ構造の確立
- **依存**: Issue #1完了後
- **優先度**: ⚪ Phase 3

---

**Issue #6: 目的地詳細モーダルにチェックイン機能を追加する**
- **対象**: `app/components/DestinationDetailModal.tsx`
- **内容**:
  - チェックインボタン追加
  - 現在地と目的地の距離計算
  - 訪問記録の保存
  - 訪問履歴表示UI
- **成果物**: チェックイン機能の実装
- **依存**: Issue #5完了後
- **優先度**: ⚪ Phase 3

---

**Issue #7: TaskHistoryコンポーネントを実装する**
- **対象**: `app/components/TaskHistory.tsx`
- **内容**:
  - 訪問履歴の一覧表示
  - カレンダービュー
  - 達成率の計算・表示
- **成果物**: 習慣化の進捗可視化
- **依存**: Issue #5, #6完了後
- **優先度**: ⚪ Phase 3

---

#### Phase 4: PWAプッシュ通知

**Issue #8: 指定時刻にプッシュ通知を送信する機能を実装する**
- **対象**: Service Worker, `app/lib/notification.ts` (新規), `public/sw.js` (新規), `next.config.ts`
- **内容**:
  - Service Worker登録
  - PWA Manifest作成
  - 通知権限リクエストUI
  - Notification API実装
  - スケジューリングロジック（frequencyベース）
  - 通知クリック時の挙動
- **成果物**: PWA基盤構築 + 習慣化リマインダー通知
- **依存**: なし
- **優先度**: ⚪ Phase 4

---

### Issue実装順序（推奨）

```
[Phase 1 - MVP必須]
1. Issue #1 (Jotai導入・全体リファクタリング) ← @yotu担当、最優先
2. Issue #2 (セットアップ場所検索) ← 並行作業可
3. Issue #3 (地図表示)

[Phase 2 - 機能拡充]
4. Issue #4 (追加ダイアログ場所検索)

[Phase 3 - 訪問履歴]
5. Issue #5 (データモデル)
6. Issue #6 (チェックイン機能)
7. Issue #7 (履歴表示)

[Phase 4 - 通知]
8. Issue #8 (PWAプッシュ通知)
```

---

### GitHub Issue作成対象

**作成するIssue**: 8個
- ✅ Phase 1: Issue #1, #2, #3
- ✅ Phase 2: Issue #4
- ✅ Phase 3: Issue #5, #6, #7
- ✅ Phase 4: Issue #8

---

## ホームページの実装要件調査

### 1. ページ構成と機能

#### 1.1 メインページ (`app/home/page.tsx`)

**現在の状態管理** (L20-42):
- sessionStorage直接操作（setup/page.tsxと同様）
- useState でローカル状態管理
- useEffect でセットアップページへのリダイレクト

**主要機能**:
1. **ニックネーム編集** (L78-102, L217-261)
   - ダイアログで編集
   - バリデーション: 必須、最大20文字
   - 実装済み、Jotai移行のみ必要

2. **目的地管理** (L44-79)
   - 追加 (addDestination)
   - 更新 (updateDestination)
   - 削除 (deleteDestination)
   - すべてsessionStorage直接操作 → Jotai移行必要

3. **表示モード切り替え** (L33, L147-183)
   - リストビュー (`DestinationCard` グリッド表示)
   - マップビュー (`MapView` コンポーネント)
   - Tabsコンポーネント使用

4. **FAB (Floating Action Button)** (L185-195)
   - 目的地追加ダイアログ表示
   - 固定位置配置

---

### 2. コンポーネント分析

#### 2.1 DestinationCard (`app/components/DestinationCard.tsx`)

**機能**:
- 目的地のカード表示
- クリックで詳細モーダル表示
- 頻度情報の表示（曜日・時刻）

**実装状態**: ✅ 完成（モック不使用）
**追加実装**: なし

---

#### 2.2 DestinationDetailModal (`app/components/DestinationDetailModal.tsx`)

**機能**:
1. **目的地情報表示** (L105-119)
   - 名前、住所、マップアイコン表示

2. **地図プレビュー** (L121-144)
   - 現状: グレー背景のプレースホルダー
   - Google Mapsリンクボタン（外部遷移）
   - **要実装**: Google Maps埋め込み表示

3. **頻度表示・編集** (L147-211)
   - 閲覧モード: 曜日・時刻表示
   - 編集モード: 曜日選択ボタン、時刻入力
   - 実装済み

4. **削除機能** (L92-100, L213-255)
   - AlertDialog での確認
   - 実装済み

**要実装項目**:
- [ ] 地図プレビューにGoogle Maps埋め込み (L121-144)
- [ ] チェックイン機能追加 (Issue #6で対応)
- [ ] 訪問履歴表示 (Issue #6で対応)

---

#### 2.3 AddDestinationDialog (`app/components/AddDestinationDialog.tsx`)

**機能**:
1. **2ステップフロー**
   - Step 1: 場所検索 (L88-139)
   - Step 2: 頻度設定 (L141-217)

2. **場所検索** (L29-34, L92-134)
   - **現状**: モック検索結果使用
   - **要実装**: Google Maps Places API統合 (Issue #4で対応)

3. **頻度設定** (L141-217)
   - 曜日選択
   - 時刻選択
   - 実装済み

**要実装項目**:
- [ ] Google Maps Places API検索 (Issue #4で対応)

---

#### 2.4 MapView (`app/components/MapView.tsx`)

**既存調査結果**: Issue #3で対応予定
- モック地図表示 → Google Maps実装

---

#### 2.5 LocationTaskCard (`app/components/LocationTaskCard.tsx`)

**注意**: このコンポーネントは古い実装の可能性あり

**機能**:
- チェックイン機能のプロトタイプ
- 距離計算 (L26-42)
- 完了状態の管理

**判断**:
- 現在のホームページでは**未使用**
- `Location` 型を使用（`Destination` 型とは別）
- Issue #6のチェックイン実装時に参考にできる可能性

**対応**:
- このコンポーネントは削除 or リファクタリング検討
- ロジックは `DestinationDetailModal` に統合すべき

---

#### 2.6 AddLocationDialog (`app/components/AddLocationDialog.tsx`)

**注意**: このコンポーネントも古い実装の可能性あり

**機能**:
- 手動で緯度経度入力
- 現在位置の使用
- 範囲（radius）設定

**判断**:
- 現在のホームページでは**未使用**
- `AddDestinationDialog` が現在の実装
- セットアップページも `DestinationStep` を使用

**対応**:
- このコンポーネントは削除検討
- 必要な機能は既存コンポーネントに統合済み

---

### 3. ホームページ固有の追加Issue候補

#### Issue #9: DestinationDetailModalに地図プレビューを実装する

**対象**: `app/components/DestinationDetailModal.tsx` (L121-144)

**実装内容**:
- [ ] Google Maps埋め込み表示
- [ ] 目的地のマーカー表示
- [ ] 現在地マーカー表示（オプション）
- [ ] ズームレベルの調整

**依存**:
- Issue #3完了後（MapView実装のコード再利用）

**優先度**: 🟡 中（Phase 2）

**注意**:
- Issue #3のMapView実装と重複する可能性
- MapView実装時に共通コンポーネント化を検討

---

#### Issue #10: 未使用コンポーネントを整理する

**対象**:
- `app/components/LocationTaskCard.tsx`
- `app/components/AddLocationDialog.tsx`

**実装内容**:
- [ ] 使用状況の最終確認
- [ ] 未使用であれば削除
- [ ] 必要なロジックがあれば既存コンポーネントに統合

**依存**: なし

**優先度**: 🟢 低（コード整理）

---

### 4. ホームページのJotai移行詳細

**対象ファイル**: `app/home/page.tsx`

**移行箇所**:

1. **userDataの状態管理** (L20-27)
   ```tsx
   // Before
   const [userData, setUserData] = useState<UserData | null>(() => {
     if (typeof window !== 'undefined') {
       const data = sessionStorage.getItem('userData');
       return data ? JSON.parse(data) : null;
     }
     return null;
   });

   // After
   const [userData, setUserData] = useAtom(userDataAtom);
   ```

2. **saveUserData関数** (L43-46)
   ```tsx
   // Before
   const saveUserData = (data: UserData) => {
     sessionStorage.setItem('userData', JSON.stringify(data));
     setUserData(data);
   };

   // After
   const saveUserData = (data: UserData) => {
     setUserData(data); // atomWithStorageが自動的にsessionStorageに保存
   };
   ```

3. **addDestination** (L48-59)
   - `saveUserData` を使用 → 自動的にJotai対応

4. **updateDestination** (L61-69)
   - `saveUserData` を使用 → 自動的にJotai対応

5. **deleteDestination** (L71-79)
   - `saveUserData` を使用 → 自動的にJotai対応

6. **handleNicknameChange** (L81-93)
   - `saveUserData` を使用 → 自動的にJotai対応

**移行の容易さ**: ⭐⭐⭐⭐⭐ (非常に簡単)
- saveUserData関数を修正するだけで全体が対応完了

---

### 5. ホームページまとめ

**実装済み機能**:
- ✅ ニックネーム編集
- ✅ 目的地CRUD操作
- ✅ リスト/マップ切り替え
- ✅ 頻度編集
- ✅ 削除確認ダイアログ

**要実装項目（既存Issueで対応）**:
- Issue #1: Jotai移行
- Issue #3: MapView実装
- Issue #4: AddDestinationDialog検索実装
- Issue #6: チェックイン機能
- Issue #7: TaskHistory実装

**新規Issue候補**:
- Issue #9: DestinationDetailModalの地図プレビュー実装（Phase 2）
- Issue #10: 未使用コンポーネント整理（Phase 3）

**削除候補コンポーネント**:
- `LocationTaskCard.tsx` - 未使用、古い実装
- `AddLocationDialog.tsx` - 未使用、古い実装

**技術的負債**:
- なし（セットアップページと同様の構造でクリーン）

---

✅ **ページ単位で分離**:
- セットアップページ (Issue #2)
- ホームページ (Issue #3)

✅ **コンポーネント単位で分離**:
- DestinationStep (Issue #4)
- MapView (Issue #5)
- AddDestinationDialog (Issue #6)
- DestinationDetailModal (Issue #8)
- TaskHistory (Issue #9)

✅ **機能の重複は「後で共通化」として一時実装**:
- Issue #4で実装した検索機能 → Issue #6で再利用・共通化検討
- 距離計算ロジック → 必要に応じてユーティリティ化

✅ **インフラ系は別Issue**:
- Jotai導入 (Issue #1)
- Service Worker (Issue #10)
