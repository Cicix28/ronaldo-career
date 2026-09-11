#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""自动更新 C罗 最新比赛数据（GitHub Actions 定时运行）。

数据源与站内历史数据同源：Transfermarkt ceapi（球员 8198）。
策略：只追加新比赛；任何失败都安全退出，不修改现有数据、不影响网站。
"""
import datetime
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # docs-deploy/
DATA_FILE = os.path.join(ROOT, "data", "matches.json")
API_URL = "https://www.transfermarkt.com/ceapi/performance-game/8198"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

CLUBS = {
    336:   {"club_zh": "葡萄牙体育", "club_en": "Sporting CP", "club_short": "葡体"},
    985:   {"club_zh": "曼联", "club_en": "Manchester United", "club_short": "曼联"},
    418:   {"club_zh": "皇家马德里", "club_en": "Real Madrid", "club_short": "皇马"},
    506:   {"club_zh": "尤文图斯", "club_en": "Juventus", "club_short": "尤文"},
    18544: {"club_zh": "利雅得胜利", "club_en": "Al-Nassr", "club_short": "利雅得"},
    3300:  {"club_zh": "葡萄牙", "club_en": "Portugal", "club_short": "葡萄牙"},
}

COMP = {
    "PO1":  ("葡超", "Liga Portugal", "league"),
    "POPO": ("葡杯", "Taça de Portugal", "cup"),
    "POSU": ("葡超杯", "Supercup Cândido de Oliveira", "supercup"),
    "CL":   ("欧冠", "UEFA Champions League", "europe"),
    "CLQ":  ("欧冠资格赛", "UEFA Champions League Qualifying", "europe"),
    "UEFA": ("欧联", "UEFA Cup", "europe"),
    "EL":   ("欧联", "UEFA Europa League", "europe"),
    "USC":  ("欧超杯", "UEFA Super Cup", "europe"),
    "GB1":  ("英超", "Premier League", "league"),
    "FAC":  ("足总杯", "FA Cup", "cup"),
    "CGB":  ("联赛杯", "EFL Cup", "cup"),
    "FCS":  ("社区盾", "FA Community Shield", "supercup"),
    "ES1":  ("西甲", "La Liga", "league"),
    "CDR":  ("国王杯", "Copa del Rey", "cup"),
    "SUC":  ("西超杯", "Supercopa de España", "supercup"),
    "IT1":  ("意甲", "Serie A", "league"),
    "CIT":  ("意杯", "Coppa Italia", "cup"),
    "SCI":  ("意超杯", "Supercoppa Italiana", "supercup"),
    "SA1":  ("沙特联", "Saudi Pro League", "league"),
    "KSC":  ("沙王杯", "King Cup of Champions", "cup"),
    "SSU":  ("沙超杯", "Saudi Super Cup", "supercup"),
    "ACL":  ("亚冠", "AFC Champions League", "asia"),
    "ACLE": ("亚冠精英", "AFC Champions League Elite", "asia"),
    "ACL2": ("亚冠2", "AFC Champions League Two", "asia"),
    "ACLQ": ("亚冠资格赛", "AFC Champions League Qualifying", "asia"),
    "KLUB": ("世俱杯", "FIFA Club World Cup", "clubworld"),
    "FIWC": ("世界杯", "FIFA World Cup", "national"),
    "WMQ":  ("世预赛", "FIFA World Cup qualification", "national"),
    "WCQ":  ("世预赛", "FIFA World Cup qualification", "national"),
    "EMQ":  ("欧预赛", "UEFA Euro qualifying", "national"),
    "ECQ":  ("欧预赛", "UEFA Euro qualifying", "national"),
    "EM":   ("欧洲杯", "UEFA Euro", "national"),
    "UNL":  ("欧国联", "UEFA Nations League", "national"),
    "CONF": ("联合会杯", "FIFA Confederations Cup", "national"),
    "FRF":  ("友谊赛", "Friendly", "national"),
}


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def to_int(value, default=0):
    try:
        return int(str(value).split("'")[0].strip())
    except Exception:
        return default


def iso_date(game_info):
    d = game_info.get("date") or {}
    raw = d.get("dateTimeUTC") or d.get("date") or ""
    return str(raw)[:10]


def season_label(season_id):
    try:
        y = int(season_id)
    except Exception:
        return ""
    return "%d/%02d" % (y, (y + 1) % 100)


def opponent_name(opponent, game_id):
    for key in ("name", "clubName", "shortName", "displayName", "nameFull"):
        value = opponent.get(key)
        if value:
            return str(value).strip()
    # 兜底：从比赛页标题里取对手名（仅新比赛时才访问一次）
    try:
        url = "https://www.transfermarkt.com/spielbericht/index/spielbericht/%s" % game_id
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        doc = urllib.request.urlopen(req, timeout=45).read().decode("utf-8", "replace")
        match = re.search(r"<title>(.*?)</title>", doc, re.S)
        if match:
            title = re.sub(r"<[^>]+>", " ", match.group(1))
            title = re.sub(r"\s+", " ", title).strip()
            parts = re.split(r"\s+(?:vs\.?|gegen|against)\s+", title, flags=re.I)
            if len(parts) >= 2:
                return parts[-1].strip()
    except Exception as exc:
        print("::warning::opponent lookup failed for game %s: %s" % (game_id, exc))
    return ""


def main():
    if not os.path.exists(DATA_FILE):
        print("::error::data file not found:", DATA_FILE)
        return 1
    data = json.load(open(DATA_FILE, encoding="utf-8"))
    matches = data.get("matches") or []
    intl = data.get("intlMatches") or []

    try:
        payload = fetch_json(API_URL)
    except Exception as exc:
        print("::warning::Transfermarkt ceapi unavailable, skip this run: %s" % exc)
        return 0
    if not payload.get("success"):
        print("::warning::ceapi returned success=false, skip this run")
        return 0

    existing = set((m.get("date"), m.get("club_zh"), m.get("opponent")) for m in matches + intl)
    added_club = []
    added_intl = []
    for perf in payload.get("data", {}).get("performance", []):
        try:
            info = perf.get("gameInformation") or {}
            stats = perf.get("statistics") or {}
            general = (stats.get("generalStatistics") or {})
            if general.get("participationState") != "played":
                continue
            clubs = perf.get("clubsInformation") or {}
            club = clubs.get("club") or {}
            opponent = clubs.get("opponent") or {}
            club_id = club.get("clubId")
            club_info = CLUBS.get(club_id)
            if not club_info:
                continue
            date = iso_date(info)
            game_id = info.get("gameId")
            opp = opponent_name(opponent, game_id)
            if not date or not game_id or not opp:
                continue
            venue = "H" if club.get("venue") == "home" else "A"
            cg = to_int(club.get("goalsTotal"))
            og = to_int(opponent.get("goalsTotal"))
            gf, ga = (cg, og) if venue == "H" else (og, cg)
            res = "W" if gf > ga else "D" if gf == ga else "L"
            goal_stats = stats.get("goalStatistics") or {}
            play = stats.get("playingTimeStatistics") or {}
            goals = to_int(goal_stats.get("goalsScoredTotal"))
            assists = to_int(goal_stats.get("assists"))
            mins = to_int(play.get("playedMinutes"))
            comp_code = str(info.get("competitionId") or "")
            comp_zh, comp_en, cat = COMP.get(comp_code, (comp_code or "其他", comp_code or "Other", "other"))
            key = (date, club_info["club_zh"], opp)
            if key in existing:
                continue
            existing.add(key)
            if club_info["club_zh"] == "葡萄牙":
                added_intl.append({
                    "cap": len(intl) + len(added_intl) + 1,
                    "date": date, "venue": venue, "opponent": opp,
                    "gf": gf, "ga": ga, "res": res,
                    "goals": goals, "assists": assists, "mins": mins,
                    "comp_en": comp_en, "cat": comp_zh,
                })
            else:
                added_club.append({
                    "id": "tm-%s-%s-%s" % (date, club_info["club_short"], game_id),
                    "date": date, "season": season_label(info.get("seasonId")),
                    "round": str(info.get("gameDay") or ""),
                    "comp": comp_code, "comp_zh": comp_zh, "comp_en": comp_en, "cat": cat,
                    "club_zh": club_info["club_zh"], "club_en": club_info["club_en"],
                    "club_short": club_info["club_short"], "opponent": opp,
                    "venue": venue, "gf": gf, "ga": ga, "res": res,
                    "goals": goals, "assists": assists, "mins": mins,
                    "yc": to_int((stats.get("cardStatistics") or {}).get("yellowCardNet")), "rc": 0,
                })
        except Exception as exc:
            print("::warning::skip malformed performance: %s" % exc)

    if not added_club and not added_intl:
        print("No new matches. Nothing to update.")
        return 0

    added_club.sort(key=lambda m: (m["date"], m["club_zh"]))
    added_intl.sort(key=lambda m: m["date"])
    matches.extend(added_club)
    matches.sort(key=lambda m: (m["date"], m.get("club_zh", "")))
    intl.extend(added_intl)
    intl.sort(key=lambda m: m["date"])
    for i, rec in enumerate(intl, 1):
        rec["cap"] = i

    career = (data.get("player") or {}).get("career") or {}
    club_goals = sum(m.get("goals", 0) for m in added_club)
    club_assists = sum(m.get("assists", 0) for m in added_club)
    intl_goals = sum(m.get("goals", 0) for m in added_intl)
    intl_assists = sum(m.get("assists", 0) for m in added_intl)
    for key, delta in (
        ("clubApps", len(added_club)), ("clubGoals", club_goals), ("clubAssists", club_assists),
        ("natCaps", len(added_intl)), ("natGoals", intl_goals), ("natAssists", intl_assists),
        ("detailTotalApps", len(added_club) + len(added_intl)),
        ("detailTotalGoals", club_goals + intl_goals),
        ("detailTotalAssists", club_assists + intl_assists),
        ("wikiApps", len(added_club) + len(added_intl)),
        ("wikiGoals", club_goals + intl_goals),
        ("wikiClubApps", len(added_club)), ("wikiClubGoals", club_goals),
    ):
        career[key] = to_int(career.get(key)) + delta
    data["matches"] = matches
    data["intlMatches"] = intl
    data.setdefault("player", {})["career"] = career
    data["player"]["updated"] = datetime.date.today().isoformat()

    with open(DATA_FILE, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    print("Added %d club matches, %d national caps." % (len(added_club), len(added_intl)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
