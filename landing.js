(() => {
  const PRESETS = { "0600": 360, "1200": 720, "1830": 1110, "2200": 1320 };
  const ORDER = ["live", "saved", "0600", "1200", "1830", "2200"];
  // The choice made here is the one the game opens with (src/town-clock.js reads it).
  const CLOCK_KEY = "johansson-town-clock";
  const SPEEDS = [1, 2, 4];
  const readSetting = () => {
    try {
      const s = JSON.parse(localStorage.getItem(CLOCK_KEY));
      const start = s && typeof s.start === "string" ? s.start : "real";
      const mode = start === "real" ? "live" : start === "saved" ? "saved" : start.replace(":", "");
      return { mode: ORDER.includes(mode) ? mode : "live", speed: SPEEDS.includes(s && s.speed) ? s.speed : 1 };
    } catch { return { mode: "live", speed: 1 }; }
  };
  const writeSetting = () => {
    const start = mode === "live" ? "real" : mode === "saved" ? "saved" : mode.slice(0, 2) + ":" + mode.slice(2);
    try { localStorage.setItem(CLOCK_KEY, JSON.stringify({ start, speed: mode === "live" ? 1 : speed })); } catch {}
  };
  /** Where the active player left off, from their save, as a minute of the day. */
  const savedMinute = () => {
    try {
      const roster = JSON.parse(localStorage.getItem("johansson-town-players") || "null");
      const id = roster && roster.active && roster.active !== "player-1" ? roster.active : null;
      const save = JSON.parse(localStorage.getItem("johansson-town-1988-v5" + (id ? "@" + id : "")) || "null");
      return save && Number.isFinite(save.minutes) ? ((save.minutes % 1440) + 1440) % 1440 : null;
    } catch { return null; }
  };
  const PLACES = [
    { id: "market", code: "01", title: "Sakura Shōten", jp: "Sakura Shop", sub: "Daily goods", district: "Shopping street", open: 540, close: 1200, line: "Thuan’s convenience store. Tea, snacks, everyday things. Thuan at the till 09:00–20:00." },
    { id: "frontrow", code: "02", title: "Front-Row Books", jp: "Front-Row Books", sub: "Books · newspapers · reading", district: "Main Street west", open: 540, close: 1470, line: "Nhung’s books, a quiet reading corner, and Reiko’s evening newspaper. North of Minato, with a passage to the yard." },
    { id: "form3d", code: "03A", title: "Dock Electrical & Repair Workshop", jp: "Dock Electrical Workshop", sub: "INSTRUMENTS · ELECTRICAL · REPAIRS", district: "Western quay", open: 540, close: 1140, line: "Chin and Tetsuo repair radios and instruments beside the harbour warehouse." },
    { id: "office", code: "03", title: "Johansson Harbour Office", jp: "Port Affairs and Technology Office", sub: "Marine service · records", district: "Quay", open: null, close: null, line: "Shipping records, tide tables, and Johansson’s marine files. Staffed around the clock." },
    { id: "izakaya", code: "04", title: "Minato Izakaya", jp: "Minato Izakaya", sub: "Lanterns · yakitori", district: "Main Street west", open: 960, close: 1620, line: "Opens at sixteen hundred. Last pour around three in the morning." },
    { id: "bus-station", code: "05", title: "Harbour Line Bus Station", jp: "Bus stop", sub: "Arrivals · departures", district: "Town terminus", open: null, close: null, line: "The northern terminus. Day staff arrive here and leave by the last bus." },
    { id: "warehouse", code: "06", title: "Quay Warehouse", jp: "Warehouse", sub: "Fishing gear", district: "Quay", open: null, close: null, line: "Quay stores and fishing gear. Mrs Sato balances warehouse duties with the lunch kitchen at Sato Ramen. Open at all hours." },
    {id:"sato-ramen",code:"06A",title:"Sato Ramen",jp:"Sato Ramen",sub:"Lunch at the counter",district:"Minato corner",open:660,close:840,line:"Mrs Sato’s steaming stock pots and red stools. The kitchen is shared with Minato, with a clear passage around the counter."},
    {id:"japanese-garden",code:"07A",title:"Aoba Japanese Garden",jp:"Japanese Garden",sub:"Pond · paths · onsen",district:"Garden district",open:null,close:null,line:"Take a slow walk past the pond, stone lanterns and garden planting, then visit the relocated onsen."},
    {id:"airport",code:"09",title:"Kitano-jima Airport",jp:"Island Airport",sub:"Terminals · shops · growing island",district:"Airport district",open:null,close:null,line:"Explore the passenger district and its shops. Construction notices mark the next stage of the airport’s growth."},
    {id:"rainflower-florist",code:"10A",title:"Rainflower Florist",jp:"Rainflower Florist",sub:"Flowers · pots · hand-made wreaths",district:"Rainflower Lane",open:540,close:1080,line:"Mrs Kinjō arranges fresh stems at the open shop front. Walk inside and choose a hand-wrapped bouquet for ¥250."},
    {id:"blue-coral",code:"10",title:"Blue Coral Ice Cream",jp:"Blue Coral",sub:"Ice cream · island tea",district:"Rainflower Lane",open:null,close:null,line:"A teal wooden counter, a glass scoop case and a little cloud mural. Choose an ube and vanilla cone or a cold island tea."},
    { id: "park", code: "07", title: "Harbour Park", jp: "Park", sub: "Benches · trees", district: "East lawn", open: null, close: null, line: "Raised walk and benches looking back at the shotengai." },
    { id: "pier", code: "08", title: "Outer Pier", jp: "Oki Pier", sub: "Boards · night warning", district: "Harbour", open: null, close: null, line: "Connected western and eastern lanes, second jetty. Caution after dark." },
  ];
  const DUTIES = {
    Thuan: [540,1200], Nhung: [540,1110], Chin: [540,1140],
    "Mrs Sato": [540,1260], Reiko: [900,1470], Tetsuo: [1020,1440],
    Thao: [960,1620], "Officer Mori": [1320,1800]
  };
  const RESIDENTS = (window.JOHANSSON_RESIDENT_GUIDE || []).map(r => ({
    ...r, start: DUTIES[r.name]?.[0], end: DUTIES[r.name]?.[1],
    always: r.name === "Harbour master" || r.name === "Bus driver"
  }));


  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  // The board follows the device's real date and weekday. The 1990s are the town's
  // way of life and visual setting, not a substitute calendar.

  const minuteOfDay = (m) => ((m % 1440) + 1440) % 1440;
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (m) => {
    const w = minuteOfDay(m);
    return `${pad(Math.floor(w / 60))}:${pad(Math.floor(w % 60))}`;
  };
  const fmtS = (m) => {
    const w = minuteOfDay(m);
    const s = Math.floor((w * 60) % 60);
    return `${fmt(w)}:${pad(s)}`;
  };
  const periodOf = (m) => {
    const h = minuteOfDay(m) / 60;
    if (h < 7) return "EARLY MORNING";
    if (h < 17) return "AFTERNOON";
    if (h < 20) return "EVENING";
    return "NIGHT";
  };
  const periodLine = (m) => {
    const p = periodOf(m);
    if (p === "EARLY MORNING") return "Shops are closed. The Harbour Line is preparing the first arrival.";
    if (p === "AFTERNOON") return "Shops are open.";
    if (p === "EVENING") return "Windows lighting. Paper going to press.";
    return "Most shops are closed. Minato and the quay office are still working.";
  };
  const isOpen = (place, m) => {
    if (place.open == null || place.close == null) return true;
    const t = minuteOfDay(m);
    if (place.close > 1440) return t >= place.open || t < place.close - 1440;
    return t >= place.open && t < place.close;
  };
  const hoursLabel = (place) => {
    if (place.open == null) return "Always";
    const close = place.close > 1440 ? place.close - 1440 : place.close;
    return `${fmt(place.open)}–${fmt(close)}`;
  };
  const onDuty = (r, m) => {
    if (r.always) return true;
    if (r.start == null) return periodOf(m) === "AFTERNOON";
    const t = minuteOfDay(m);
    if (r.end > 1440) return t >= r.start || t < r.end - 1440;
    return t >= r.start && t < r.end;
  };
  const localMinutes = (now) => {
    const d = new Date(now);
    return d.getHours() * 60 + d.getMinutes() + (d.getSeconds() + d.getMilliseconds() / 1000) / 60;
  };
  const townDate = (now) => {
    const d = new Date(now);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    const weekday = WEEKDAYS[d.getDay()];
    const monthName = MONTHS[d.getMonth()];
    const monthShort = MONTHS_SHORT[d.getMonth()];
    const mm = pad(month);
    const dd = pad(day);
    const long = `${day} ${monthName.toUpperCase()} ${year}`;
    return {
      weekday,
      weekdayUpper: weekday.toUpperCase(),
      short: `${day} ${monthShort} ${year}`,
      eraLine: `${weekday.toUpperCase()} · ${long}`,
      weekdayLine: weekday.toUpperCase(),
      japanese: long,
      documentNo: `JT-HB-${year}-${mm}${dd}`,
    };
  };

  let { mode, speed } = readSetting();
  let runOrigin = null;

  const $ = (id) => document.getElementById(id);
  const start = $("start");
  const digital = $("boardDigital");
  const periodEl = $("boardPeriod");
  const lineEl = $("boardLine");
  const shopsEl = $("boardShops");
  const liveEl = $("boardLive");
  const statusPeriod = $("statusPeriod");
  const statusShops = $("statusShops");
  const hoursHead = $("hoursHeadTime");
  const hoursBody = $("hoursBody");
  const placesGrid = $("placesGrid");
  const rollGrid = $("rollGrid");
  const statusWeekday = $("statusWeekday");
  const boardDoc = $("boardDoc");
  const boardDateLong = $("boardDateLong");
  const boardDateShort = $("boardDateShort");
  const boardWeekdayLine = $("boardWeekdayLine");
  const noticeWhen = $("noticeWhen");
  const boardJpDate = $("boardJpDate");
  const hourHand = $("handHour");
  const minuteHand = $("handMinute");
  const secondHand = $("handSecond");

  function currentMinutes(now) {
    const local = localMinutes(now);
    if (mode === "live") return minuteOfDay(local);
    // A set start runs on from that minute at the chosen speed, as the town will.
    const origin = runOrigin || { real: now, minutes: mode === "saved" ? (savedMinute() ?? local) : PRESETS[mode] };
    runOrigin = origin;
    return minuteOfDay(origin.minutes + (now - origin.real) / 60000 * speed);
  }

  function setMode(next) {
    const now = Date.now();
    const shown = currentMinutes(now);
    mode = next;
    runOrigin = null;
    if (mode === "live") speed = 1;
    writeSetting();
    showSetting();
    tick();
  }

  function renderStatic() {
    hoursBody.innerHTML = PLACES.map((place) => `
      <tr data-place="${place.id}">
        <td class="muted">${place.code}</td>
        <td><b>${place.title}</b><div class="muted">${place.jp} · ${place.sub}</div></td>
        <td>${place.district}</td>
        <td>${hoursLabel(place)}</td>
        <td class="now-cell"></td>
      </tr>`).join("");
    placesGrid.innerHTML = PLACES.map((place) => `
      <article class="place-card">
        <p class="board-tiny muted">${place.code} · ${place.jp}</p>
        <h3>${place.title}</h3>
        <p>${place.line}</p>
      </article>`).join("");
    // Resident content is authored in the guide catalogue, independent of the schedule engine.
    const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    // Each resident is a magazine profile: lead photo, headline and standfirst, then the full piece.
    const photo = (p, cls) => p ? `<figure class="${cls}"><img src="./${escape(p.file)}" width="900" height="1200" loading="lazy" decoding="async" alt="${escape(p.caption)}"><figcaption>${escape(p.caption)}</figcaption></figure>` : '';
    rollGrid.innerHTML = RESIDENTS.map(r => {
      const a = r.article || {headline: r.name, standfirst: r.bio, body: [r.backstory], photos: []};
      const [lead, second] = a.photos || [];
      const body = a.body.map((para, i) => `<p>${escape(para)}</p>${i === 0 && a.quote ? `<blockquote class="article-quote">“${escape(a.quote)}”</blockquote>` : ''}${i === 1 ? photo(second, 'article-inline') : ''}`).join('');
      const p = r.islandPersonality;
      return `
      <article class="roll-card article-card" data-resident="${escape(r.name)}">
        ${lead ? photo(lead, 'article-lead') : `<img class="resident-portrait" src="./${escape(r.portrait)}" width="480" height="480" loading="lazy" alt="${escape(r.name)}">`}
        <div class="resident-copy">
          <p class="resident-role">${escape(r.name)} · ${escape(r.role)}</p>
          <h3>${escape(a.headline)}</h3>
          <p class="resident-bio">${escape(a.standfirst)}</p>
          <details class="resident-story"><summary>Read the article</summary>
            <div class="article-body">${body}</div>
            <dl class="resident-facts">${r.home ? '<dt>Home</dt><dd>' + escape(r.home.address) + '<br>' + r.home.residents.map(escape).join(' · ') + '</dd>' : ''}${(r.secondaryHomes||[]).map(home=>'<dt>Weekday room</dt><dd>'+escape(home.address)+'</dd>').join('')}<dt>Usually found</dt><dd>${escape(r.place)}</dd>${r.age ? '<dt>Age</dt><dd>' + escape(r.age) + '</dd>' : ''}${r.friend ? '<dt>Close friend</dt><dd>' + escape(r.friend) + '</dd>' : ''}${p ? '<dt>In a word</dt><dd>' + escape(p.title) + ' · ' + p.traits.map(escape).join(', ') + '</dd><dt>Ambition</dt><dd>' + escape(p.ambition) + '</dd>' : ''}</dl>
          </details>
          ${r.start != null || r.always ? '<p class="duty"><span class="flag"></span></p>' : ''}
        </div>
      </article>`;
    }).join("");
  }

  const catalogueSearch=document.getElementById('residentSearch');
  catalogueSearch?.addEventListener('input',()=>{const fold=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),q=fold(catalogueSearch.value.trim());let n=0;rollGrid.querySelectorAll('[data-resident]').forEach(card=>{const r=RESIDENTS.find(r=>r.name===card.dataset.resident);card.hidden=!fold([r.name,r.role,r.place,r.article?.headline||'',r.home?.address,...r.home?.residents||[],...(r.secondaryHomes||[]).map(h=>h.address)].join(' ')).includes(q);if(!card.hidden)n++;});document.getElementById('catalogueCount').textContent=`${n} residents`;});
  function tick() {
    if (start.classList.contains("hidden")) return;
    const now = Date.now();
    const minutes = currentMinutes(now);
    const scheduled = PLACES.filter((p) => p.open != null);
    const openCount = scheduled.filter((p) => isOpen(p, minutes)).length;
    const period = periodOf(minutes);
    const night = period === "NIGHT" || period === "EVENING";

    digital.textContent = fmtS(minutes);
    periodEl.textContent = period;
    lineEl.textContent = periodLine(minutes);
    shopsEl.textContent = `SHOPS ${pad(openCount)}/${pad(scheduled.length)} OPEN · HARBOUR DISTRICT TIME`;
    liveEl.textContent = mode === "live" ? "LIVE · VISITOR CLOCK" : `SET CLOCK · ${speed}×`;
    statusPeriod.textContent = period;
    statusPeriod.classList.toggle("alert", night);
    statusShops.textContent = `${openCount} open`;
    statusShops.classList.toggle("alert", openCount === 0);
    hoursHead.textContent = `${fmtS(minutes)} · ${period}`;

    const civic = townDate(now);
    if (statusWeekday) statusWeekday.textContent = civic.weekday;
    if (boardDoc) boardDoc.textContent = `Document ${civic.documentNo}`;
    if (boardDateLong) boardDateLong.textContent = civic.eraLine;
    if (boardDateShort) boardDateShort.textContent = civic.short;
    if (boardWeekdayLine) boardWeekdayLine.textContent = civic.weekdayLine;
    if (noticeWhen) noticeWhen.textContent = `Posted this ${civic.weekday}`;
    if (boardJpDate) boardJpDate.textContent = civic.japanese;

    const analogSeconds = (minutes * 60) % 60;
    const analogMinutes = minutes % 60;
    const analogHours = (minutes / 60) % 12;
    hourHand.setAttribute("transform", `rotate(${analogHours * 30} 100 100)`);
    minuteHand.setAttribute("transform", `rotate(${analogMinutes * 6} 100 100)`);
    secondHand.setAttribute("transform", `rotate(${analogSeconds * 6} 100 100)`);

    hoursBody.querySelectorAll("tr").forEach((row) => {
      const place = PLACES.find((p) => p.id === row.dataset.place);
      const open = isOpen(place, minutes);
      const cell = row.querySelector(".now-cell");
      cell.innerHTML = `<span class="${open ? "tag-open" : "tag-closed"}">${open ? "OPEN" : "CLOSED"}</span>`;
    });
    rollGrid.querySelectorAll("[data-resident]").forEach((card) => {
      const r = RESIDENTS.find((x) => x.name === card.dataset.resident);
      const flag = card.querySelector(".flag");
      if (!flag) return;
      const duty = onDuty(r, minutes);
      flag.textContent = duty ? "ON DUTY" : "OFF";
      flag.parentElement.classList.toggle("on", duty);
    });
  }

  function ticks() {
    const g = $("clockTicks");
    let html = "";
    for (let i = 0; i < 60; i += 1) {
      const major = i % 5 === 0;
      html += `<line x1="100" y1="${major ? 18 : 14}" x2="100" y2="${major ? 32 : 22}" stroke="currentColor" stroke-width="${major ? 4 : 1.6}" transform="rotate(${i * 6} 100 100)"/>`;
    }
    g.innerHTML = html;
  }

  function showSetting() {
    document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.clockMode === mode));
    });
    document.querySelectorAll("[data-clock-speed]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(Number(btn.dataset.clockSpeed) === speed));
      btn.disabled = mode === "live";
    });
    const speeds = document.querySelector(".clock-speeds");
    if (speeds) speeds.classList.toggle("locked", mode === "live");
    const note = $("clockChoiceNote");
    if (note) note.textContent = mode === "live"
      ? "LIVE: the town keeps your device's time, date and weekday. Life in Minato follows the 1990s. Pick a start time to set the clock yourself; it can then run faster."
      : `The town will open at ${mode === "saved" ? "the time you left it" : mode.slice(0, 2) + ":" + mode.slice(2)} and run at ${speed === 1 ? "real pace" : speed + "× speed"}. Change it any time from the TIME button.`;
  }
  document.querySelectorAll("[data-clock-mode]").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.clockMode));
  });
  document.querySelectorAll("[data-clock-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (mode === "live") return;
      const now = Date.now(), shown = currentMinutes(now);
      speed = Number(btn.dataset.clockSpeed);
      runOrigin = { real: now, minutes: shown };
      writeSetting(); showSetting(); tick();
    });
  });
  showSetting();
  document.addEventListener("keydown", (event) => {
    if (event.key !== "n" && event.key !== "N") return;
    if (start.classList.contains("hidden")) return;
    const target = event.target;
    if (target && target.closest && target.closest("input, textarea, [contenteditable]")) return;
    event.preventDefault();
    setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
  });

  document.querySelectorAll('a[href="#visit-planning"]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('visit-planning').open=true;}));
  renderStatic();
  // The town feed loads with the guide, not the title screen: it brings the avatar renderer.
  const feedList=document.getElementById("townFeed");let feedMounted=false;
  const mountFeed=()=>{if(feedMounted||!start.classList.contains("guide-open"))return;feedMounted=true;import(window.JOHANSSON_FEED_MODULE || "./src/feed/mount.js").then(m=>m.mountTownFeed({list:feedList,more:document.getElementById("feedMore")})).catch(error=>{feedMounted=false;console.warn("Town feed:",error.message);});};
  if(feedList){new MutationObserver(mountFeed).observe(start,{attributes:true,attributeFilter:["class"]});mountFeed();}
  import(window.JOHANSSON_PORTRAIT_MODULE || "./src/avatars/guide-portraits.js").then(m=>m.mountResidentPortraits()).catch(error=>console.warn("Resident portraits:",error.message));
  ticks();
  tick();
  setInterval(tick, 1000);
})();
