# Issue #1: Jotaiを導入して全体の状態管理をリファクタリングする

**担当**: @yotu  
**優先度**: 🔴 最高  
**ブランチ**: `feat/jotai`  
**Issue**: https://github.com/2025-graduation-work/main/issues/1

---

## 実装タスク

### Phase 1: Jotai環境構築

#### 1.1 パッケージインストール
- [x] `jotai` パッケージのインストール
  ```bash
  cd front
  npm install jotai --legacy-peer-deps
  ```
- [x] インストール確認: `package.json` に `jotai` が追加されていることを確認

---

#### 1.2 store.ts 作成
- [x] `front/app/lib/store.ts` ファイルを新規作成
- [x] `userDataAtom` の実装
  - `atomWithStorage` を使用
  - sessionStorage連携の設定
  - 型定義は既存の `UserData | null`

**実装内容**:
```typescript
// front/app/lib/store.ts
import { atomWithStorage } from 'jotai/utils';
import { UserData } from './types';

export const userDataAtom = atomWithStorage<UserData | null>(
  'userData',
  null,
  {
    getItem: (key) => {
      if (typeof window === 'undefined') return null;
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
    },
  }
);
```

**注意点**:
- SSR対応: `typeof window === 'undefined'` チェックを追加
- 既存の型定義 (`UserData`) をそのまま使用

---

#### 1.3 Provider設定（不要の可能性あり）
- [ ] Jotai v2では基本的にProviderは不要
- [ ] `app/layout.tsx` の確認のみ行う
- [ ] 必要に応じて Provider 追加（通常は不要）

**確認内容**:
- Jotai v2以降はデフォルトでグローバルストアを使用
- 特別な設定が必要な場合のみ Provider を追加

---

### Phase 2: セットアップページのJotai対応

**対象ファイル**: `front/app/setup/page.tsx`

#### 2.1 import追加
- [x] `useAtom` のインポート
- [x] `userDataAtom` のインポート

```typescript
import { useAtom } from 'jotai';
import { userDataAtom } from '@/app/lib/store';
```

---

#### 2.2 状態管理の置き換え
- [x] L18-27: `useState` を削除
- [x] `useAtom(userDataAtom)` に置き換え

**Before** (L18-27):
```typescript
const [userData, setUserData] = useState<UserData | null>(() => {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }
  return null;
});
```

**After**:
```typescript
const [userData, setUserData] = useAtom(userDataAtom);
```

---

#### 2.3 sessionStorage直接操作の削除
- [x] L63-70: `handleNext` 内のsessionStorage操作を削除
- [x] `setUserData` のみ使用（atomWithStorageが自動保存）

**Before** (L63-70):
```typescript
const userData: UserData = {
  nickname,
  destinations: firstDestination ? [{
    ...firstDestination,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }] : [],
};
sessionStorage.setItem('userData', JSON.stringify(userData));
router.push('/home');
```

**After**:
```typescript
setUserData({
  nickname,
  destinations: firstDestination ? [{
    ...firstDestination,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }] : [],
});
router.push('/home');
```

---

#### 2.4 動作確認
- [x] セットアップページの動作確認
- [x] データが正しく保存されるか確認
- [x] ページリロード後もデータが保持されるか確認

---

### Phase 3: ホームページのJotai対応

**対象ファイル**: `front/app/home/page.tsx`

#### 3.1 import追加
- [x] `useAtom` のインポート
- [x] `userDataAtom` のインポート

```typescript
import { useAtom } from 'jotai';
import { userDataAtom } from '@/app/lib/store';
```

---

#### 3.2 状態管理の置き換え
- [x] L20-27: `useState` を削除
- [x] `useAtom(userDataAtom)` に置き換え

**Before** (L20-27):
```typescript
const [userData, setUserData] = useState<UserData | null>(() => {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }
  return null;
});
```

**After**:
```typescript
const [userData, setUserData] = useAtom(userDataAtom);
```

---

#### 3.3 saveUserData関数の簡素化
- [x] L43-46: `saveUserData` 関数を削除
- [x] sessionStorage操作を削除
- [x] すべての `saveUserData(...)` を `setUserData(...)` に置き換え

**Before** (L43-46):
```typescript
const saveUserData = (data: UserData) => {
  sessionStorage.setItem('userData', JSON.stringify(data));
  setUserData(data);
};
```

**After**:
削除して直接 `setUserData` を使用

---

#### 3.4 CRUD操作の動作確認
- [x] `addDestination` (L48-59)
- [x] `updateDestination` (L61-69)
- [x] `deleteDestination` (L71-79)
- [x] `handleNicknameChange` (L81-93)

---

#### 3.5 動作確認
- [x] ホームページの動作確認
- [x] 目的地追加が正しく動作するか
- [x] 目的地更新が正しく動作するか
- [x] 目的地削除が正しく動作するか
- [x] ニックネーム変更が正しく動作するか
- [x] ページリロード後もデータが保持されるか

---

### Phase 4: 最終確認とクリーンアップ

#### 4.1 sessionStorage直接操作の完全削除確認
- [x] `grep -r "sessionStorage" front/app/` で検索
- [x] 残っている直接操作がないか確認
- [x] store.ts 内の操作のみであることを確認

---

#### 4.2 型安全性の確認
- [x] TypeScriptエラーがないか確認
- [x] 開発サーバー起動成功を確認

---

#### 4.3 E2Eテスト
- [ ] セットアップフロー全体の動作確認
  1. `/` アクセス → `/setup` リダイレクト
  2. ニックネーム入力
  3. 目的地選択（モック）
  4. 頻度設定
  5. 完了 → `/home` 遷移
- [ ] ホームページの動作確認
  1. 目的地一覧表示
  2. 目的地追加
  3. 目的地編集
  4. 目的地削除
  5. ニックネーム変更
- [ ] ページリロードでデータが保持されるか
- [ ] ブラウザのDevToolsでsessionStorageを確認

---

#### 4.4 コードレビュー準備
- [ ] 不要なコードの削除
- [ ] コメントの整理
- [ ] コミットメッセージの確認

---

## 実装の注意点

### SSR対応
- `atomWithStorage` 内で `typeof window === 'undefined'` チェックを行う
- Next.js 16の App Router対応

### 既存機能の維持
- すべての既存機能が正常に動作すること
- UI/UXに変更がないこと
- データの保存形式に変更がないこと（互換性維持）

### パフォーマンス
- Jotaiは軽量なので、パフォーマンス低下はないはず
- 念のため、大量の目的地追加時の動作を確認

---

## チェックリスト

### 環境構築
- [x] Jotaiインストール完了
- [x] `store.ts` 作成完了
- [x] Provider設定確認完了（不要の場合はスキップ）

### セットアップページ
- [x] useState → useAtom 置き換え完了
- [x] sessionStorage直接操作削除完了
- [x] 動作確認完了

### ホームページ
- [x] useState → useAtom 置き換え完了
- [x] saveUserData関数簡素化完了
- [x] CRUD操作動作確認完了

### 最終確認
- [x] sessionStorage直接操作完全削除確認完了
- [x] 型安全性確認完了
- [ ] E2Eテスト完了
- [ ] コードレビュー準備完了

---

## 成果物

- ✅ `front/app/lib/store.ts` 新規作成
- ✅ `front/app/setup/page.tsx` Jotai対応
- ✅ `front/app/home/page.tsx` Jotai対応
- ✅ sessionStorage直接操作の完全削除
- ✅ すべての既存機能が正常に動作
- ✅ 開発サーバー起動確認 (http://localhost:3000)

---

## 完了条件

1. すべてのチェックリストが完了していること
2. `npm run build` が成功すること
3. セットアップフローが正常に動作すること
4. ホームページのCRUD操作が正常に動作すること
5. ページリロード後もデータが保持されること
6. TypeScriptエラーがないこと
7. sessionStorageへの直接操作が store.ts のみであること
