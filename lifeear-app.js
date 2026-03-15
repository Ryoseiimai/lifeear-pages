(() => {
  const {
    STORAGE,
    ARCHETYPES,
    QUIZ_STEPS,
    CALENDAR_SLOTS,
    PILLARS,
    CARE_TIME_OPTIONS,
    ARCHETYPE_PILLAR_WEIGHTS,
    readJson,
    normalizeProfile,
    deriveProfile
  } = window.LifeEarData;

  const initialProfile = normalizeProfile(readJson(STORAGE.profile, null));
  const initialDailyState = initialProfile?.lastDailyState || { sleep: 7, energy: "medium", careTime: 90 };

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
      energy: initialDailyState.energy || "medium",
      careTime: initialDailyState.careTime || 90
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
      energy: state.profile.lastDailyState.energy || "medium",
      careTime: state.profile.lastDailyState.careTime || 90
    };
    if ($("sleepInput")) $("sleepInput").value = String(state.input.sleep);
    if ($("energyInput")) $("energyInput").value = state.input.energy;
    if ($("careTimeInput")) $("careTimeInput").value = String(state.input.careTime);
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

  function getCareTimeLabel(minutes) {
    return CARE_TIME_OPTIONS.find(option => option.minutes === minutes)?.label || `${minutes}分`;
  }

  function allocateMinutes(weights, totalMinutes) {
    const ids = Object.keys(weights);
    const totalWeight = ids.reduce((sum, id) => sum + weights[id], 0);
    const raw = {};
    const allocated = {};
    let used = 0;

    ids.forEach(id => {
      raw[id] = (weights[id] / totalWeight) * totalMinutes;
      allocated[id] = Math.max(5, Math.floor(raw[id] / 5) * 5);
      used += allocated[id];
    });

    while (used > totalMinutes) {
      const candidate = ids
        .filter(id => allocated[id] > 5)
        .sort((a, b) => (allocated[b] - raw[b]) - (allocated[a] - raw[a]))[0];
      if (!candidate) break;
      allocated[candidate] -= 5;
      used -= 5;
    }

    while (used < totalMinutes) {
      const candidate = ids
        .sort((a, b) => (raw[b] - allocated[b]) - (raw[a] - allocated[a]))[0];
      allocated[candidate] += 5;
      used += 5;
    }

    return allocated;
  }

  function buildPillarWeights(modelKey) {
    const weights = { ...ARCHETYPE_PILLAR_WEIGHTS[modelKey] };
    const answers = state.profile?.answers || {};

    if (answers.focus === "work") {
      weights.learning += 8;
      weights.self += 4;
    }
    if (answers.focus === "body") {
      weights.sleep += 8;
      weights.food += 6;
      weights.exercise += 8;
    }
    if (answers.focus === "heart") {
      weights.self += 10;
      weights.sleep += 6;
    }
    if (answers.focus === "money") {
      weights.learning += 8;
      weights.self += 5;
      weights.food += 2;
    }
    if (answers.focus === "relationships") {
      weights.self += 8;
      weights.food += 3;
      weights.sleep += 3;
    }

    if (answers.reality === "time") {
      weights.sleep += 3;
      weights.food += 3;
      weights.self += 3;
      weights.learning -= 2;
      weights.exercise -= 2;
    }
    if (answers.reality === "schedule") {
      weights.sleep += 4;
      weights.self += 4;
    }
    if (answers.reality === "energy") {
      weights.sleep += 6;
      weights.food += 5;
      weights.exercise += 2;
    }
    if (answers.reality === "flex") {
      weights.learning += 4;
      weights.exercise += 2;
      weights.self += 2;
    }

    if (answers.pace === "gentle") {
      weights.sleep += 4;
      weights.self += 3;
    }
    if (answers.pace === "intense") {
      weights.learning += 4;
      weights.exercise += 2;
    }

    if (state.input.sleep <= 5) {
      weights.sleep += 12;
    } else if (state.input.sleep <= 6) {
      weights.sleep += 7;
    }

    if (state.input.energy === "low") {
      weights.sleep += 8;
      weights.food += 5;
      weights.learning -= 1;
    }
    if (state.input.energy === "high") {
      weights.exercise += 4;
      weights.learning += 4;
    }

    Object.keys(weights).forEach(id => {
      weights[id] = Math.max(8, weights[id]);
    });

    return weights;
  }

  function buildPillarAdvice(pillarId, minutes, modelKey) {
    const focus = state.profile?.answers?.focus;

    if (pillarId === "sleep") {
      return {
        reason: state.input.sleep <= 6
          ? "まずは回復を戻すことが、今日の伸びしろを一番作ります。"
          : "睡眠を整えておくと、理想の暮らしを続けやすくなります。",
        action: minutes >= 25
          ? "今夜はいつもより30分早く寝る準備をします。"
          : "寝る前の画面時間を短くして、眠りやすい流れを作ります。"
      };
    }

    if (pillarId === "food") {
      return {
        reason: "食事が整うと、集中力と体調のぶれが小さくなります。",
        action: minutes >= 20
          ? "次の食事を整える準備をして、たんぱく質をひとつ足します。"
          : "次の食事で整えたいものをひとつ決めます。"
      };
    }

    if (pillarId === "exercise") {
      return {
        reason: state.input.energy === "low"
          ? "軽く動くことで、だるさを引きずりにくくします。"
          : "運動を少し入れると、今日の立ち上がりが安定します。",
        action: minutes >= 20
          ? "歩くかストレッチで、体をしっかり起こす時間を取ります。"
          : "5分だけでも体をほぐして、止まりすぎない日にします。"
      };
    }

    if (pillarId === "learning") {
      const tailored =
        modelKey === "money" ? "お金の不安を減らす学びが効きます。" :
        modelKey === "creator" ? "表現や制作につながる学びが効きます。" :
        "理想に近づくための学びが効きます。";
      return {
        reason: focus === "work" || focus === "money" ? tailored : "短く学ぶ時間が、理想の暮らしの精度を上げます。",
        action: minutes >= 25
          ? "25分だけ学びに没頭して、すぐ使える気づきを1つ持ち帰ります。"
          : "10分だけ学んで、今日使えることを1つだけ拾います。"
      };
    }

    return {
      reason: "自己理解があると、理想と現実のズレを自分で調整しやすくなります。",
      action: minutes >= 20
        ? "10分書いて、10分で明日の整え方を決めます。"
        : "3行だけ振り返って、今日の気づきを残します。"
    };
  }

  function buildPlan(modelKey) {
    const { sleep, energy, careTime } = state.input;
    const profile = state.profile;
    const archetype = ARCHETYPES[modelKey];
    const weights = buildPillarWeights(modelKey);
    const allocated = allocateMinutes(weights, careTime);
    const pillars = Object.entries(PILLARS).map(([pillarId, pillar]) => {
      const advice = buildPillarAdvice(pillarId, allocated[pillarId], modelKey);
      return {
        id: pillarId,
        label: pillar.label,
        minutes: allocated[pillarId],
        time: pillar.time,
        reason: advice.reason,
        action: advice.action
      };
    });
    const topThree = [...pillars]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    return {
      title: `今日の ${archetype.title}`,
      summary:
        `${archetype.intro} ` +
        `今日は ${getCareTimeLabel(careTime)} を、食事・睡眠・運動・学び・自己理解に配分します。` +
        `睡眠 ${sleep}時間 / ${energyLabel(energy)} 前提で、優先度を調整しています。`,
      pillars,
      items: [
        ["最初に", `${topThree[0].label}に ${topThree[0].minutes}分。${topThree[0].action}`],
        ["次に", `${topThree[1].label}に ${topThree[1].minutes}分。${topThree[1].action}`],
        ["最後に", `${topThree[2].label}に ${topThree[2].minutes}分。${topThree[2].action}`]
      ],
      focusLine: `今日は「${topThree[0].label}」を軸に整える日です。`,
      careTime,
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

  function toLocalCalendarDate(date) {
    const pad = value => String(value).padStart(2, "0");
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  function getTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";
    } catch {
      return "Asia/Tokyo";
    }
  }

  function isIOSDevice() {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function buildCalendarEntries(plan) {
    const today = new Date();
    today.setSeconds(0, 0);
    const source = plan.pillars?.length
      ? plan.pillars.map(pillar => ({
        label: pillar.label,
        text: `${pillar.minutes}分: ${pillar.reason} ${pillar.action}`,
        time: pillar.time,
        minutes: pillar.minutes
      }))
      : plan.items.map(([label, text], index) => {
        const slots = CALENDAR_SLOTS[plan.modelId] || CALENDAR_SLOTS.founder;
        const slot = slots[index] || slots[slots.length - 1];
        return { label, text, time: slot.time, minutes: slot.minutes };
      });

    return source.map(entry => {
      const start = toDateWithTime(today, entry.time);
      const end = new Date(start.getTime() + entry.minutes * 60 * 1000);
      return {
        title: `${entry.label} | ${plan.title}`,
        description: entry.text,
        start,
        end
      };
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

  function buildGoogleCalendarUrl(itemIndex = null) {
    if (!state.currentPlan) return;
    const plan = state.currentPlan;
    const entries = buildCalendarEntries(plan);
    const targetEntries = itemIndex === null ? entries : [entries[itemIndex]];
    const start = targetEntries[0].start;
    const end = targetEntries[targetEntries.length - 1].end;
    const title = itemIndex === null ? plan.title : targetEntries[0].title;
    const details = itemIndex === null
      ? targetEntries.map((entry, index) => `${index + 1}. ${entry.title}\n${entry.description}`).join("\n\n")
      : targetEntries[0].description;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      details,
      dates: `${toLocalCalendarDate(start)}/${toLocalCalendarDate(end)}`,
      ctz: getTimeZone()
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function openGoogleCalendar(itemIndex = null) {
    const url = buildGoogleCalendarUrl(itemIndex);
    if (!url) return;
    const popup = window.open(url, "_blank", "noopener");
    if (!popup) {
      window.location.href = url;
    }
  }

  async function exportPlanToAppleCalendar(itemIndex = null) {
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
    if (isIOSDevice()) {
      link.target = "_blank";
      link.rel = "noopener";
    } else {
      link.download = fileName;
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function rememberCurrentPlan() {
    if (!state.currentPlan) return;
    const exists = state.logs.some(log => log.createdAt === state.currentPlan.createdAt && log.modelId === state.currentPlan.modelId);
    if (exists) return;
    state.logs.unshift({
      id: `log-${Date.now()}`,
      ...state.currentPlan,
      sleep: state.input.sleep,
      energy: state.input.energy
    });
    state.logs = state.logs.slice(0, 20);
    saveState();
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
        <button class="text-link" id="openCatalogInlineBtn" style="margin-top:10px">他の暮らし一覧を見る</button>
      </article>
      <article class="card">
        <span class="pill">こう見立てました</span>
        <div class="compact-stack" style="margin-top:12px">
          ${state.quizResult.reasons.slice(0, 2).map(reason => `<div class="item"><div class="small">${reason}</div></div>`).join("")}
        </div>
      </article>
      <div class="actions">
        <button class="primary" id="confirmProfileBtn">この暮らしで進める</button>
      </div>
    `;

    $("confirmProfileBtn").onclick = event => {
      pulse(event.currentTarget);
      state.profile = {
        id: state.profile?.id || `profile-${Date.now()}`,
        createdAt: state.profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastDailyState: state.profile?.lastDailyState || { sleep: 7, energy: "medium", careTime: 90 },
        ...state.quizResult
      };
      state.quizResult = null;
      state.currentPlan = null;
      saveState();
      hydrateInputFromProfile();
      showToast("この暮らしで進めます");
      setScreen("today");
    };

    $("openCatalogInlineBtn").onclick = event => {
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
          lastDailyState: state.profile?.lastDailyState || { sleep: 7, energy: "medium", careTime: 90 },
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
      ? `前回の「睡眠 ${last.sleep}時間 / ${energyLabel(last.energy)} / ${getCareTimeLabel(last.careTime || 90)}」を入れてあります。必要なら変えてください。`
      : `「${profileLike.title}」に寄せるために、睡眠と余力と使える時間を教えてください。`;
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

    $("planTitle").textContent = "では、今日はこう時間を使いましょう。";
    $("planSummary").textContent = state.currentPlan.summary;

    const focusItem = document.createElement("div");
    focusItem.className = "item";
    focusItem.innerHTML =
      `<strong>${state.currentPlan.focusLine}</strong>` +
      `<div class="small" style="margin-top:6px">今日は ${getCareTimeLabel(state.currentPlan.careTime)} を配分しています。</div>`;
    list.appendChild(focusItem);

    state.currentPlan.pillars.forEach((pillar, index) => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML =
        `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center">` +
        `<strong>${pillar.label}</strong>` +
        `<span class="pill">${pillar.minutes}分</span>` +
        `</div>` +
        `<div class="small" style="margin-top:8px">${pillar.reason}</div>` +
        `<div class="small" style="margin-top:6px">${pillar.action}</div>` +
        `<div class="button-grid" style="margin-top:10px">` +
        `<button class="secondary item-google-btn" data-index="${index}">Google</button>` +
        `<button class="secondary item-apple-btn" data-index="${index}">iPhone / Apple</button>` +
        `</div>`;
      list.appendChild(item);
    });

    const supportItem = document.createElement("div");
    supportItem.className = "item";
    supportItem.innerHTML =
      `<strong>今日のステップアップ</strong>` +
      state.currentPlan.items.map(([label, text]) => `<div class="small" style="margin-top:8px">${label}: ${text}</div>`).join("");
    list.appendChild(supportItem);

    list.querySelectorAll(".item-google-btn").forEach(button => {
      button.onclick = async event => {
        pulse(event.currentTarget);
        try {
          openGoogleCalendar(Number(button.dataset.index));
          showToast("Googleカレンダーの作成画面を開きました");
        } catch {
          showToast("Googleカレンダーを開けませんでした");
        }
      };
    });

    list.querySelectorAll(".item-apple-btn").forEach(button => {
      button.onclick = async event => {
        pulse(event.currentTarget);
        try {
          await exportPlanToAppleCalendar(Number(button.dataset.index));
          showToast("iPhone / Apple カレンダー用ファイルを開きました");
        } catch {
          showToast("Appleカレンダー用ファイルを作れませんでした");
        }
      };
    });

    $("googleCalendarBtn").textContent = "Googleカレンダー";
    $("appleCalendarBtn").textContent = "iPhone / Apple";
    $("editPlanBtn").textContent = "条件を変える";
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

  function setupCareTimeOptions() {
    const select = $("careTimeInput");
    select.innerHTML = "";
    CARE_TIME_OPTIONS.forEach(option => {
      const node = document.createElement("option");
      node.value = String(option.minutes);
      node.textContent = option.label;
      if (option.minutes === state.input.careTime) node.selected = true;
      select.appendChild(node);
    });
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

  ["sleepInput", "energyInput", "careTimeInput"].forEach(id => {
    $(id).addEventListener("input", () => {
      state.input = {
        sleep: Number($("sleepInput").value),
        energy: $("energyInput").value,
        careTime: Number($("careTimeInput").value)
      };
      renderToday();
    });
  });

  $("planBtn").onclick = event => {
    pulse(event.currentTarget);
    if (!state.profile) return;
    state.profile.lastDailyState = {
      sleep: state.input.sleep,
      energy: state.input.energy,
      careTime: state.input.careTime
    };
    state.profile.updatedAt = new Date().toISOString();
    state.currentPlan = buildPlan(getCurrentModelKey());
    saveState();
    showToast("今日の過ごし方を作りました");
    setScreen("plan");
  };

  $("editPlanBtn").onclick = event => {
    pulse(event.currentTarget);
    setScreen("today");
  };

  $("googleCalendarBtn").onclick = event => {
    if (!state.currentPlan || !state.profile) return;
    pulse(event.currentTarget);
    try {
      openGoogleCalendar();
      rememberCurrentPlan();
      showToast("Googleカレンダーの作成画面を開きました");
    } catch {
      showToast("Googleカレンダーを開けませんでした");
    }
  };

  $("appleCalendarBtn").onclick = async event => {
    if (!state.currentPlan || !state.profile) return;
    pulse(event.currentTarget);
    try {
      await exportPlanToAppleCalendar();
      rememberCurrentPlan();
      showToast("iPhone / Apple カレンダー用ファイルを開きました");
    } catch {
      showToast("Appleカレンダー用ファイルを作れませんでした");
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
  setupCareTimeOptions();
  hydrateInputFromProfile();
  render();
})();
