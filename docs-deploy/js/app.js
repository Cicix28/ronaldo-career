/* C罗 生涯比赛记录 — app.js */
(function () {
  "use strict";

  var DATA = window.CAREER_DATA || null;
  var M = DATA ? DATA.matches : [];
  var PLAYER = DATA ? DATA.player : {};

  var CLUB_ACC = {
    "葡萄牙体育": { c: "#2e9e5b", c2: "#93d8b0", m: "体" },
    "皇家马德里": { c: "#c8a24a", c2: "#f5d97e", m: "皇" },
    "尤文图斯": { c: "#aeb9c9", c2: "#e8eef6", m: "尤" },
    "曼联": { c: "#e0442c", c2: "#ff9b87", m: "曼" },
    "利雅得胜利": { c: "#4f9cd6", c2: "#a5d3f5", m: "胜" },
    "葡萄牙": { c: "#4c9e5a", c2: "#9bd9a5", m: "葡" }
  };

  var PHOTO_CREDITS = [
    { file: "assets/img/hero.jpg", label: "英雄背景 · 葡萄牙（2025）", author: "YantsImages", lic: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_0876.jpg" },
    { file: "assets/img/avatar.jpg", label: "头像 · 皇家马德里", author: "Jan S0L0", lic: "CC BY-SA 2.0", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_RM_3.jpg" },
    { file: "assets/img/madrid.jpg", label: "图集 · 2014 金球奖", author: "Anish Morarji", lic: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_-_Ballon_d%27Or.jpg" },
    { file: "assets/img/juve.jpg", label: "图集 · 尤文图斯（2019/20）", author: "IamAlwaysHere", lic: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:2019-20_Serie_A_-_Torino_v_Juventus_-_Cristiano_Ronaldo.jpg" },
    { file: "assets/img/alnassr.jpg", label: "图集 · 利雅得胜利（2023）", author: "Mehrdad Esfahani/SNN", lic: "Attribution", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_in_Al_Nassr_in_2023.jpg" },
    { file: "assets/img/manutd.jpg", label: "首页轮播 · 曼联（vs 切尔西）", author: "Ray Booysen", lic: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Ronaldo_-_Manchester_United_vs_Chelsea.jpg" },
    { file: "assets/img/madrid_cl.jpg", label: "首页轮播 · 皇家马德里（2011 欧冠）", author: "Addesolen", lic: "CC0", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ajax.jpg" },
    { file: "assets/img/madrid2018.jpg", label: "首页轮播 · 皇家马德里（2018）", author: "Антон Зайцев", lic: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Ronaldo_in_2018.jpg" },
    { file: "assets/img/alnassr2.jpg", label: "首页轮播 · 利雅得胜利（2023）", author: "Mehdi Marizad", lic: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_in_2023.jpg" }
  ];
  var HERO_PHOTOS = [
    "assets/img/manutd.jpg",
    "assets/img/madrid_cl.jpg",
    "assets/img/madrid.jpg",
    "assets/img/madrid2018.jpg",
    "assets/img/juve.jpg",
    "assets/img/alnassr.jpg",
    "assets/img/alnassr2.jpg",
    "assets/img/hero.jpg"
  ];
  var PAGE_SIZE = 50;

  var state = {
    club: "all", season: "all", comp: "all", result: "all",
    search: "", sortKey: "date", sortDir: -1, page: 1
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $id(id) { return document.getElementById(id); }

  /* ---------- tab switching ---------- */
  function initTabs() {
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
        $id("view-" + t.dataset.view).classList.add("active");
        playViewEntrance(t.dataset.view);
      });
    });
  }

  /* ---------- overview ---------- */
  function sum(arr, f) { return arr.reduce(function (a, x) { return a + (f(x) || 0); }, 0); }

  function renderOverview() {
    var c = (PLAYER.career || {});
    $id("hero-note").textContent =
      "逐场明细（Transfermarkt）：俱乐部 " + c.clubApps + " 场 · " + c.clubGoals + " 球 · " + c.clubAssists + " 助攻；国家队 " + c.natCaps + " 场出场 · " + c.natGoals + " 球（含全部出场）\n" +
      "生涯总口径（" + (c.wikiAsOf || "Wikipedia") + "）：总出场 " + c.wikiApps + " · 总进球 " + c.wikiGoals + "\n" +
      "差额说明：Wikipedia 另计入葡萄牙体育 B 队 2 场（0 球）与 2023 阿拉伯俱乐部冠军杯 6 场 6 球（Transfermarkt 未逐场收录），故逐场明细合计为 " + c.detailTotalApps + " 场 · " + c.detailTotalGoals + " 球 · " + c.detailTotalAssists + " 助攻。";
    var icons = ["🏆", "⚽", "🇵🇹", "🥅", "🎯", "📋", "📊", "🅰"];
    var stats = [
      { n: c.wikiApps, l: "总出场（生涯）" },
      { n: c.wikiGoals, l: "总进球（生涯）" },
      { n: c.natCaps, l: "国家队出场" },
      { n: c.natGoals, l: "国家队进球" },
      { n: c.wikiClubGoals, l: "俱乐部进球（生涯口径）" },
      { n: c.detailTotalApps, l: "逐场·合计出场" },
      { n: c.detailTotalGoals, l: "逐场·合计进球" },
      { n: c.detailTotalAssists, l: "逐场·总助攻" }
    ];
    $id("stat-grid").innerHTML = stats.map(function (x, i) {
      return '<div class="stat"><div class="ico">' + (icons[i] || "") + '</div><div class="num">' + x.n + '</div><div class="lbl">' + x.l + "</div></div>";
    }).join("");

    renderClubs();
    renderSeasonChart();
    renderCompChart();
    renderMilestones();
  }

  function renderClubs() {
    var byClub = {};
    M.forEach(function (m) {
      var k = m.club_zh;
      if (!byClub[k]) byClub[k] = { name: k, en: m.club_en, short: m.club_short, ms: [] };
      byClub[k].ms.push(m);
    });
    var html = Object.keys(byClub).map(function (k) {
      var c = byClub[k];
      var ms = c.ms;
      var dates = ms.map(function (m) { return m.date; }).sort();
      var range = (dates[0] || "").slice(0, 4) + " → " + (dates[dates.length - 1] || "").slice(0, 4);
      var g = sum(ms, function (m) { return m.goals; });
      var a = sum(ms, function (m) { return m.assists; });
      var acc = CLUB_ACC[c.name] || { c: "#e6c15c", c2: "#f7df94", m: (c.short || "C").charAt(0) };
      return '<div class="club-card" style="--acc:' + acc.c + ";--acc2:" + acc.c2 + '">' +
        '<div class="cname"><span class="cmono">' + esc(acc.m) + "</span>" + esc(c.name) + "</div>" +
        '<div class="crange">' + esc(c.en) + " · " + range + "</div>" +
        '<div class="cstats">' +
        '<div><b>' + ms.length + "</b><span>出场</span></div>" +
        '<div><b>' + g + "</b><span>进球</span></div>" +
        '<div><b>' + a + "</b><span>助攻</span></div>" +
        "</div></div>";
    }).join("");
    $id("club-grid").innerHTML = html;
  }

  /* ---------- season chart (SVG) ---------- */
  function renderSeasonChart() {
    var bySeason = {};
    M.forEach(function (m) {
      var k = m.season || "未知";
      if (!bySeason[k]) bySeason[k] = { ms: [], goals: 0 };
      bySeason[k].ms.push(m);
      bySeason[k].goals += m.goals;
    });
    var keys = Object.keys(bySeason).sort(function (a, b) {
      return parseInt(a) - parseInt(b);
    });
    var maxM = 0, maxG = 0;
    keys.forEach(function (k) {
      maxM = Math.max(maxM, bySeason[k].ms.length);
      maxG = Math.max(maxG, bySeason[k].goals);
    });
    var W = 800, H = 250, padL = 30, padR = 14, padT = 16, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var n = keys.length;
    var slot = plotW / n;
    var barW = Math.max(10, slot * 0.42);
    var bars = "", line = "", dots = "";
    var yM = function (v) { return padT + plotH - (v / maxM) * plotH; };
    var yG = function (v) { return padT + plotH - (v / maxG) * plotH; };
    keys.forEach(function (k, i) {
      var cx = padL + slot * i + slot / 2;
      var d = bySeason[k];
      bars += '<rect x="' + (cx - barW / 2) + '" y="' + yM(d.ms.length) + '" width="' + barW +
        '" height="' + (padT + plotH - yM(d.ms.length)) + '" rx="3" fill="url(#gradM)" opacity="0.9">' +
        "<title>" + k + " 出场 " + d.ms.length + "</title></rect>";
      line += (i ? " L" : "M") + cx + " " + yG(d.goals);
      dots += '<circle cx="' + cx + '" cy="' + yG(d.goals) + '" r="3.2" fill="#e6c15c"><title>' + k + " 进球 " + d.goals + "</title></circle>";
      var lbl = k.split("/")[0];
      bars += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" font-size="10" fill="#8b93a7">' + lbl + "</text>";
    });
    var grid = "";
    for (var gy = 0; gy <= 4; gy++) {
      var yy = padT + (plotH / 4) * gy;
      grid += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy +
        '" stroke="#273049" stroke-width="1" opacity="0.5"/>';
    }
    $id("season-chart").innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '">' +
      "<defs><linearGradient id=\"gradM\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">" +
      '<stop offset="0%" stop-color="#e6c15c" stop-opacity="0.95"/>' +
      '<stop offset="100%" stop-color="#8a6a1f" stop-opacity="0.55"/></linearGradient></defs>' +
      grid + bars +
      '<path d="' + line + '" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + "</svg>" +
      '<div class="legend"><span><i style="background:#e6c15c"></i>出场（柱）</span><span><i style="background:#ffd166"></i>进球（线）</span></div>';
  }

  /* ---------- competition chart (CSS bars) ---------- */
  function renderCompChart() {
    var byComp = {};
    M.forEach(function (m) {
      var k = m.comp_zh;
      if (!byComp[k]) byComp[k] = { ms: 0, goals: 0 };
      byComp[k].ms++;
      byComp[k].goals += m.goals;
    });
    var keys = Object.keys(byComp).sort(function (a, b) { return byComp[b].ms - byComp[a].ms; });
    var maxMs = byComp[keys[0]].ms;
    var html = '<div class="chart">';
    keys.forEach(function (k) {
      var pct = Math.round((byComp[k].ms / maxMs) * 100);
      html += '<div style="margin:10px 0">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">' +
        "<span>" + esc(k) + " <span style='color:#8b93a7;font-size:11px'>· " + byComp[k].goals + " 球</span></span>" +
        '<span style="color:#e6c15c;font-weight:700">' + byComp[k].ms + "</span></div>" +
        '<div style="height:10px;background:#1c2337;border-radius:6px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#c89a2b,#f2d478);border-radius:6px"></div>' +
        "</div></div>";
    });
    html += "</div>";
    $id("comp-chart").innerHTML = html;
  }

  /* ---------- milestones ---------- */
  function renderMilestones() {
    var ordered = M.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var items = [];
    var cum = 0, cumA = 0, htDone = false;
    var first = ordered[0];
    if (first) items.push({ t: "首秀", d: first.date, s: first.club_short + " vs " + (first.opponent || "-") });
    ordered.forEach(function (m) {
      cum += m.goals; cumA += m.assists;
      if (m.goals >= 3 && !htDone) { items.push({ t: "第 1 个帽子戏法", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") + " · " + m.goals + " 球" }); htDone = true; }
      if (cum >= 100 && cum - m.goals < 100) items.push({ t: "俱乐部 100 球", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") });
      if (cum >= 200 && cum - m.goals < 200) items.push({ t: "俱乐部 200 球", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") });
      if (cum >= 300 && cum - m.goals < 300) items.push({ t: "俱乐部 300 球", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") });
      if (cum >= 400 && cum - m.goals < 400) items.push({ t: "俱乐部 400 球", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") });
      if (cumA >= 100 && cumA - m.assists < 100) items.push({ t: "俱乐部 100 助攻", d: m.date, s: m.club_short + " vs " + (m.opponent || "-") });
    });
    $id("milestones").innerHTML = items.map(function (it) {
      return '<div class="milestone"><b>' + esc(it.t) + "</b><p>" + esc(it.d) + " · " + esc(it.s) + "</p></div>";
    }).join("");
  }

  /* ---------- matches view ---------- */
  function initFilters() {
    var clubs = [], seasons = [], comps = [];
    M.forEach(function (m) {
      if (clubs.indexOf(m.club_zh) < 0) clubs.push(m.club_zh);
      if (m.season && seasons.indexOf(m.season) < 0) seasons.push(m.season);
      if (m.comp_zh && comps.indexOf(m.comp_zh) < 0) comps.push(m.comp_zh);
    });
    clubs.sort(); seasons.sort(function (a, b) { return parseInt(a) - parseInt(b); }); comps.sort();
    fillSelect($id("f-club"), clubs, "全部俱乐部");
    fillSelect($id("f-season"), seasons, "全部赛季");
    fillSelect($id("f-comp"), comps, "全部赛事");
    var res = [["W", "胜"], ["D", "平"], ["L", "负"]];
    $id("f-result").innerHTML = '<option value="all">全部结果</option>' +
      res.map(function (r) { return '<option value="' + r[0] + '">' + r[1] + "</option>"; }).join("");

    ["f-club", "f-season", "f-comp", "f-result"].forEach(function (id) {
      $id(id).addEventListener("change", function () { state[id.replace("f-", "")] = this.value; state.page = 1; renderMatches(); });
    });
    $id("f-search").addEventListener("input", function () { state.search = this.value.trim().toLowerCase(); state.page = 1; renderMatches(); });
    $id("f-reset").addEventListener("click", function () {
      ["f-club", "f-season", "f-comp", "f-result"].forEach(function (id) { $id(id).value = "all"; });
      $id("f-search").value = "";
      state.club = state.season = state.comp = state.result = "all"; state.search = "";
      state.sortKey = "date"; state.sortDir = -1; state.page = 1;
      renderMatches();
    });
    document.querySelectorAll("th[data-key]").forEach(function (th) {
      th.addEventListener("click", function () {
        var k = th.dataset.key;
        if (state.sortKey === k) state.sortDir = -state.sortDir; else { state.sortKey = k; state.sortDir = (k === "date") ? -1 : 1; }
        state.page = 1; renderMatches();
        document.querySelectorAll("th[data-key]").forEach(function (x) { x.classList.remove("sorted-asc", "sorted-desc"); });
        th.classList.add(state.sortDir === 1 ? "sorted-asc" : "sorted-desc");
      });
    });
  }

  function fillSelect(sel, arr, allLabel) {
    sel.innerHTML = '<option value="all">' + allLabel + "</option>" +
      arr.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
  }

  function filtered() {
    return M.filter(function (m) {
      if (state.club !== "all" && m.club_zh !== state.club) return false;
      if (state.season !== "all" && m.season !== state.season) return false;
      if (state.comp !== "all" && m.comp_zh !== state.comp) return false;
      if (state.result !== "all" && m.res !== state.result) return false;
      if (state.search) {
        var hay = (m.opponent + " " + (m.round || "") + " " + m.comp_en + " " + m.club_en).toLowerCase();
        if (hay.indexOf(state.search) < 0) return false;
      }
      return true;
    });
  }

  function sortRows(rows) {
    var k = state.sortKey, dir = state.sortDir;
    var val = function (m) {
      if (k === "date") return m.date;
      if (k === "goals") return m.goals;
      if (k === "assists") return m.assists;
      if (k === "mins") return m.mins == null ? -1 : m.mins;
      if (k === "score") return (m.gf == null ? -1 : m.gf) * 100 + (m.ga == null ? -1 : m.ga);
      if (k === "cards") return (m.yc || 0) * 100 + (m.rc || 0);
      if (k === "venue") return m.venue === "H" ? 0 : 1;
      if (k === "res") return { W: 0, D: 1, L: 2 }[m.res];
      return String(m[k] || "");
    };
    return rows.slice().sort(function (a, b) {
      var x = val(a), y = val(b);
      var c = (typeof x === "string" ? x.localeCompare(y) : x - y);
      return c * dir;
    });
  }

  function renderMatches() {
    var rows = sortRows(filtered());
    var total = rows.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var slice = rows.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    $id("filter-summary").textContent = "共 " + total + " 场 · 进球 " +
      sum(rows, function (m) { return m.goals; }) + " · 助攻 " + sum(rows, function (m) { return m.assists; });
    var html = slice.map(function (m) {
      var resCls = "result-" + (m.res || "?");
      var score = (m.gf == null || m.ga == null) ? "-" : m.gf + ":" + m.ga;
      var resLbl = m.res === "W" ? "胜" : m.res === "D" ? "平" : m.res === "L" ? "负" : "-";
      var venue = m.venue === "H" ? "主" : m.venue === "A" ? "客" : "-";
      var cards = "";
      if (m.yc) cards += '<span style="color:#f4c542" title="黄牌">' + m.yc + "</span>";
      if (m.rc) cards += (m.yc ? "/" : "") + '<span style="color:#ff6b6b" title="红牌">' + m.rc + "</span>";
      var gCls = m.goals >= 3 ? ' class="goal-hi"' : m.goals > 0 ? ' style="color:#e6c15c"' : "";
      return '<tr data-idx="' + M.indexOf(m) + '">' +
        "<td>" + esc(m.date) + "</td>" +
        "<td>" + esc(m.club_zh) + "</td>" +
        "<td>" + esc(m.comp_zh) + "</td>" +
        "<td>" + esc(m.opponent || "-") + "</td>" +
        "<td>" + venue + "</td>" +
        "<td>" + score + "</td>" +
        '<td class="' + resCls + '">' + resLbl + "</td>" +
        "<td" + gCls + ">" + m.goals + "</td>" +
        "<td>" + m.assists + "</td>" +
        "<td>" + (m.mins == null ? "-" : m.mins + "′") + "</td>" +
        "<td>" + (cards || "-") + "</td>" +
        "</tr>";
    }).join("");
    $id("match-body").innerHTML = html || '<tr><td colspan="11" style="text-align:center;color:#8b93a7;padding:30px">没有符合条件的比赛</td></tr>';
    // expanded rows / row click
    document.querySelectorAll("#match-body tr[data-idx]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var idx = +tr.dataset.idx;
        var m = M[idx];
        if (tr.nextElementSibling && tr.nextElementSibling.classList.contains("detail-row")) {
          tr.nextElementSibling.remove(); tr.classList.remove("expanded"); return;
        }
        document.querySelectorAll("#match-body tr.detail-row").forEach(function (d) { d.remove(); });
        document.querySelectorAll("#match-body tr.expanded").forEach(function (e) { e.classList.remove("expanded"); });
        tr.classList.add("expanded");
        var dtr = document.createElement("tr");
        dtr.className = "detail-row";
        dtr.innerHTML = '<td colspan="11"><div class="detail-inner">' +
          "<b>赛季</b> " + esc(m.season || "-") +
          " &nbsp;|&nbsp; <b>轮次</b> " + esc(m.round || "-") +
          " &nbsp;|&nbsp; <b>赛事</b> " + esc(m.comp_zh + " (" + m.comp_en + ")") +
          " &nbsp;|&nbsp; <b>出场</b> " + (m.mins == null ? "-" : m.mins + " 分钟") +
          " &nbsp;|&nbsp; <b>黄牌</b> " + (m.yc || 0) + " <b>红牌</b> " + (m.rc || 0) +
          "</div></td>";
        tr.after(dtr);
      });
    });
    renderPager(pages);
  }

  function renderPager(pages) {
    var p = $id("pager");
    var html = '<button data-p="prev"' + (state.page <= 1 ? " disabled" : "") + ">‹</button>";
    var around = [];
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - state.page) <= 2) around.push(i);
    }
    var last = 0;
    around.forEach(function (i) {
      if (i - last > 1) html += '<span class="pageinfo">…</span>';
      html += '<button data-p="' + i + '"' + (i === state.page ? ' class="on"' : "") + ">" + i + "</button>";
      last = i;
    });
    html += '<button data-p="next"' + (state.page >= pages ? " disabled" : "") + ">›</button>";
    html += '<span class="pageinfo">第 ' + state.page + " / " + pages + " 页</span>";
    p.innerHTML = html;
    p.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        var v = b.dataset.p;
        state.page = v === "prev" ? state.page - 1 : v === "next" ? state.page + 1 : +v;
        renderMatches();
      });
    });
  }

  /* ---------- about ---------- */
  function renderAbout() {
    var html =
      "<h2>数据来源</h2>" +
      "<ul><li><b>逐场明细</b>：Transfermarkt（2026-09-05 在线抓取）——俱乐部与国家队每一场的日期/对手/比分/个人数据</li>" +
      "<li><b>生涯合计 / 国家队进球逐粒</b>：Wikipedia（截至 2026-07）</li></ul>" +
      "<h2>当前收录范围</h2>" +
      "<ul><li>俱乐部逐场：<b>1094 场</b>——葡萄牙体育(2002/03)、曼联(2003–2009、2021–2022)、皇家马德里(2009–2018)、尤文图斯(2018–2021)、利雅得胜利(2023–2026)</li>" +
      "<li>国家队：<b>全部 233 场出场</b>（含未进球场次）+ <b>146 粒进球逐粒明细</b>（2003–2026）</li>" +
      "<li>赛事：各国联赛、国内杯赛/超级杯、欧冠/欧联/欧超杯、亚冠/亚冠精英/亚冠2、世俱杯、国家队全部赛事</li></ul>" +
      "<h2>口径说明（重要）</h2>" +
      "<ul><li>首页「总出场 1335 / 总进球 978」为 Wikipedia 生涯口径（截至 2026-07）；俱乐部合计 1102 场 832 球，国家队 233 场 146 球</li>" +
      "<li>逐场明细合计为 1327 场 / 972 球；差额为 Wikipedia 计入的葡萄牙体育 B 队 2 场（0 球）与 2023 阿拉伯俱乐部冠军杯 6 场 6 球（Transfermarkt 未逐场收录）</li>" +
      "<li>出场 = 有登场时间；比分/结果按 C罗 所在球队视角；点球大战场次显示点球比分（结果按晋级判定）；黄牌列按张数计</li></ul>" +
      "<h2>字段说明</h2>" +
      '<div class="kv">' +
      "<b>日期/赛季</b><span>比赛日期与所属赛季</span>" +
      "<b>赛事</b><span>联赛、杯赛、欧战、国家队赛事</span>" +
      "<b>比分/结果</b><span>按 C罗所在球队视角的主/客场比分与胜负平</span>" +
      "<b>进球/助攻</b><span>该场 C罗 的个人数据</span>" +
      "<b>时间</b><span>该场出场分钟数</span></div>" +
      "<h2>技术说明</h2>" +
      "<p>纯静态网页，无后端、无外部依赖，数据内嵌于 <code>data/data.js</code>（约 1094 场俱乐部 + 233 场国家队 + 146 粒进球明细），离线可直接打开 <code>index.html</code> 使用。</p>";
    $id("about-content").innerHTML = html;
  }

  /* ---------- photo credits ---------- */
  function renderCredits() {
    var html = PHOTO_CREDITS.map(function (p) {
      return '<div>· <b>' + esc(p.label) + "</b> — " + esc(p.author) +
        '（<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.lic) + "</a>）</div>";
    }).join("");
    var about = $id("photo-credits");
    if (about) about.innerHTML = html + '<div style="margin-top:6px">照片来自 <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a>，版权归原作者所有，按上方许可协议使用。</div>';
    var foot = $id("foot-credits");
    if (foot) foot.innerHTML = "照片 © 原作者（Wikimedia Commons，CC 授权）：" + PHOTO_CREDITS.map(function (p) { return p.author; }).join("、") + " — 许可详情见“数据说明”页";
  }


  /* ---------- GSAP animations ---------- */
  function playViewEntrance(view) {
    if (typeof gsap === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (view === "matches") {
      gsap.fromTo("#view-matches .filter-bar, #view-matches .table-wrap, #view-matches .pager",
        { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", overwrite: true });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    } else if (view === "intl") {
      gsap.fromTo("#view-intl .hero-intro, #view-intl .filter-bar, #view-intl .table-wrap",
        { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", overwrite: true });
    } else if (view === "about") {
      gsap.fromTo("#view-about .about-card", { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", overwrite: true });
    }
  }

  function initAnimations() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    function animateNumbers() {
      document.querySelectorAll("#stat-grid .stat .num").forEach(function (el) {
        var raw = el.textContent;
        var target = parseFloat(raw);
        if (isNaN(target)) return;
        var decimals = (raw.split(".")[1] || "").length;
        el.textContent = "0";
        var obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.5, ease: "power2.out", delay: 0.6,
          onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
        });
      });
    }

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-avatar", { scale: 0.4, autoAlpha: 0, duration: 0.9, ease: "back.out(1.7)" })
      .from(".hero-name h1", { y: 46, autoAlpha: 0, duration: 0.85 }, "-=0.45")
      .from(".hero-sub", { y: 22, autoAlpha: 0, duration: 0.6 }, "-=0.55")
      .from(".hero-no", { scale: 0, rotation: -45, autoAlpha: 0, duration: 0.7, ease: "back.out(2.4)" }, "-=0.4")
      .from(".hero-note", { y: 16, autoAlpha: 0, duration: 0.6 }, "-=0.35");
    tl.eventCallback("onComplete", function () {
      gsap.set(".hero-avatar, .hero-name h1, .hero-sub, .hero-no, .hero-note", { clearProps: "opacity,visibility,transform" });
    });

    gsap.to(".hero-avatar", { y: -8, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.4 });

    var tl2 = gsap.timeline({ delay: 0.35 });
    tl2.from("#view-overview .stat", { y: 34, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: "power3.out" })
       .add(function () { animateNumbers(); }, "-=0.2");
    tl2.eventCallback("onComplete", function () {
      gsap.set("#view-overview .stat", { clearProps: "opacity,visibility,transform" });
    });

    function reveal(sel) {
      var els = gsap.utils.toArray(sel);
      if (!els.length) return;
      gsap.fromTo(els, { autoAlpha: 0, y: 36 }, {
        autoAlpha: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.06,
        scrollTrigger: { trigger: els[0], start: "top 86%", once: true }
      });
    }
    reveal("#view-overview .block > .block-title");
    reveal("#view-overview .g-item");
    reveal("#view-overview .club-card");
    reveal("#view-overview .milestone");
    reveal("#view-overview .two-col .card");

    gsap.from("#view-overview #season-chart svg", {
      autoAlpha: 0, duration: 0.6,
      scrollTrigger: { trigger: "#view-overview #season-chart", start: "top 88%", once: true }
    });
    gsap.from("#view-overview #season-chart rect", {
      scaleY: 0, transformOrigin: "50% 100%", duration: 0.75, stagger: 0.05, ease: "power3.out",
      scrollTrigger: { trigger: "#view-overview #season-chart", start: "top 88%", once: true }
    });

  }

  /* ---------- hero slideshow ---------- */
  function initHeroSlides() {
    var host = $id("hero-slides");
    if (!host || !HERO_PHOTOS.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var track = document.createElement("div");
    track.className = "hero-track";
    HERO_PHOTOS.forEach(function (src) {
      var d = document.createElement("div");
      d.className = "hs";
      d.style.backgroundImage = "url('" + src + "')";
      track.appendChild(d);
    });
    host.appendChild(track);

    var dots = $id("hs-dots");
    var arrPrev = $id("hs-prev");
    var arrNext = $id("hs-next");
    var total = HERO_PHOTOS.length;
    var idx = 0;
    var timer = null;

    function place(i) {
      if (typeof gsap !== "undefined") {
        if (reduce) { gsap.set(track, { xPercent: -i * 100 }); }
        else { gsap.to(track, { xPercent: -i * 100, duration: 1.0, ease: "power3.inOut", overwrite: "auto" }); }
      } else {
        track.style.transform = "translateX(-" + i * 100 + "%)";
      }
    }
    function go(i) {
      if (i < 0) i = total - 1;
      if (i >= total) i = 0;
      idx = i;
      place(i);
      if (dots) {
        Array.prototype.forEach.call(dots.children, function (c, k) {
          c.classList.toggle("on", k === idx);
        });
      }
    }
    function startAuto() {
      stopAuto();
      if (reduce || total < 2) return;
      timer = setInterval(function () { go(idx + 1); }, 6000);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    if (dots) {
      for (var i = 0; i < total; i++) {
        (function (k) {
          var s = document.createElement("i");
          s.addEventListener("click", function () { go(k); startAuto(); });
          dots.appendChild(s);
        })(i);
      }
    }
    if (arrPrev) arrPrev.addEventListener("click", function () { go(idx - 1); startAuto(); });
    if (arrNext) arrNext.addEventListener("click", function () { go(idx + 1); startAuto(); });
    if (host.addEventListener) {
      host.addEventListener("mouseenter", stopAuto);
      host.addEventListener("mouseleave", startAuto);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto(); else startAuto();
    });

    go(0);
    startAuto();
  }

  /* ---------- national team caps (all appearances) ---------- */
  function renderIntlCaps() {
    var caps = (DATA && DATA.intlMatches) ? DATA.intlMatches : [];
    if (!caps.length) { return; }
    var years = [], cats = [];
    caps.forEach(function (r) {
      var y = r.date.slice(0, 4);
      if (years.indexOf(y) < 0) years.push(y);
      if (cats.indexOf(r.cat) < 0) cats.push(r.cat);
    });
    years.sort(); cats.sort();
    var cg = sum(caps, function (r) { return r.goals; });
    var ca = sum(caps, function (r) { return r.assists; });
    var box = $id("caps-stats");
    if (box) {
      box.innerHTML = [
        { n: caps.length, l: "国家队出场" },
        { n: cg, l: "国家队进球" },
        { n: ca, l: "国家队助攻" },
        { n: caps[0].date, l: "首秀日期" },
        { n: caps[caps.length - 1].date, l: "最近出场" },
        { n: (cg / caps.length).toFixed(3), l: "场均进球" }
      ].map(function (x) {
        return '<div class="stat"><div class="num" style="font-size:16px">' + esc(String(x.n)) + '</div><div class="lbl">' + x.l + "</div></div>";
      }).join("");
    }
    fillSelect($id("c-year"), years, "全部年份");
    fillSelect($id("c-cat"), cats, "全部赛事类型");
    var st = { year: "all", cat: "all", search: "" };
    function filtered() {
      return caps.filter(function (r) {
        if (st.year !== "all" && r.date.slice(0, 4) !== st.year) return false;
        if (st.cat !== "all" && r.cat !== st.cat) return false;
        if (st.search) {
          var hay = (r.opponent + " " + r.comp_en + " " + r.cat).toLowerCase();
          if (hay.indexOf(st.search) < 0) return false;
        }
        return true;
      });
    }
    function draw() {
      var rows = filtered();
      var sg = sum(rows, function (r) { return r.goals; });
      var el = $id("c-summary");
      if (el) el.textContent = "共 " + rows.length + " 场 · 进球 " + sg;
      var body = $id("caps-body");
      if (!body) return;
      body.innerHTML = rows.map(function (r) {
        var score = (r.gf == null || r.ga == null) ? "-" : r.gf + ":" + r.ga;
        var resLbl = r.res === "W" ? "胜" : r.res === "D" ? "平" : r.res === "L" ? "负" : "-";
        var ven = r.venue === "H" ? "主" : r.venue === "A" ? "客" : "-";
        var gCls = r.goals >= 3 ? ' class="goal-hi"' : r.goals > 0 ? ' style="color:#e6c15c"' : "";
        return "<tr>" +
          "<td>" + r.cap + "</td>" +
          "<td>" + esc(r.date) + "</td>" +
          "<td>" + ven + "</td>" +
          "<td>" + esc(r.opponent) + "</td>" +
          "<td>" + score + "</td>" +
          '<td class="result-' + (r.res || "?") + '">' + resLbl + "</td>" +
          "<td" + gCls + ">" + r.goals + "</td>" +
          "<td>" + r.assists + "</td>" +
          "<td>" + (r.mins == null ? "-" : r.mins + "′") + "</td>" +
          "<td>" + esc(r.cat + " · " + r.comp_en) + "</td>" +
          "</tr>";
      }).join("") || '<tr><td colspan="10" style="text-align:center;color:#8b93a7;padding:30px">没有符合条件的比赛</td></tr>';
    }
    var ids = { year: "c-year", cat: "c-cat", search: "c-search", reset: "c-reset" };
    $id(ids.year).addEventListener("change", function () { st.year = this.value; draw(); });
    $id(ids.cat).addEventListener("change", function () { st.cat = this.value; draw(); });
    $id(ids.search).addEventListener("input", function () { st.search = this.value.trim().toLowerCase(); draw(); });
    $id(ids.reset).addEventListener("click", function () {
      $id(ids.year).value = "all"; $id(ids.cat).value = "all"; $id(ids.search).value = "";
      st.year = "all"; st.cat = "all"; st.search = ""; draw();
    });
    draw();
  }

  /* ---------- international goals ---------- */
  function renderIntl() {
    var goals = (DATA && DATA.intlGoals) ? DATA.intlGoals : [];
    var tab = document.querySelector('.tab[data-view="intl"]');
    if (!goals.length) { if (tab) tab.style.display = "none"; return; }

    var byOpp = {};
    goals.forEach(function (g) { byOpp[g.opponent] = (byOpp[g.opponent] || 0) + 1; });
    var topOpp = Object.keys(byOpp).sort(function (a, b) { return byOpp[b] - byOpp[a]; })[0];
    var cats = [];
    goals.forEach(function (g) { if (cats.indexOf(g.cat) < 0) cats.push(g.cat); });
    var order = ["世界杯", "欧洲杯", "世预赛", "欧预赛", "欧国联", "联合会杯", "友谊赛", "其他"];
    cats.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    var years = [];
    goals.forEach(function (g) { var y = g.date.slice(0, 4); if (years.indexOf(y) < 0) years.push(y); });
    years.sort();
    var first = goals[0], last = goals[goals.length - 1];
    $id("intl-stats").innerHTML = [
      { n: goals.length, l: "国家队进球" },
      { n: first.date, l: "首球日期" },
      { n: last.date, l: "最近进球" },
      { n: byOpp[topOpp] + " · " + topOpp, l: "对阵最多" }
    ].map(function (x) {
      return '<div class="stat"><div class="num" style="font-size:15px">' + esc(x.n) + '</div><div class="lbl">' + x.l + "</div></div>";
    }).join("");
    fillSelect($id("i-cat"), cats, "全部赛事类型");
    fillSelect($id("i-year"), years, "全部年份");

    var st = { cat: "all", year: "all", search: "" };
    function filtered() {
      return goals.filter(function (g) {
        if (st.cat !== "all" && g.cat !== st.cat) return false;
        if (st.year !== "all" && g.date.slice(0, 4) !== st.year) return false;
        if (st.search) {
          var hay = (g.opponent + " " + g.competition + " " + g.venue).toLowerCase();
          if (hay.indexOf(st.search) < 0) return false;
        }
        return true;
      });
    }
    function draw() {
      var rows = filtered();
      $id("i-summary").textContent = "共 " + rows.length + " 粒进球";
      $id("intl-body").innerHTML = rows.map(function (g) {
        return "<tr>" +
          "<td>" + g.no + "</td>" +
          "<td>" + esc(g.date) + "</td>" +
          "<td>" + esc(g.opponent) + "</td>" +
          "<td>" + esc(g.goal_score) + "</td>" +
          "<td>" + esc(g.result) + "</td>" +
          "<td>" + esc(g.cat) + " · " + esc(g.competition) + "</td>" +
          "<td>" + esc(g.venue) + "</td>" +
          "</tr>";
      }).join("") || '<tr><td colspan="7" style="text-align:center;color:#8b93a7;padding:30px">没有符合条件的进球</td></tr>';
    }
    $id("i-cat").addEventListener("change", function () { st.cat = this.value; draw(); });
    $id("i-year").addEventListener("change", function () { st.year = this.value; draw(); });
    $id("i-search").addEventListener("input", function () { st.search = this.value.trim().toLowerCase(); draw(); });
    $id("i-reset").addEventListener("click", function () {
      $id("i-cat").value = "all"; $id("i-year").value = "all"; $id("i-search").value = "";
      st.cat = "all"; st.year = "all"; st.search = ""; draw();
    });
    var bsub = $id("intl-banner-sub");
    if (bsub) { var ncaps = (DATA && DATA.intlMatches) ? DATA.intlMatches.length : 0; bsub.textContent = (ncaps ? "共 " + ncaps + " 场出场 · " : "") + goals.length + " 粒进球（" + goals[0].date + " → " + goals[goals.length - 1].date + "）· 点击查看全部"; }
    var bb = $id("intl-banner");
    if (bb) bb.addEventListener("click", function () {
      var tb = document.querySelector('.tab[data-view="intl"]');
      if (tb) tb.click();
    });
    draw();
  }


  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!M.length) {
      document.body.insertAdjacentHTML("afterbegin", "<p style='color:#ff6b6b;padding:20px'>未找到数据（data/data.js）</p>");
      return;
    }
    initTabs();
    renderOverview();
    initFilters();
    renderMatches();
    renderAbout();
    renderCredits();
    renderIntlCaps();
    renderIntl();
    initHeroSlides();
    initAnimations();
  });
})();




