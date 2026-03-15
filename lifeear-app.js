(() => {
  const {
    STORAGE,
    ARCHETYPES,
    QUIZ_STEPS,
    CALENDAR_SLOTS,
    readJson,
    normalizeProfile,
    deriveProfile
  } = window.LifeEarData;

  const initialProfile = normalizeProfile(readJson(STORAGE.profile, null));
  const initialDailyState = initialProfile?.lastDailyState || { sleep: 7, energy: "medium" };

  const state = {
    screen: initialProfile ? "home" : "welcome",
    history: [],
    profile: initialProfile,
    logs: readJson(STORAGE.logs, []),
    posts: readJson(STORAGE.posts, []),
    currentPlan: null,
    quiz: {
      step: 0,
      answers: initialProfile?.answers ? { ...initialProfile.answers } : {}
    },
    quizResult: null,
    routeView: "today",
    catalogBackTo: "home",
    input: {
      sleep: initialDailyState.sleep || 7,
      energy: initialDailyState.energy || "medium"
    }
  };

  const root = {
    body: document.getElementById("body"),
    topSub: document.getElementById("topSub"),
    topTitle: document.getElementById("topTitle"),
    backBtn: document.getElementById("backBtn"),
    topAction: document.getElementById("topAction"),
    tabs: document.getElementById("tabs"),
    toast: document.getElementById("toast")
  };

  const $ = id => document.getElementById(id);
  let toastTimer = null;

  function saveState() {
    localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
    localStorage.setItem(STORAGE.logs, JSON.stringify(state.logs));
    localStorage.setItem(STORAGE.posts, JSON.stringify(state.posts));
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  function showToast(text) {
    root.toast.textContent = text;
    root.toast.classList.remove("show");
    void root.toast.offsetWidth;
    root.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => root.toast.classList.remove("show"), 1800);
  }

  function energyLabel(value) {
    if (value === "low") return "あまり動けなさそう";
    if (value === "high") return "けっこう動けそう";
    return "ふつうに動けそう";
  }

  function getCurrentModelKey() {
    return state.profile?.selectedModel || state.quizResult?.selectedModel || "founder";
  }

  function setScreen(next, options = {}) {
    const { reset = false, replace = false } = options;
    if (reset) {
      state.history = [];
    } else if (!replace && state.screen !== next) {
      state.history.push(state.screen);
    }
    state.screen = next;
    render();
    root.body.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz(prefill = true) {
    state.quiz = {
      step: 0,
      answers: prefill && state.profile?.answers ? { ...state.profile.answers } : {}
    };
    state.quizResult = null;
    state.routeView = "today";
    setScreen("choose", { reset: true });
  }

  function goBack() {
    if (state.screen === "choose" && state.quiz.step > 0) {
      state.quiz.step -= 1;
      render();
      return;
    }
    if (state.history.length) {
      state.screen = state.history.pop();
      render();
      root.body.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    state.screen = state.profile ? "home" : "welcome";
    render();
  }

  function hydrateInputFromProfile() {
    if (!state.profile?.lastDailyState) return;
    state.input = {
      sleep: state.profile.lastDailyState.sleep || 7,
      energy: state.profile.lastDailyState.energy || "medium"
    };
    if ($("sleepInput")) $("sleepInput").value = String(state.input.sleep);
    if ($("energyInput")) $("energyInput").value = state.input.energy;
  }

  function createRoadmapHtml(profileLike) {
    if (!profileLike?.route) return "";
    return (
      `<div class="item"><strong>今日</strong><div class="small">${profileLike.route.today}</div></div>` +
      `<div class="item"><strong>今週</strong><div class="small">${profileLike.route.week.join(" / ")}</div></div>` +
      `<div class="item"><strong>1か月</strong><div class="small">${profileLike.route.month}</div></div>` +
      `<div class="item"><strong>1年</strong><div class="small">${profileLike.route.year}</div></div>` +
      `<div class="item"><strong>到達の目安</strong><div class="small">${profileLike.route.estimate}</div></div>`
    );
  }

  function buildPlan(modelKey) {
    const { sleep, energy } = state.input;
    const profile = state.profile;
    const pace = profile?.answers?.pace || "balanced";
    const reality = profile?.answers?.reality || "schedule";
    const archetype = ARCHETYPES[modelKey];

    let morning = "朝の流れを軽く整えてから始めます。";
    let daytime = "日中は無理のないペースで大事なことを進めます。";
    let night = "夜は次の日につながる終わり方を作ります。";

    if (modelKey === "founder") {
      morning = sleep <= 5
        ? "朝は15分だけ整理して、最優先をひとつ決めてから動きます。"
        : "朝の良い時間をひとつ確保して、一番大事な仕事から始めます。";
      daytime = reality === "time"
        ? "日中は予定を詰め込みすぎず、連絡や返信はまとめて返します。"
        : energy === "low"
          ? "仕事は25分ずつ区切って、切り替えしやすい形で進めます。"
          : "日中は集中ブロックを1本つくって、調整仕事は後ろに寄せます。";
      night = pace === "intense"
        ? "夜に明日の準備を少し厚めにして、次の日も前へ進みやすくします。"
        : "夜は明日の入口だけ決めて、考えすぎずに終えます。";
    }

    if (modelKey === "fitness") {
      morning = sleep <= 5
        ? "朝は水分補給と軽いストレッチだけにして、回復を優先します。"
        : "朝に5分から15分だけ体を動かして、体温と気分を上げます。";
      daytime = energy === "low"
        ? "日中は無理をせず、歩く回数を増やして体を固めすぎないようにします。"
        : "日中は座りっぱなしを避けて、こまめに体をほぐします。";
      night = pace === "gentle"
        ? "夜は回復を最優先にして、早めに休める流れを作ります。"
        : "夜は食事と入浴を整えて、明日に疲れを残しにくくします。";
    }

    if (modelKey === "calm") {
      morning = sleep <= 5
        ? "朝は深呼吸と白湯だけにして、急いで始めすぎないようにします。"
        : "朝に静かな時間を少し取って、気持ちを整えてから動きます。";
      daytime = reality === "schedule"
        ? "日中は予定のあいだに余白を入れて、乱れても戻れるようにします。"
        : "日中は詰め込みすぎず、気持ちが乱れたら一度立て直します。";
      night = "夜は情報を減らして、頭と心が静かになる終わり方を選びます。";
    }

    if (modelKey === "creator") {
      morning = sleep <= 5
        ? "朝は素材集めやメモだけにして、無理に大きく作り始めません。"
        : "朝のうちに短くても手を動かして、つくる流れに入ります。";
      daytime = energy === "low"
        ? "日中は短い没頭ブロックを1本だけつくり、作業を細かく分けます。"
        : "日中はまとまった没頭時間を作って、ひとつの制作に深く入ります。";
      night = pace === "intense"
        ? "夜に次に作るものを具体化して、翌日の着手を軽くします。"
        : "夜は思いつきを軽く残して、続きやすいところで止めます。";
    }

    if (modelKey === "money") {
      morning = "朝に今日使う上限を決めて、なんとなく使う流れを止めます。";
      daytime = energy === "low"
        ? "日中は買い物を急がず、本当に必要かを一度置いて考えます。"
        : "使うときは目的を決めてから使い、なんとなくの出費を減らします。";
      night = pace === "intense"
        ? "夜に支出を振り返って、次に減らせそうなところをひとつ決めます。"
        : "夜に今日のお金の流れを軽く見直して終えます。";
    }

    return {
      title: `今日の ${archetype.title}`,
      summary:
        `${archetype.intro} ` +
        `睡眠 ${sleep}時間 / 今日は ${energyLabel(energy)} 前提で、朝・日中・夜に分けました。`,
      items: [
        ["朝", morning],
        ["日中", daytime],
        ["夜", night]
      ],
      route: profile?.route || null,
      modelId: modelKey,
      createdAt: new Date().toISOString()
    };
  }

  function toDateWithTime(baseDate, timeText) {
    const [hour, minute] = timeText.split(":").map(Number);
    const date = new Date(baseDate);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  function toICSDate(date) {
    const pad = value => String(value).padStart(2, "0");
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  function escapeICSText(text) {
    return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function buildCalendarEntries(plan) {
    const slots = CALENDAR_SLOTS[plan.modelId] || CALENDAR_SLOTS.founder;
    const today = new Date();
    today.setSeconds(0, 0);
    return plan.items.map(([label, text], index) => {
      const slot = slots[index] || slots[slots.length - 1];
      const start = toDateWithTime(today, slot.time);
      const end = new Date(start.getTime() + slot.minutes * 60 * 1000);
      return { title: `${label} | ${plan.title}`, description: text, start, end };
    });
  }

  function buildICSFromEntries(entries, modelId) {
    const stamp = toICSDate(new Date());
    const events = entries.map((entry, index) => [
      "BEGIN:VEVENT",
      `UID:lifeear-${modelId}-${Date.now()}-${index}@lifeear.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toICSDate(entry.start)}`,
      `DTEND:${toICSDate(entry.end)}`,
      `SUMMARY:${escapeICSText(entry.title)}`,
      `DESCRIPTION:${escapeICSText(entry.description)}`,
      "END:VEVENT"
    ].join("\r\n")).join("\r\n");

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LifeEar//Daily Plan//JA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      events,
      "END:VCALENDAR"
    ].join("\r\n");
  }

  async function exportPlanToCalendar(itemIndex = null) {
    if (!state.currentPlan) return;
    const plan = state.currentPlan;
    const entries = buildCalendarEntries(plan);
    const targetEntries = itemIndex === null ? entries : [entries[itemIndex]];
    const ics = buildICSFromEntries(targetEntries, plan.modelId);
    const suffix = itemIndex === null ? "今日の過ごし方" : `${targetEntries[0].title}`;
    const fileName = `LifeEar_${suffix}_${new Date().toISOString().slice(0, 10)}.ics`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const file = typeof File === "function" ? new File([blob], fileName, { type: "text/calendar" }) : null;

    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: itemIndex === null ? plan.title : targetEntries[0].title,
        text: "LifeEar で作った今日の過ごし方です。"
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderTop() {
    const titles = {
      welcome: "理想の暮らし",
      choose: `質問 ${state.quiz.step + 1}/${QUIZ_STEPS.length}`,
      detail: "おすすめの暮らし",
      route: "想定ルート",
      catalog: "暮らし一覧",
      today: "今日の状態",
      plan: "今日の過ごし方",
      home: "ホーム",
      reflect: "ふりかえり"
    };
    root.topTitle.textContent = titles[state.screen];
    root.topSub.textContent = state.profile?.title || state.quizResult?.title || "LifeEar";
    root.backBtn.classList.toggle("hidden", state.history.length === 0 && !(state.screen === "choose" && state.quiz.step > 0));
    root.topAction.classList.toggle("hidden", !state.profile || ["welcome", "choose", "detail"].includes(state.screen));
  }

  function renderTabs() {
    root.tabs.classList.remove("show");
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.screen === state.screen);
    });
  }

  function renderScreens() {
    ["welcome", "choose", "detail", "route", "catalog", "today", "plan", "home", "reflect"].forEach(id => {
      $(id).classList.toggle("active", id === state.screen);
    });
  }

  function renderChoose() {
    const screen = $("choose");
    const step = QUIZ_STEPS[state.quiz.step];
    const selected = state.quiz.answers[step.id];
    screen.innerHTML = `
      <article class="card">
        <span class="pill">質問 ${state.quiz.step + 1}/${QUIZ_STEPS.length}</span>
        <div class="ai-note" style="margin-top:12px">
          <div class="ai-voice">AI</div>
          <div class="ai-bubble">
            <strong>${step.title}</strong>
            <div class="small">${step.hint}</div>
          </div>
        </div>
      </article>
      <div class="compact-stack scroll-panel" id="quizOptions"></div>
    `;

    const options = $("quizOptions");
    step.options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice compact ${selected === option.id ? "active" : ""}`;
      button.innerHTML = `<strong>${option.label}</strong><div class="small">${option.hint}</div>`;
      button.onclick = event => {
        pulse(event.currentTarget);
        state.quiz.answers[step.id] = option.id;
        if (state.quiz.step === QUIZ_STEPS.length - 1) {
          state.quizResult = deriveProfile(state.quiz.answers);
          showToast("理想の暮らしがまとまりました");
          setScreen("detail");
          return;
        }
        state.quiz.step += 1;
        render();
      };
      options.appendChild(button);
    });
  }

  function renderDetail() {
    const detail = $("detail");
    if (!state.quizResult) {
      detail.innerHTML = "";
      return;
    }

    detail.innerHTML = `
      <article class="card hero">
        <span class="pill">${state.quizResult.badge}</span>
        <h2 style="margin-top:12px">${state.quizResult.title}</h2>
        <p class="small" style="margin-top:10px">${state.quizResult.summary}</p>
      </article>
      <article class="card">
        <span class="pill">こう見立てました</span>
        <div class="compact-stack" style="margin-top:12px">
          ${state.quizResult.reasons.slice(0, 2).map(reason => `<div class="item"><div class="small">${reason}</div></div>`).join("")}
        </div>
      </article>
      <div class="actions">
        <button class="primary" id="confirmProfileBtn">この暮らしで進める</button>
        <button class="secondary" id="openRouteBtn">想定ルートを見る</button>
        <button class="secondary" id="openCatalogBtn">暮らし一覧を見る</button>
      </div>
    `;

    $("confirmProfileBtn").onclick = event => {
      pulse(event.currentTarget);
      state.profile = {
        id: state.profile?.id || `profile-${Date.now()}`,
        createdAt: state.profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastDailyState: state.profile?.lastDailyState || { sleep: 7, energy: "medium" },
        ...state.quizResult
      };
      state.quizResult = null;
      state.currentPlan = null;
      saveState();
      hydrateInputFromProfile();
      showToast("この暮らしで進めます");
      setScreen("today");
    };

    $("openRouteBtn").onclick = event => {
      pulse(event.currentTarget);
      state.routeView = "today";
      setScreen("route");
    };

    $("openCatalogBtn").onclick = event => {
      pulse(event.currentTarget);
      state.catalogBackTo = "detail";
      setScreen("catalog");
    };
  }

  function renderRoute() {
    const route = $("route");
    const profileLike = state.quizResult || state.profile;
    if (!profileLike?.route) {
      route.innerHTML = "";
      return;
    }

    const labels = {
      today: "今日",
      week: "今週",
      month: "1か月",
      year: "1年",
      estimate: "目安"
    };

    const bodies = {
      today: profileLike.route.today,
      week: profileLike.route.week.join(" / "),
      month: profileLike.route.month,
      year: profileLike.route.year,
      estimate: profileLike.route.estimate
    };

    route.innerHTML = `
      <article class="card hero">
        <span class="pill">${profileLike.badge}</span>
        <h2 style="margin-top:12px">${profileLike.title}</h2>
        <p class="small" style="margin-top:10px">この暮らしを続けたときの見通しです。</p>
      </article>
      <div class="route-tabs">
        ${Object.entries(labels).map(([key, label]) => `
          <button type="button" class="route-chip ${state.routeView === key ? "active" : ""}" data-route-key="${key}">${label}</button>
        `).join("")}
      </div>
      <article class="card">
        <span class="pill">${labels[state.routeView]}</span>
        <div class="item" style="margin-top:12px">
          <div class="small">${bodies[state.routeView]}</div>
        </div>
      </article>
      <div class="actions">
        <button class="primary" id="routeMainBtn">${state.quizResult ? "この暮らしで進める" : "今日の状態に戻る"}</button>
        <button class="secondary" id="routeCatalogBtn">暮らし一覧を見る</button>
      </div>
    `;

    route.querySelectorAll("[data-route-key]").forEach(button => {
      button.onclick = event => {
        pulse(event.currentTarget);
        state.routeView = button.dataset.routeKey;
        renderRoute();
      };
    });

    $("routeMainBtn").onclick = event => {
      pulse(event.currentTarget);
      if (state.quizResult) {
        state.profile = {
          id: state.profile?.id || `profile-${Date.now()}`,
          createdAt: state.profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastDailyState: state.profile?.lastDailyState || { sleep: 7, energy: "medium" },
          ...state.quizResult
        };
        state.quizResult = null;
        state.currentPlan = null;
        saveState();
        hydrateInputFromProfile();
        showToast("この暮らしで進めます");
        setScreen("today");
        return;
      }
      setScreen("today");
    };

    $("routeCatalogBtn").onclick = event => {
      pulse(event.currentTarget);
      state.catalogBackTo = "route";
      setScreen("catalog");
    };
  }

  function renderCatalog() {
    const catalog = $("catalog");
    const currentModel = state.quizResult?.selectedModel || state.profile?.selectedModel;

    catalog.innerHTML = `
      <article class="card">
        <span class="pill">暮らし一覧</span>
        <p class="small" style="margin-top:10px">LifeEar では、こんな暮らし方から今の自分に近いものを選びます。</p>
      </article>
      <div class="compact-stack scroll-panel" id="catalogList"></div>
      <div class="actions">
        <button class="primary" id="catalogBackBtn">${state.quizResult ? "おすすめに戻る" : "今の暮らしに戻る"}</button>
      </div>
    `;

    const list = $("catalogList");
    Object.entries(ARCHETYPES).forEach(([key, model]) => {
      const item = document.createElement("div");
      item.className = `choice compact ${currentModel === key ? "active" : ""}`;
      item.innerHTML = `
        <div class="catalog-card">
          <div class="row">
            <span class="pill">${model.badge}</span>
            ${currentModel === key ? '<span class="micro">いまのおすすめ</span>' : '<span class="micro">候補</span>'}
          </div>
          <strong>${model.title}</strong>
          <div class="small">${model.intro}</div>
        </div>
      `;
      list.appendChild(item);
    });

    $("catalogBackBtn").onclick = event => {
      pulse(event.currentTarget);
      setScreen(state.catalogBackTo || (state.quizResult ? "detail" : "home"));
    };
  }

  function renderToday() {
    const profileLike = state.profile || state.quizResult;
    if (!profileLike) return;
    const last = state.profile?.lastDailyState;
    $("todayLead").textContent = last
      ? `前回の「睡眠 ${last.sleep}時間 / ${energyLabel(last.energy)}」を入れてあります。必要なら変えてください。`
      : `「${profileLike.title}」に寄せるために、睡眠時間と今日の余力だけ教えてください。`;
  }

  function renderPlan() {
    const list = $("planList");
    list.innerHTML = "";
    if (!state.currentPlan) {
      $("planTitle").textContent = "まだ今日の過ごし方はありません。";
      $("planSummary").textContent = "先に今日の状態を入れると、ここにAIからの提案が出ます。";
      list.innerHTML = '<div class="empty">まだプランはありません。</div>';
      return;
    }

    $("planTitle").textContent = "では、今日はこう進めましょう。";
    $("planSummary").textContent = state.currentPlan.summary;

    state.currentPlan.items.forEach(([label, text], index) => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML =
        `<strong>${label}</strong>` +
        `<div class="small">${text}</div>` +
        `<div class="actions" style="margin-top:10px">` +
        `<button class="secondary item-calendar-btn" data-index="${index}">この予定をカレンダーに入れる</button>` +
        `</div>`;
      list.appendChild(item);
    });

    list.querySelectorAll(".item-calendar-btn").forEach(button => {
      button.onclick = async event => {
        pulse(event.currentTarget);
        try {
          await exportPlanToCalendar(Number(button.dataset.index));
          showToast("この予定をカレンダーに入れやすい形にしました");
        } catch {
          showToast("カレンダー追加はキャンセルされました");
        }
      };
    });

    $("calendarBtn").textContent = "全部カレンダーに入れる";
    $("editPlanBtn").textContent = "想定ルートを見る";
  }

  function renderHome() {
    if (!state.profile) return;
    const lastLog = state.logs[0];
    $("homeTitle").textContent = `${state.profile.title}を引き継いで、今日を作りますか？`;
    $("homeSummary").textContent = lastLog
      ? `前回は ${new Date(lastLog.createdAt).toLocaleDateString("ja-JP")} に作っています。理想の暮らしは必要なときだけ見直せます。`
      : "前回の理想の暮らしを引き継げます。必要なときだけ質問をやり直してください。";
    $("homeMainBtn").textContent = "前回の暮らしで今日を作る";
    $("homeSubBtn").textContent = "暮らし一覧を見る";
    $("homeMainBtn").onclick = event => {
      pulse(event.currentTarget);
      hydrateInputFromProfile();
      setScreen("today", { reset: true });
    };
    $("homeSubBtn").onclick = event => {
      pulse(event.currentTarget);
      state.catalogBackTo = "home";
      setScreen("catalog", { reset: true });
    };
  }

  function renderPosts() {
    const list = $("postList");
    list.innerHTML = "";
    if (state.posts.length === 0) {
      list.innerHTML = '<div class="empty">まだふりかえりはありません。</div>';
      return;
    }
    state.posts.forEach(post => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML =
        `<strong>${post.tag}</strong>` +
        `<div class="small">${post.body}</div>` +
        `<div class="small" style="margin-top:6px">${new Date(post.createdAt).toLocaleString("ja-JP")}</div>`;
      list.appendChild(item);
    });
  }

  function render() {
    renderTop();
    renderTabs();
    renderScreens();
    renderChoose();
    renderDetail();
    renderRoute();
    renderCatalog();
    renderToday();
    renderPlan();
    renderHome();
    renderPosts();
  }

  function setupSleepOptions() {
    const select = $("sleepInput");
    select.innerHTML = "";
    for (let hour = 1; hour <= 12; hour += 1) {
      const option = document.createElement("option");
      option.value = String(hour);
      option.textContent = `${hour}時間`;
      if (hour === state.input.sleep) option.selected = true;
      select.appendChild(option);
    }
  }

  $("startBtn").onclick = event => {
    pulse(event.currentTarget);
    startQuiz(false);
  };

  root.backBtn.onclick = event => {
    pulse(event.currentTarget);
    goBack();
  };

  root.topAction.onclick = event => {
    pulse(event.currentTarget);
    startQuiz(true);
  };

  ["sleepInput", "energyInput"].forEach(id => {
    $(id).addEventListener("input", () => {
      state.input = {
        sleep: Number($("sleepInput").value),
        energy: $("energyInput").value
      };
      renderToday();
    });
  });

  $("planBtn").onclick = event => {
    pulse(event.currentTarget);
    if (!state.profile) return;
    state.profile.lastDailyState = {
      sleep: state.input.sleep,
      energy: state.input.energy
    };
    state.profile.updatedAt = new Date().toISOString();
    state.currentPlan = buildPlan(getCurrentModelKey());
    saveState();
    showToast("今日の過ごし方を作りました");
    setScreen("plan");
  };

  $("editPlanBtn").onclick = event => {
    pulse(event.currentTarget);
    state.routeView = "today";
    setScreen("route");
  };

  $("calendarBtn").onclick = async event => {
    if (!state.currentPlan || !state.profile) return;
    pulse(event.currentTarget);
    try {
      await exportPlanToCalendar();
      state.logs.unshift({
        id: `log-${Date.now()}`,
        ...state.currentPlan,
        sleep: state.input.sleep,
        energy: state.input.energy
      });
      state.logs = state.logs.slice(0, 20);
      saveState();
      showToast("カレンダーに入れやすいファイルを作りました");
      setScreen("home", { reset: true });
    } catch {
      showToast("カレンダー追加はキャンセルされました");
    }
  };

  $("postBtn").onclick = event => {
    if (!state.profile) return;
    const body = $("postInput").value.trim();
    if (!body) {
      $("postInput").focus();
      return;
    }
    pulse(event.currentTarget);
    state.posts.unshift({
      id: `post-${Date.now()}`,
      tag: $("tagInput").value,
      body,
      modelId: state.profile.selectedModel,
      createdAt: new Date().toISOString()
    });
    $("postInput").value = "";
    saveState();
    renderPosts();
    renderHome();
    showToast("ふりかえりを残しました");
  };

  document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = event => {
      pulse(event.currentTarget);
      setScreen(tab.dataset.screen, { reset: true });
    };
  });

  setupSleepOptions();
  hydrateInputFromProfile();
  render();
})();
