"""
뉴스 감성 분석 (NLP)
- 뉴스 수집: Finnhub → Newsdata.io → Alpha Vantage (로테이션 + TTL 6시간 캐시)
- DNS 문제 방지: aiohttp 대신 requests 라이브러리 사용 (시스템 DNS 사용)
- 분석: FinBERT (transformers 설치 시) / 키워드 폴백

API 키 설정 (config/settings.yaml):
  news.finnhub_key / news.newsdata_key / news.alphavantage_key
  또는 환경변수: FINNHUB_API_KEY / NEWSDATA_API_KEY / ALPHAVANTAGE_API_KEY
"""
import json
import os
import re
import asyncio
import requests as req_lib          # aiohttp 대신 requests (DNS 안정적)
from pathlib import Path
from datetime import datetime, timedelta
from analyzer.base import BaseAnalyzer, AnalysisResult
from core.logger import log
from config import get

# ═══════════════════════════════════════════
# 캐시 설정
# ═══════════════════════════════════════════
_CACHE_FILE = Path(__file__).parent.parent / "data" / "news_cache.json"
_CACHE_TTL_HOURS = 6   # 6시간 캐시


def _load_cache() -> dict | None:
    """캐시 파일 읽기 (TTL 초과 시 None 반환)"""
    try:
        if not _CACHE_FILE.exists():
            return None
        data = json.loads(_CACHE_FILE.read_text(encoding="utf-8"))
        saved_at = datetime.fromisoformat(data.get("saved_at", "2000-01-01"))
        if datetime.now() - saved_at > timedelta(hours=_CACHE_TTL_HOURS):
            log.info("📰 뉴스 캐시 만료 → 새로 수집")
            return None
        remaining = _CACHE_TTL_HOURS - (datetime.now() - saved_at).seconds // 3600
        log.info(f"📰 뉴스 캐시 사용 ({remaining}시간 후 갱신) | "
                 f"영어 {len(data.get('en', []))}개 + 한국어 {len(data.get('kr', []))}개")
        return data
    except Exception:
        return None


def _save_cache(en: list[str], kr: list[str], source: str) -> None:
    """캐시 파일 저장"""
    try:
        _CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        _CACHE_FILE.write_text(json.dumps({
            "saved_at": datetime.now().isoformat(),
            "source": source,
            "en": en,
            "kr": kr,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning(f"뉴스 캐시 저장 실패: {e}")


# ═══════════════════════════════════════════
# FinBERT 모델 로더 (Lazy — 첫 호출 시 1번만 로딩)
# ═══════════════════════════════════════════

_USE_FINBERT = None
_EN_MODEL = None
_EN_TOKENIZER = None
_KR_MODEL = None
_KR_TOKENIZER = None


def _check_finbert_available() -> bool:
    global _USE_FINBERT
    if _USE_FINBERT is not None:
        return _USE_FINBERT
    try:
        import transformers  # noqa: F401
        import torch         # noqa: F401
        _USE_FINBERT = True
        log.info("✅ FinBERT 사용 가능")
    except ImportError:
        _USE_FINBERT = False
        log.warning("⚠️ transformers 미설치 → 키워드 기반 폴백 모드")
    return _USE_FINBERT


def _load_en_model():
    global _EN_MODEL, _EN_TOKENIZER
    if _EN_MODEL is not None:
        return _EN_MODEL, _EN_TOKENIZER
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    model_name = "ProsusAI/finbert"
    log.info(f"📥 영어 FinBERT 로딩: {model_name} ...")
    _EN_TOKENIZER = AutoTokenizer.from_pretrained(model_name)
    _EN_MODEL = AutoModelForSequenceClassification.from_pretrained(model_name)
    _EN_MODEL.eval()
    log.info("✅ 영어 FinBERT 로딩 완료")
    return _EN_MODEL, _EN_TOKENIZER


def _load_kr_model():
    global _KR_MODEL, _KR_TOKENIZER
    if _KR_MODEL is not None:
        return _KR_MODEL, _KR_TOKENIZER
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    model_name = "snunlp/KR-FinBert-SC"
    log.info(f"📥 한국어 KR-FinBert 로딩: {model_name} ...")
    _KR_TOKENIZER = AutoTokenizer.from_pretrained(model_name)
    _KR_MODEL = AutoModelForSequenceClassification.from_pretrained(model_name)
    _KR_MODEL.eval()
    log.info("✅ 한국어 KR-FinBert 로딩 완료")
    return _KR_MODEL, _KR_TOKENIZER


# ═══════════════════════════════════════════
# FinBERT 추론
# ═══════════════════════════════════════════

def _predict_sentiment(headlines: list[str], model, tokenizer) -> list[dict]:
    import torch
    if not headlines:
        return []
    results = []
    batch_size = 8
    for i in range(0, len(headlines), batch_size):
        batch = headlines[i:i + batch_size]
        inputs = tokenizer(batch, padding=True, truncation=True,
                           max_length=128, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        id2label = model.config.id2label
        for j in range(len(batch)):
            prob_list = probs[j].tolist()
            best_idx = prob_list.index(max(prob_list))
            label = id2label[best_idx].lower()
            results.append({
                "label": label,
                "score": prob_list[best_idx],
                "headline": batch[j][:60],
            })
    return results


# ═══════════════════════════════════════════
# 키워드 폴백
# ═══════════════════════════════════════════

POSITIVE_KW = {
    "rally", "surge", "bullish", "recovery", "growth", "record high",
    "beat", "upgrade", "gain", "soar", "optimism", "breakout",
    "상승", "호재", "신고가", "급등", "강세", "회복", "호조", "최고",
}
NEGATIVE_KW = {
    "crash", "plunge", "bearish", "recession", "crisis", "downgrade",
    "miss", "war", "sell-off", "slump", "fear", "collapse",
    "하락", "악재", "폭락", "위기", "금리인상", "약세", "급락", "손실",
}


def _keyword_fallback(headlines: list[str]) -> list[dict]:
    results = []
    for h in headlines:
        h_lower = h.lower()
        pos = any(kw in h_lower for kw in POSITIVE_KW)
        neg = any(kw in h_lower for kw in NEGATIVE_KW)
        if pos and not neg:
            label = "positive"
        elif neg and not pos:
            label = "negative"
        else:
            label = "neutral"
        results.append({"label": label, "score": 0.6, "headline": h[:60]})
    return results


# ═══════════════════════════════════════════
# 뉴스 API 수집 함수들 (requests 동기, executor로 비동기 래핑)
# ═══════════════════════════════════════════

_HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
_TIMEOUT = 10


def _sync_fetch_finnhub(api_key: str) -> tuple[list[str], list[str]]:
    """Finnhub 뉴스 수집 (동기)"""
    if not api_key:
        return [], []
    try:
        url = f"https://finnhub.io/api/v1/news?category=general&token={api_key}"
        r = req_lib.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        if r.status_code != 200:
            return [], []
        data = r.json()
        headlines = [
            item["headline"] for item in data
            if item.get("headline") and len(item["headline"]) > 10
        ][:25]
        log.info(f"✅ Finnhub 뉴스 {len(headlines)}개 수집")
        return headlines, []
    except Exception as e:
        log.warning(f"⚠️ Finnhub 실패: {e}")
        return [], []


def _sync_fetch_newsdata(api_key: str) -> tuple[list[str], list[str]]:
    """Newsdata.io 뉴스 수집 (동기)"""
    if not api_key:
        return [], []
    en_headlines, kr_headlines = [], []
    try:
        url = f"https://newsdata.io/api/1/news?apikey={api_key}&category=business&language=en&q=stock+market"
        r = req_lib.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            en_headlines = [
                item["title"] for item in data.get("results", [])
                if item.get("title") and len(item["title"]) > 10
            ][:20]
    except Exception as e:
        log.warning(f"⚠️ Newsdata 영어 실패: {e}")
    try:
        url = f"https://newsdata.io/api/1/news?apikey={api_key}&category=business&language=ko"
        r = req_lib.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            kr_headlines = [
                item["title"] for item in data.get("results", [])
                if item.get("title") and len(item["title"]) > 5
            ][:20]
    except Exception as e:
        log.warning(f"⚠️ Newsdata 한국어 실패: {e}")
    if en_headlines or kr_headlines:
        log.info(f"✅ Newsdata 뉴스 영어 {len(en_headlines)}개 + 한국어 {len(kr_headlines)}개 수집")
    return en_headlines, kr_headlines


def _sync_fetch_alphavantage(api_key: str) -> tuple[list[str], list[str]]:
    """Alpha Vantage 뉴스 수집 (동기)"""
    if not api_key:
        return [], []
    try:
        url = (f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT"
               f"&tickers=SPY,QQQ,TLT&apikey={api_key}&limit=20")
        r = req_lib.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        if r.status_code != 200:
            return [], []
        data = r.json()
        headlines = [
            item["title"] for item in data.get("feed", [])
            if item.get("title") and len(item["title"]) > 10
        ][:20]
        log.info(f"✅ Alpha Vantage 뉴스 {len(headlines)}개 수집")
        return headlines, []
    except Exception as e:
        log.warning(f"⚠️ Alpha Vantage 실패: {e}")
        return [], []


def _sync_fetch_rss(url: str) -> list[str]:
    """RSS 폴백 (동기)"""
    try:
        r = req_lib.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
        if r.status_code == 200:
            titles = re.findall(r"<title>(.*?)</title>", r.text)
            if len(titles) > 1:
                return titles[1:21]
    except Exception:
        pass
    return []


# ═══════════════════════════════════════════
# 메인 분석기
# ═══════════════════════════════════════════

class SentimentAnalyzer(BaseAnalyzer):
    """
    뉴스 감성 분석기
    - 뉴스 수집: Finnhub → Newsdata → Alpha Vantage 순서로 로테이션
    - TTL 6시간 캐시로 API 호출 최소화
    - 분석: FinBERT (설치 시) / 키워드 폴백
    """
    name = "sentiment"

    async def analyze(self) -> AnalysisResult:
        try:
            use_dl = _check_finbert_available()

            # ── 1. 뉴스 수집 (캐시 우선) ──
            en_headlines, kr_headlines = await self._get_headlines()
            total = len(en_headlines) + len(kr_headlines)

            if total == 0:
                log.warning("📰 뉴스 수집 전체 실패 → 키워드 폴백 (헤드라인 없음)")
                return self._neutral("뉴스 수집 실패 (모든 API 타임아웃)")

            log.info(f"📰 뉴스 분석 시작: 영어 {len(en_headlines)}개 + 한국어 {len(kr_headlines)}개")

            # ── 2. 감성 분석 ──
            all_results = []
            method = "keyword"

            if use_dl:
                method = "FinBERT"
                try:
                    if en_headlines:
                        en_model, en_tok = _load_en_model()
                        all_results.extend(_predict_sentiment(en_headlines, en_model, en_tok))
                    if kr_headlines:
                        kr_model, kr_tok = _load_kr_model()
                        all_results.extend(_predict_sentiment(kr_headlines, kr_model, kr_tok))
                except Exception as e:
                    log.warning(f"⚠️ FinBERT 추론 실패, 키워드 폴백: {e}")
                    method = "keyword(fallback)"
                    all_results = _keyword_fallback(en_headlines + kr_headlines)
            else:
                all_results = _keyword_fallback(en_headlines + kr_headlines)

            # ── 3. 종합 점수 계산 ──
            pos_count = sum(1 for r in all_results if r["label"] == "positive")
            neg_count = sum(1 for r in all_results if r["label"] == "negative")
            neu_count = sum(1 for r in all_results if r["label"] == "neutral")

            n = len(all_results) or 1
            score = (pos_count - neg_count) / n
            score = max(-1.0, min(1.0, score))

            avg_model_conf = sum(r["score"] for r in all_results) / n
            if method == "FinBERT":
                confidence = round(min(avg_model_conf * 0.85, 0.95), 2)
            else:
                confidence = 0.40

            if score > 0.15:
                regime = "bull"
            elif score < -0.15:
                regime = "bear"
            else:
                regime = "sideways"

            log.info(
                f"{'🧠' if 'FinBERT' in method else '🔤'} 감성 분석 [{method}] "
                f"| 긍정 {pos_count} / 부정 {neg_count} / 중립 {neu_count} "
                f"| 점수: {score:+.3f} | 확신도: {confidence:.0%}"
            )

            return AnalysisResult(
                name=self.name,
                score=round(score, 3),
                regime=regime,
                confidence=confidence,
                details={
                    "method": method,
                    "headlines_total": total,
                    "en_count": len(en_headlines),
                    "kr_count": len(kr_headlines),
                    "positive": pos_count,
                    "negative": neg_count,
                    "neutral": neu_count,
                    "avg_model_confidence": round(avg_model_conf, 3),
                    "top_results": sorted(all_results, key=lambda x: x["score"], reverse=True)[:5],
                },
                timestamp=datetime.now().isoformat(),
            )

        except Exception as e:
            log.error(f"감성 분석 오류: {e}")
            return self._neutral(str(e))

    def _neutral(self, reason: str) -> AnalysisResult:
        return AnalysisResult(
            name=self.name, score=0, regime="sideways",
            confidence=0, details={"error": reason},
            timestamp=datetime.now().isoformat(),
        )

    async def _get_headlines(self) -> tuple[list[str], list[str]]:
        """
        캐시 → Finnhub → Newsdata → AlphaVantage → RSS 순서로 수집
        requests(동기)를 executor로 감싸서 비동기처럼 실행 (DNS 안정적)
        """
        # 1. 캐시 확인
        cached = _load_cache()
        if cached:
            return cached.get("en", []), cached.get("kr", [])

        # API 키 로드
        finnhub_key  = get("news.finnhub_key", "") or os.environ.get("FINNHUB_API_KEY", "")
        newsdata_key = get("news.newsdata_key", "") or os.environ.get("NEWSDATA_API_KEY", "")
        av_key       = get("news.alphavantage_key", "") or os.environ.get("ALPHAVANTAGE_API_KEY", "")

        loop = asyncio.get_event_loop()

        # 2. Finnhub
        en, kr = await loop.run_in_executor(None, _sync_fetch_finnhub, finnhub_key)
        if en or kr:
            if not kr and newsdata_key:
                _, kr2 = await loop.run_in_executor(None, _sync_fetch_newsdata, newsdata_key)
                kr = kr2
            _save_cache(en, kr, "finnhub")
            return en, kr

        # 3. Newsdata
        en, kr = await loop.run_in_executor(None, _sync_fetch_newsdata, newsdata_key)
        if en or kr:
            _save_cache(en, kr, "newsdata")
            return en, kr

        # 4. Alpha Vantage
        en, kr = await loop.run_in_executor(None, _sync_fetch_alphavantage, av_key)
        if en or kr:
            _save_cache(en, kr, "alphavantage")
            return en, kr

        # 5. RSS 폴백
        log.warning("⚠️ 모든 뉴스 API 실패 → RSS 폴백 시도")
        rss_urls = [
            "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en",
            "https://news.google.com/rss/search?q=주식+ETF&hl=ko&gl=KR&ceid=KR:ko",
        ]
        en = await loop.run_in_executor(None, _sync_fetch_rss, rss_urls[0])
        kr = await loop.run_in_executor(None, _sync_fetch_rss, rss_urls[1])
        if en or kr:
            _save_cache(en, kr, "rss_fallback")
        return en[:20], kr[:20]

    # 하위 호환용 (사용 안 하지만 혹시 외부에서 호출할 경우 대비)
    async def _fetch_rss(self, session: object, url: str) -> list[str]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _sync_fetch_rss, url)

    async def _fetch_rss_fallback(self, session: object) -> tuple[list[str], list[str]]:
        loop = asyncio.get_event_loop()
        en = await loop.run_in_executor(None, _sync_fetch_rss,
             "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en")
        kr = await loop.run_in_executor(None, _sync_fetch_rss,
             "https://news.google.com/rss/search?q=주식+ETF&hl=ko&gl=KR&ceid=KR:ko")
        return en[:20], kr[:20]
