window.LifeEarData = (() => {
  const STORAGE = {
    profile: "lifeear_profile",
    logs: "lifeear_logs",
    posts: "lifeear_posts"
  };

  const ARCHETYPES = {
    founder: {
      title: "前へ進む起業家の暮らし",
      shortTitle: "起業家みたいに前へ進む暮らし",
      badge: "起業家",
      intro: "大事なことを先に進めるための暮らしです。",
      week: [
        "朝の最優先を毎日ひとつ決める",
        "連絡や返信はまとめて返す時間を作る",
        "夜に明日の入口だけを残して終える"
      ],
      month: {
        gentle: "1か月で、やることの優先順位が少しずつぶれにくくなります。",
        balanced: "1か月で、仕事を前に進める自分の型が見え始めます。",
        intense: "1か月で、進捗が見える日が増えて手応えが出やすくなります。"
      },
      year: "1年で、進める日の作り方が習慣になり、仕事の主導権を持ちやすくなります。",
      estimate: {
        gentle: "土台づくりは6〜12か月が目安です。",
        balanced: "暮らしの型が固まるまで3〜6か月が目安です。",
        intense: "立ち上がりの変化は2〜4か月で感じやすいです。"
      }
    },
    fitness: {
      title: "体を整える人の暮らし",
      shortTitle: "体を整えて軽く暮らす",
      badge: "体",
      intro: "睡眠、食事、運動のリズムを整えるための暮らしです。",
      week: [
        "朝に体を起こす時間を5分でも作る",
        "日中は座りっぱなしを避ける",
        "夜は回復を優先して眠りやすい流れを作る"
      ],
      month: {
        gentle: "1か月で、朝の重さを引きずりにくい日が増えていきます。",
        balanced: "1か月で、無理のない範囲で体を整えるリズムが見えてきます。",
        intense: "1か月で、生活の乱れに気づいて戻せる感覚が育ちます。"
      },
      year: "1年で、体調に振り回されにくい暮らし方が少しずつ定着していきます。",
      estimate: {
        gentle: "回復の土台づくりは3〜6か月が目安です。",
        balanced: "安定したリズムが見えるまで2〜4か月が目安です。",
        intense: "立て直しの手応えは1〜3か月で感じやすいです。"
      }
    },
    calm: {
      title: "心が整った人の暮らし",
      shortTitle: "心が整った人みたいに穏やかに暮らす",
      badge: "心",
      intro: "焦りを減らし、余白のある一日に戻していく暮らしです。",
      week: [
        "予定のあいだに余白を入れる",
        "気持ちが乱れたら立て直す合図を決める",
        "夜は情報を減らして静かに終える"
      ],
      month: {
        gentle: "1か月で、気持ちが揺れても戻れる感覚が少しずつ育ちます。",
        balanced: "1か月で、穏やかに過ごせる日の割合が増えていきます。",
        intense: "1か月で、無理な予定を減らす判断がしやすくなります。"
      },
      year: "1年で、自分の心を守りながら暮らしを回すスタイルが定着していきます。",
      estimate: {
        gentle: "落ち着く土台づくりは3〜6か月が目安です。",
        balanced: "心の波が整ってくるまで2〜4か月が目安です。",
        intense: "暮らしのノイズを減らす変化は1〜3か月で出やすいです。"
      }
    },
    creator: {
      title: "没頭できるクリエイターの暮らし",
      shortTitle: "クリエイターみたいに没頭する暮らし",
      badge: "創作",
      intro: "考えるだけで終わらせず、手を動かす時間を生む暮らしです。",
      week: [
        "朝に短くても手を動かす時間を作る",
        "素材集めと制作時間を分ける",
        "夜に次に作るものをひとつ決める"
      ],
      month: {
        gentle: "1か月で、つくることへの心理的ハードルが下がっていきます。",
        balanced: "1か月で、少しずつ作品やアウトプットの形が見えてきます。",
        intense: "1か月で、没頭する時間帯と作業の型が見えやすくなります。"
      },
      year: "1年で、つくる人としての生活リズムが暮らしに自然に組み込まれていきます。",
      estimate: {
        gentle: "創作の土台づくりは4〜8か月が目安です。",
        balanced: "アウトプットの習慣化は3〜6か月が目安です。",
        intense: "手が動く日を増やす変化は2〜4か月で感じやすいです。"
      }
    },
    money: {
      title: "お金に強い人の暮らし",
      shortTitle: "お金に強い人みたいに暮らす",
      badge: "お金",
      intro: "使い方、残し方、学び方を整えるための暮らしです。",
      week: [
        "朝に今日使ってよい範囲を決める",
        "買う前に一度立ち止まる習慣を入れる",
        "夜にその日のお金の流れを軽く見る"
      ],
      month: {
        gentle: "1か月で、お金を使うときの迷い方が少しずつ変わってきます。",
        balanced: "1か月で、残すお金と使うお金の感覚が見えてきます。",
        intense: "1か月で、なんとなくの出費を減らせる日が増えていきます。"
      },
      year: "1年で、お金の流れを自分で整える感覚が生活に根づいていきます。",
      estimate: {
        gentle: "整える感覚が出るまで3〜6か月が目安です。",
        balanced: "支出の型が安定するまで2〜4か月が目安です。",
        intense: "変化の実感は1〜3か月で出やすいです。"
      }
    }
  };

  const QUIZ_STEPS = [
    {
      id: "ideal",
      title: "どんな人みたいに暮らしたいですか？",
      hint: "いちばん近いものをひとつ選んでください。",
      options: [
        { id: "founder", label: "起業家みたいに前へ進む", hint: "決めて進む一日にしたい" },
        { id: "fitness", label: "体を整えて軽く暮らす", hint: "だるさを減らして動きたい" },
        { id: "calm", label: "心が整った人みたいに暮らす", hint: "焦りを減らして穏やかに過ごしたい" },
        { id: "creator", label: "クリエイターみたいに没頭する", hint: "考えるだけでなく手を動かしたい" },
        { id: "money", label: "お金に強い人みたいに暮らす", hint: "使い方と残し方を整えたい" }
      ]
    },
    {
      id: "focus",
      title: "今いちばん整えたいのはどこですか？",
      hint: "この先しばらくで変えたいテーマを選んでください。",
      options: [
        { id: "work", label: "仕事", hint: "仕事の進み方を変えたい" },
        { id: "body", label: "体", hint: "体調や体力を整えたい" },
        { id: "heart", label: "心", hint: "気持ちの波を穏やかにしたい" },
        { id: "money", label: "お金", hint: "使い方や残し方を変えたい" },
        { id: "relationships", label: "人間関係", hint: "人との関わり方を整えたい" }
      ]
    },
    {
      id: "reality",
      title: "今の自分にいちばん近いのはどれですか？",
      hint: "今日の作り方を決めるための質問です。",
      options: [
        { id: "time", label: "時間が足りない", hint: "予定が詰まりやすい" },
        { id: "schedule", label: "予定が読みにくい", hint: "突発が入りやすい" },
        { id: "energy", label: "体力に波がある", hint: "動ける日と動けない日の差が大きい" },
        { id: "flex", label: "比較的自由に動ける", hint: "時間の使い方を自分で決めやすい" }
      ]
    },
    {
      id: "pace",
      title: "今回はどのくらいのペースで変えたいですか？",
      hint: "無理せずでも、しっかりでも選べます。",
      options: [
        { id: "gentle", label: "無理せずゆっくり", hint: "続けられる形を最優先にしたい" },
        { id: "balanced", label: "ほどよく着実に", hint: "無理なく前進したい" },
        { id: "intense", label: "しっかり変えたい", hint: "手応えを強めに感じたい" }
      ]
    }
  ];

  const CALENDAR_SLOTS = {
    founder: [
      { label: "朝", time: "08:30", minutes: 90 },
      { label: "日中", time: "13:30", minutes: 60 },
      { label: "夜", time: "21:00", minutes: 30 }
    ],
    fitness: [
      { label: "朝", time: "07:00", minutes: 30 },
      { label: "日中", time: "12:00", minutes: 45 },
      { label: "夜", time: "20:30", minutes: 30 }
    ],
    calm: [
      { label: "朝", time: "07:30", minutes: 20 },
      { label: "日中", time: "13:00", minutes: 20 },
      { label: "夜", time: "21:30", minutes: 30 }
    ],
    creator: [
      { label: "朝", time: "09:00", minutes: 60 },
      { label: "日中", time: "14:00", minutes: 90 },
      { label: "夜", time: "21:00", minutes: 30 }
    ],
    money: [
      { label: "朝", time: "07:00", minutes: 20 },
      { label: "日中", time: "12:30", minutes: 20 },
      { label: "夜", time: "21:00", minutes: 30 }
    ]
  };

  const FOCUS_TEXT = {
    work: "仕事の進み方",
    body: "体の整い方",
    heart: "心の落ち着き",
    money: "お金の流れ",
    relationships: "人との関わり方"
  };

  const REALITY_TEXT = {
    time: "時間が足りない",
    schedule: "予定が読みにくい",
    energy: "体力に波がある",
    flex: "比較的自由に動ける"
  };

  const PACE_TEXT = {
    gentle: "無理せずゆっくり",
    balanced: "ほどよく着実に",
    intense: "しっかり変えていく"
  };

  const PILLARS = {
    sleep: {
      label: "睡眠",
      time: "22:30"
    },
    food: {
      label: "食事",
      time: "12:30"
    },
    exercise: {
      label: "運動",
      time: "07:00"
    },
    learning: {
      label: "学び",
      time: "20:00"
    },
    self: {
      label: "自己理解",
      time: "21:00"
    }
  };

  const CARE_TIME_OPTIONS = [
    { id: "45", label: "45分くらい", minutes: 45 },
    { id: "90", label: "90分くらい", minutes: 90 },
    { id: "150", label: "2時間半くらい", minutes: 150 },
    { id: "210", label: "3時間半くらい", minutes: 210 }
  ];

  const ARCHETYPE_PILLAR_WEIGHTS = {
    founder: { sleep: 24, food: 14, exercise: 14, learning: 30, self: 18 },
    fitness: { sleep: 28, food: 22, exercise: 28, learning: 10, self: 12 },
    calm: { sleep: 26, food: 14, exercise: 12, learning: 10, self: 30 },
    creator: { sleep: 18, food: 12, exercise: 12, learning: 32, self: 26 },
    money: { sleep: 20, food: 12, exercise: 10, learning: 34, self: 24 }
  };

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function deriveProfile(answers) {
    const score = { founder: 0, fitness: 0, calm: 0, creator: 0, money: 0 };
    if (answers.ideal) score[answers.ideal] += 4;

    if (answers.focus === "work") {
      score.founder += 3;
      score.creator += 1;
    }
    if (answers.focus === "body") score.fitness += 4;
    if (answers.focus === "heart") score.calm += 4;
    if (answers.focus === "money") score.money += 4;
    if (answers.focus === "relationships") {
      score.calm += 3;
      score.creator += 1;
    }

    if (answers.reality === "time") {
      score.founder += 1;
      score.money += 1;
    }
    if (answers.reality === "schedule") score.calm += 2;
    if (answers.reality === "energy") {
      score.fitness += 2;
      score.calm += 1;
    }
    if (answers.reality === "flex") {
      score.creator += 2;
      score.founder += 1;
    }

    if (answers.pace === "gentle") {
      score.calm += 2;
      score.fitness += 1;
    }
    if (answers.pace === "balanced") {
      score.founder += 1;
      score.calm += 1;
      score.money += 1;
    }
    if (answers.pace === "intense") {
      score.founder += 2;
      score.creator += 1;
    }

    const selectedModel = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
    const archetype = ARCHETYPES[selectedModel];
    const focusText = FOCUS_TEXT[answers.focus] || "暮らし";
    const realityText = REALITY_TEXT[answers.reality] || "今の現実";
    const paceText = PACE_TEXT[answers.pace] || "ほどよく";

    return {
      selectedModel,
      title: archetype.title,
      shortTitle: archetype.shortTitle,
      badge: archetype.badge,
      answers: { ...answers },
      summary:
        `あなたには「${archetype.title}」が合いそうです。` +
        `${focusText}を整えたい気持ちが強く、${realityText}前提でも続けやすいように、` +
        `${paceText}ペースで進める暮らしをおすすめします。`,
      reasons: [
        `憧れの方向は「${archetype.shortTitle}」に近いです。`,
        `いま一番変えたいテーマは「${focusText}」です。`,
        `現実の条件は「${realityText}」なので、無理なく回せる形に寄せます。`
      ],
      route: {
        today: `今日はまず、${archetype.intro}`,
        week: archetype.week,
        month: archetype.month[answers.pace] || archetype.month.balanced,
        year: archetype.year,
        estimate: archetype.estimate[answers.pace] || archetype.estimate.balanced
      }
    };
  }

  function normalizeProfile(profile) {
    if (!profile) return null;
    if (profile.answers && profile.title && profile.route) return profile;

    const legacyModelMap = { work: "founder", fitness: "fitness", money: "money" };
    const selectedModel = legacyModelMap[profile.selectedModel] || profile.selectedModel || "founder";
    const fallbackAnswers = {
      ideal: selectedModel,
      focus:
        selectedModel === "fitness" ? "body" :
        selectedModel === "money" ? "money" :
        selectedModel === "calm" ? "heart" :
        selectedModel === "creator" ? "work" :
        "work",
      reality: "schedule",
      pace: "balanced"
    };

    return {
      id: profile.id || `profile-${Date.now()}`,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDailyState: profile.lastDailyState || { sleep: 7, energy: "medium", careTime: 90 },
      ...deriveProfile(fallbackAnswers)
    };
  }

  return {
    STORAGE,
    ARCHETYPES,
    QUIZ_STEPS,
    CALENDAR_SLOTS,
    FOCUS_TEXT,
    REALITY_TEXT,
    PACE_TEXT,
    PILLARS,
    CARE_TIME_OPTIONS,
    ARCHETYPE_PILLAR_WEIGHTS,
    readJson,
    deriveProfile,
    normalizeProfile
  };
})();
