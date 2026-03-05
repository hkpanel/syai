/**
 * 한국투자증권 KIS Open API 모듈
 * - 토큰 자동 발급/갱신 (24시간 유효)
 * - 실전/모의투자 스위치
 * - 시세 조회, 잔고 조회, 주문 실행
 */

/* ─── 설정 ─── */
const KIS_APP_KEY = process.env.KIS_APP_KEY!;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET!;
const KIS_HTS_ID = process.env.KIS_HTS_ID!;
const KIS_ACCOUNT_NO = process.env.KIS_ACCOUNT_NO!; // "43861630-01"

// 실전 도메인 (나중에 모의투자 스위치 추가 가능)
const BASE_URL = "https://openapi.koreainvestment.com:9443";

/* ─── 토큰 캐시 (서버 메모리) ─── */
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp (ms)

/**
 * 접근 토큰 발급 (24시간 유효, 캐시 사용)
 */
export async function getAccessToken(): Promise<string> {
  // 만료 5분 전까지는 캐시된 토큰 재사용
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`KIS 토큰 발급 실패: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // 토큰 유효시간: 약 24시간 (응답의 expires_in은 초 단위)
  tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000;

  return cachedToken!;
}

/**
 * 공통 헤더 생성
 */
async function makeHeaders(trId: string): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey: KIS_APP_KEY,
    appsecret: KIS_APP_SECRET,
    tr_id: trId,
    custtype: "P", // 개인
  };
}

/**
 * hashkey 생성 (POST 주문 시 필요)
 */
async function getHashKey(body: Record<string, string>): Promise<string> {
  const res = await fetch(`${BASE_URL}/uapi/hashkey`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.HASH || "";
}

/* ══════════════════════════════════════
   1. 시세 조회
   ══════════════════════════════════════ */

export interface StockPrice {
  code: string;          // 종목코드
  name: string;          // 종목명
  price: number;         // 현재가
  change: number;        // 전일대비
  changeRate: number;    // 등락률(%)
  volume: number;        // 거래량
  high: number;          // 고가
  low: number;           // 저가
  open: number;          // 시가
  prevClose: number;     // 전일종가
}

/**
 * 현재가 조회 (국내주식)
 * tr_id: FHKST01010100
 */
export async function getPrice(stockCode: string): Promise<StockPrice> {
  const headers = await makeHeaders("FHKST01010100");
  const params = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: "J", // 주식
    FID_INPUT_ISCD: stockCode,
  });

  const res = await fetch(
    `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?${params}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`시세 조회 실패: ${res.status} ${err}`);
  }

  const data = await res.json();
  const o = data.output;

  return {
    code: stockCode,
    name: o.hts_kor_isnm || "",
    price: Number(o.stck_prpr) || 0,
    change: Number(o.prdy_vrss) || 0,
    changeRate: Number(o.prdy_ctrt) || 0,
    volume: Number(o.acml_vol) || 0,
    high: Number(o.stck_hgpr) || 0,
    low: Number(o.stck_lwpr) || 0,
    open: Number(o.stck_oprc) || 0,
    prevClose: Number(o.stck_prpr) - Number(o.prdy_vrss) || 0,
  };
}

/**
 * 복수 종목 현재가 조회 (한번에 여러 종목)
 */
export async function getPrices(codes: string[]): Promise<StockPrice[]> {
  // 한투 API는 초당 호출 제한이 있어서 순차 호출 + 약간의 딜레이
  const results: StockPrice[] = [];
  for (const code of codes) {
    try {
      const price = await getPrice(code);
      results.push(price);
    } catch (e) {
      console.error(`시세 조회 실패 [${code}]:`, e);
    }
    // 초당 20회 제한 대비 50ms 딜레이
    await new Promise(r => setTimeout(r, 50));
  }
  return results;
}

/* ══════════════════════════════════════
   2. 잔고 조회
   ══════════════════════════════════════ */

export interface Holding {
  code: string;          // 종목코드
  name: string;          // 종목명
  qty: number;           // 보유수량
  avgPrice: number;      // 평균매입가
  curPrice: number;      // 현재가
  evalAmt: number;       // 평가금액
  profitAmt: number;     // 평가손익
  profitRate: number;    // 수익률(%)
}

export interface Balance {
  holdings: Holding[];
  totalEval: number;      // 총 평가금액
  totalProfit: number;    // 총 평가손익
  totalProfitRate: number;// 총 수익률(%)
  cashBalance: number;    // 예수금(현금)
}

/**
 * 잔고 조회 (국내주식)
 * tr_id: TTTC8434R (실전) / VTTC8434R (모의)
 */
export async function getBalance(): Promise<Balance> {
  const [acntPrefix, acntSuffix] = KIS_ACCOUNT_NO.split("-");
  const headers = await makeHeaders("TTTC8434R");

  const params = new URLSearchParams({
    CANO: acntPrefix,
    ACNT_PRDT_CD: acntSuffix,
    AFHR_FLPR_YN: "N",
    OFL_YN: "",
    INQR_DVSN: "02",
    UNPR_DVSN: "01",
    FUND_STTL_ICLD_YN: "N",
    FNCG_AMT_AUTO_RDPT_YN: "N",
    PRCS_DVSN: "01",
    CTX_AREA_FK100: "",
    CTX_AREA_NK100: "",
  });

  const res = await fetch(
    `${BASE_URL}/uapi/domestic-stock/v1/trading/inquire-balance?${params}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`잔고 조회 실패: ${res.status} ${err}`);
  }

  const data = await res.json();
  const output1 = data.output1 || []; // 보유종목 리스트
  const output2 = data.output2?.[0] || {}; // 계좌 요약

  const holdings: Holding[] = output1
    .filter((item: Record<string, string>) => Number(item.hldg_qty) > 0)
    .map((item: Record<string, string>) => ({
      code: item.pdno || "",
      name: item.prdt_name || "",
      qty: Number(item.hldg_qty) || 0,
      avgPrice: Number(item.pchs_avg_pric) || 0,
      curPrice: Number(item.prpr) || 0,
      evalAmt: Number(item.evlu_amt) || 0,
      profitAmt: Number(item.evlu_pfls_amt) || 0,
      profitRate: Number(item.evlu_pfls_rt) || 0,
    }));

  return {
    holdings,
    totalEval: Number(output2.tot_evlu_amt) || 0,
    totalProfit: Number(output2.evlu_pfls_smtl_amt) || 0,
    totalProfitRate:
      Number(output2.tot_evlu_amt) > 0
        ? (Number(output2.evlu_pfls_smtl_amt) / Number(output2.pchs_amt_smtl_amt)) * 100
        : 0,
    cashBalance: Number(output2.dnca_tot_amt) || 0,
  };
}

/* ══════════════════════════════════════
   3. 주문 (매수/매도)
   ══════════════════════════════════════ */

export interface OrderResult {
  success: boolean;
  orderNo: string;      // 주문번호
  message: string;
}

/**
 * 주식 현금 주문
 * @param side "BUY" | "SELL"
 * @param code 종목코드
 * @param qty 수량
 * @param price 가격 (0이면 시장가)
 * 
 * tr_id:
 *   실전 매수: TTTC0802U / 매도: TTTC0801U
 *   모의 매수: VTTC0802U / 매도: VTTC0801U
 */
export async function placeOrder(
  side: "BUY" | "SELL",
  code: string,
  qty: number,
  price: number = 0
): Promise<OrderResult> {
  const trId = side === "BUY" ? "TTTC0802U" : "TTTC0801U";
  const [acntPrefix, acntSuffix] = KIS_ACCOUNT_NO.split("-");

  const body: Record<string, string> = {
    CANO: acntPrefix,
    ACNT_PRDT_CD: acntSuffix,
    PDNO: code,
    ORD_DVSN: price === 0 ? "01" : "00", // 01=시장가, 00=지정가
    ORD_QTY: String(qty),
    ORD_UNPR: String(price),
  };

  const hashkey = await getHashKey(body);
  const headers = await makeHeaders(trId);
  headers["hashkey"] = hashkey;

  const res = await fetch(
    `${BASE_URL}/uapi/domestic-stock/v1/trading/order-cash`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (data.rt_cd === "0") {
    return {
      success: true,
      orderNo: data.output?.ODNO || "",
      message: data.msg1 || "주문 성공",
    };
  } else {
    return {
      success: false,
      orderNo: "",
      message: data.msg1 || `주문 실패: ${data.msg_cd}`,
    };
  }
}

/* ══════════════════════════════════════
   4. ETF 일봉 데이터 (백테스트용)
   ══════════════════════════════════════ */

export interface DailyCandle {
  date: string;       // YYYYMMDD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 국내주식 기간별 시세 (일봉)
 * tr_id: FHKST03010100
 * 최대 100건씩 조회
 */
export async function getDailyCandles(
  stockCode: string,
  startDate: string,   // YYYYMMDD
  endDate: string      // YYYYMMDD
): Promise<DailyCandle[]> {
  const headers = await makeHeaders("FHKST03010100");
  const params = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: "J",
    FID_INPUT_ISCD: stockCode,
    FID_INPUT_DATE_1: startDate,
    FID_INPUT_DATE_2: endDate,
    FID_PERIOD_DIV_CODE: "D", // 일봉
    FID_ORG_ADJ_PRC: "0",    // 수정주가 미반영 (1이면 반영)
  });

  const res = await fetch(
    `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?${params}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`일봉 조회 실패: ${res.status} ${err}`);
  }

  const data = await res.json();
  const output2 = data.output2 || [];

  return output2.map((item: Record<string, string>) => ({
    date: item.stck_bsop_date,
    open: Number(item.stck_oprc) || 0,
    high: Number(item.stck_hgpr) || 0,
    low: Number(item.stck_lwpr) || 0,
    close: Number(item.stck_clpr) || 0,
    volume: Number(item.acml_vol) || 0,
  }));
}
