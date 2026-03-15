window.LifeEarHistory = {
  appUrl: "./index.html",
  repoUrl: "https://github.com/Ryoseiimai/lifeear-pages",
  publicUrl: "https://ryoseiimai.github.io/lifeear-pages/",
  updatedAt: "2026-03-15 13:25",
  coreHypothesis:
    "理想の暮らしを、利用者の状況に合わせて今日の1日の行動と5要素の時間配分に落とすAI",
  items: [
    {
      updatedAt: "2026-03-15 13:15",
      version: "732636c",
      category: "プロダクト仮説 / 体験",
      change:
        "理想の暮らし判定後に、食事・睡眠・運動・学び・自己理解の5要素へ時間配分する体験を追加",
      why:
        "人は何でできていて、どう時間を使うかまでLifeEarに反映したかったため",
      result:
        "今日は何に何分使うかが見えるようになり、ステップアップの意味が具体化した",
      files: "index.html / lifeear-app.js / lifeear-data.js",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "配分ロジックが体感に合うか、質問数が多すぎないかを検証"
    },
    {
      updatedAt: "2026-03-15 12:51",
      version: "6e9e749",
      category: "カレンダー連携",
      change:
        "GoogleカレンダーとiPhone / Appleカレンダーを分けて追加導線を実装",
      why:
        "カレンダー追加が機能していない・分かりづらいという指摘があったため",
      result:
        "Googleは作成画面を直接開き、Appleは.ics経由で追加できる形になった",
      files: "index.html / lifeear-app.js",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "iPhone実機での追加体験が自然か確認"
    },
    {
      updatedAt: "2026-03-15 12:45",
      version: "fef6c53",
      category: "UI / 導線整理",
      change:
        "結果画面を簡素化し、他の暮らし一覧リンクを小さく配置。主ボタンを「この暮らしで進める」に集約",
      why:
        "一画面に機能が多く、何を押せばよいか分かりづらかったため",
      result:
        "結果画面の判断が一つになり、迷わず次に進める形になった",
      files: "index.html / lifeear-app.js",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "「他の暮らし一覧」の必要性とサイズ感を再確認"
    },
    {
      updatedAt: "2026-03-15 12:35",
      version: "edbce58",
      category: "UI / 画面構成",
      change:
        "結果画面をおすすめ・想定ルート・暮らし一覧に分割し、タップ遷移中心に再構成",
      why:
        "スマホで縦に長すぎて、スクロール前提のブラウザっぽい体験になっていたため",
      result: "一画面一目的に近づき、スマホアプリらしい流れが出た",
      files: "index.html / lifeear-app.js / lifeear-data.js",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "想定ルート画面自体が必要かどうかを再判断"
    },
    {
      updatedAt: "2026-03-15 12:21",
      version: "ddf09db",
      category: "要件 / 初回体験",
      change:
        "4問の質問フロー、理想の暮らし判定、前回入力の引き継ぎを追加",
      why:
        "理想の暮らしを今日に落とすために、ユーザーの方向性を少ない質問で見極めたかったため",
      result:
        "毎回ゼロから入力しなくても、前回情報を踏まえて今日の提案を作れるようになった",
      files: "index.html / lifeear-app.js / lifeear-data.js",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "質問文の違和感と設問数の最適化"
    },
    {
      updatedAt: "2026-03-15 11:16",
      version: "f89fa77",
      category: "UIフィードバック",
      change:
        "「今日の過ごし方を作りました」通知を画面上部のポップアップ風に変更",
      why:
        "下部通知だと気づきづらく、作られた感じが弱かったため",
      result:
        "選択後の反応が視認しやすくなり、押した結果が伝わりやすくなった",
      files: "index.html",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "通知文言と表示秒数が適切か確認"
    },
    {
      updatedAt: "2026-03-15 10:29",
      version: "88a94cc",
      category: "公開基盤",
      change:
        "GitHub Pages を branch-based (main / root) 運用へ切り替え",
      why:
        "workflow型の公開よりもシンプルで安定した公開手段にしたかったため",
      result:
        "公開更新の手順が単純になり、push後の反映確認がしやすくなった",
      files: ".github/workflows/deploy-pages.yml",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "公開後のキャッシュ反映速度を観察"
    },
    {
      updatedAt: "2026-03-15 10:28",
      version: "8573b3f",
      category: "公開基盤",
      change: "Pages workflow の有効化設定を追加",
      why:
        "GitHub Pages が有効にならず、公開がうまく走らなかったため",
      result:
        "Pages 公開に必要な設定が入り、次の公開改善へ進める状態になった",
      files: ".github/workflows/deploy-pages.yml",
      link: "https://github.com/Ryoseiimai/lifeear-pages",
      status: "完了",
      next: "公開方式を branch-based に寄せるか判断"
    },
    {
      updatedAt: "2026-03-15 10:27",
      version: "76c8c16",
      category: "公開基盤",
      change: "GitHub Pages workflow を追加",
      why:
        "PCだけでなくスマホからも押せるURLで確認できるようにしたかったため",
      result:
        "公開自動化の土台ができ、外部に見せる前提の構成になった",
      files: ".github/workflows/deploy-pages.yml",
      link: "https://github.com/Ryoseiimai/lifeear-pages",
      status: "完了",
      next: "Pages設定が実際に動くか検証"
    },
    {
      updatedAt: "2026-03-15 10:10",
      version: "5ba8c06",
      category: "初期モック",
      change: "LifeEar の公開モックを GitHub Pages 用に初期作成",
      why:
        "まず触れるものを持ち、スマホでも見られる形で議論したかったため",
      result:
        "公開可能な最初のたたき台ができ、以後のUI/UX壁打ちの土台になった",
      files: ".nojekyll / README.md / index.html",
      link: "https://ryoseiimai.github.io/lifeear-pages/",
      status: "完了",
      next: "体験の芯を「理想の暮らしを今日に落とす」に絞る"
    },
    {
      updatedAt: "2026-03-15 13:25",
      version: "検討メモ",
      category: "思想整理",
      change:
        "人間を作る要素（身体・感情・認知・習慣・環境・関係性・お金・アイデンティティ）を整理し始めた",
      why:
        "LifeEar が単なる予定アプリではなく、人の変化を扱うプロダクトとして成立するかを検討するため",
      result:
        "次の設問や配分ロジックで何を扱うべきかの論点が見え始めた",
      files: "LifeEar_人間要素メモ.md",
      link:
        "C:/Users/admin/Desktop/codex/Teamryu/サービスMVP/LifeEar/作り直し用元ファイル/LifeEar_人間要素メモ.md",
      status: "検討中",
      next: "5要素との関係と、質問にどこまで入れるかを決める"
    }
  ]
};
