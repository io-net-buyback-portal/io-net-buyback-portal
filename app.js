/* =========================================================
   IO NETWORK — APP.JS
   Complete replacement
========================================================= */

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

let ioPrice = 0;
let bnbPrice = 0;
let ioSymbol = null;
let ioDecimals = 18;


/* =========================================================
   BASIC SELECTOR
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   BINANCE REQUEST
========================================================= */

async function binanceJSON(path) {

  const endpoints = [
    `https://api.binance.com${path}`,
    `https://data-api.binance.vision${path}`
  ];

  let lastError = null;

  for (const url of endpoints) {

    try {

      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {

      lastError = error;

    }

  }

  throw lastError ||
    new Error("Market request failed");
}


/* =========================================================
   FIND IO MARKET SYMBOL
========================================================= */

async function resolveIOSymbol() {

  const data =
    await binanceJSON(
      "/api/v3/exchangeInfo"
    );

  const symbols =
    Array.isArray(data.symbols)
      ? data.symbols
      : [];

  const match =
    symbols.find(symbol => {

      const base =
        String(symbol.baseAsset)
          .toUpperCase();

      const quote =
        String(symbol.quoteAsset)
          .toUpperCase();

      return (
        symbol.status === "TRADING" &&
        quote === "USDT" &&
        (
          base === "IO" ||
          base === "IONET"
        )
      );

    });

  if (!match) {
    throw new Error(
      "IO/USDT market pair was not found."
    );
  }

  return match.symbol;
}


/* =========================================================
   MARKET TICKER
========================================================= */

async function getTicker(symbol) {

  return binanceJSON(
    `/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`
  );

}


/* =========================================================
   FORMAT USD
========================================================= */

function formatUSD(value) {

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        value < 1 ? 4 : 2,
      maximumFractionDigits:
        value < 1 ? 4 : 2
    }
  ).format(value);

}


/* =========================================================
   FORMAT NUMBERS
========================================================= */

function formatNumber(value) {

  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(value);

}


/* =========================================================
   MARKET CHANGE
========================================================= */

function setChange(
  selector,
  value
) {

  const element =
    $(selector);

  if (!element) return;

  if (!Number.isFinite(value)) {

    element.textContent =
      "Market change unavailable";

    return;

  }

  const sign =
    value >= 0 ? "+" : "";

  element.textContent =
    `${sign}${value.toFixed(2)}% 24h`;

}


/* =========================================================
   LOAD MARKET PRICES
========================================================= */

async function loadPrices() {

  try {

    if (!ioSymbol) {

      ioSymbol =
        await resolveIOSymbol();

    }

    const [
      io,
      bnb
    ] = await Promise.all([

      getTicker(ioSymbol),

      getTicker("BNBUSDT")

    ]);

    ioPrice =
      Number(io.lastPrice);

    bnbPrice =
      Number(bnb.lastPrice);


    const ioPriceElement =
      $("#ioPrice");

    const bnbPriceElement =
      $("#bnbPrice");


    if (ioPriceElement) {

      ioPriceElement.textContent =
        formatUSD(ioPrice);

    }


    if (bnbPriceElement) {

      bnbPriceElement.textContent =
        formatUSD(bnbPrice);

    }


    setChange(
      "#ioChange",
      Number(io.priceChangePercent)
    );


    setChange(
      "#bnbChange",
      Number(bnb.priceChangePercent)
    );


    calculateAllocation();

  } catch (error) {

    console.warn(
      "Market data error:",
      error
    );

    if ($("#ioPrice")) {
      $("#ioPrice").textContent =
        "Unavailable";
    }

    if ($("#bnbPrice")) {
      $("#bnbPrice").textContent =
        "Unavailable";
    }

    calculateAllocation();

  }

}


/* =========================================================
   ALLOCATION CALCULATOR
========================================================= */

function calculateAllocation() {

  const input =
    $("#bnbAmount");

  const message =
    $("#calculatorMessage");

  if (!input || !message) {
    return;
  }

  const amount =
    Number(input.value);


  if (!amount) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Minimum 5 BNB · Maximum 500 BNB";

    return;
  }


  if (amount < MIN_BNB) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Minimum participation is 5 BNB.";

    return;
  }


  if (amount > MAX_BNB) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Maximum participation is 500 BNB.";

    return;
  }


  if (
    !ioPrice ||
    !bnbPrice
  ) {

    message.textContent =
      "Waiting for current market prices.";

    return;
  }


  const base =
    (amount * bnbPrice) /
    ioPrice;

  const bonus =
    base * BONUS_RATE;

  const total =
    base + bonus;


  $("#estimatedIO").textContent =
    `${formatNumber(base)} IO`;

  $("#bonusIO").textContent =
    `${formatNumber(bonus)} IO`;

  $("#totalIO").textContent =
    `${formatNumber(total)} IO`;


  message.textContent =
    "Estimate calculated from current displayed market prices.";

}


/* =========================================================
   BNB SMART CHAIN RPC
========================================================= */

const RPC_URLS = [

  "https://bsc-dataseed.binance.org/",

  "https://bsc-dataseed1.defibit.io/",

  "https://bsc-dataseed1.ninicoin.io/"

];


async function rpc(
  method,
  params
) {

  let lastError = null;

  for (const url of RPC_URLS) {

    try {

      const response =
        await fetch(
          url,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method,
              params
            }),

            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `RPC HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      if (data.error) {

        throw new Error(
          data.error.message
        );

      }


      return data.result;


    } catch (error) {

      lastError = error;

    }

  }

  throw (
    lastError ||
    new Error("BSC RPC unavailable")
  );

}


/* =========================================================
   ERC20 TRANSFER EVENT
========================================================= */

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a6b2f9b0e8";


/* =========================================================
   HEX HELPERS
========================================================= */

function hexToNumber(hex) {

  return Number.parseInt(
    hex,
    16
  );

}


function cleanAddress(topic) {

  return (
    "0x" +
    topic.slice(-40)
  );

}


function shortAddress(address) {

  return (
    `${address.slice(0, 6)}...${address.slice(-4)}`
  );

}


/* =========================================================
   TOKEN DECIMALS
========================================================= */

async function loadTokenDecimals() {

  try {

    const result =
      await rpc(
        "eth_call",
        [
          {
            to:
              CONTRACT_ADDRESS,

            data:
              "0x313ce567"
          },

          "latest"
        ]
      );


    const decimals =
      hexToNumber(result);


    if (
      Number.isFinite(decimals) &&
      decimals >= 0 &&
      decimals <= 36
    ) {

      ioDecimals =
        decimals;

    }

  } catch (error) {

    console.warn(
      "Could not read token decimals. Using 18.",
      error
    );

  }

}


/* =========================================================
   CONVERT TOKEN AMOUNT
========================================================= */

function tokenAmountFromHex(hex) {

  try {

    const raw =
      BigInt(hex);

    const divisor =
      10n ** BigInt(ioDecimals);

    const whole =
      raw / divisor;

    const remainder =
      raw % divisor;


    const remainderString =
      remainder
        .toString()
        .padStart(
          ioDecimals,
          "0"
        );


    const trimmed =
      remainderString
        .replace(/0+$/, "");


    if (!trimmed) {

      return Number(
        whole
      );

    }


    return Number(
      `${whole}.${trimmed}`
    );

  } catch {

    return 0;

  }

}


/* =========================================================
   GET BLOCK RANGE
========================================================= */

async function getLatestBlock() {

  const latestHex =
    await rpc(
      "eth_blockNumber",
      []
    );

  return hexToNumber(
    latestHex
  );

}


/* =========================================================
   GET TRANSFERS IN SMALL CHUNKS
========================================================= */

async function getTransferLogs() {

  const latest =
    await getLatestBlock();


  /*
    Instead of asking the RPC for thousands
    of blocks at once, we search in small
    ranges. This prevents the activity section
    from becoming empty because of an RPC
    range-limit error.
  */

  const CHUNK_SIZE = 500;

  const LOOKBACK =
    10000;

  const start =
    Math.max(
      0,
      latest - LOOKBACK
    );


  const ranges = [];

  for (
    let from = start;
    from <= latest;
    from += CHUNK_SIZE
  ) {

    ranges.push({
      from,
      to:
        Math.min(
          from + CHUNK_SIZE - 1,
          latest
        )
    });

  }


  const allLogs = [];


  /*
    Search newest ranges first.
  */

  for (
    let i = ranges.length - 1;
    i >= 0;
    i--
  ) {

    const range =
      ranges[i];


    try {

      const logs =
        await rpc(
          "eth_getLogs",
          [
            {
              address:
                CONTRACT_ADDRESS,

              fromBlock:
                "0x" +
                range.from.toString(16),

              toBlock:
                "0x" +
                range.to.toString(16),

              topics:
                [
                  TRANSFER_TOPIC
                ]
            }
          ]
        );


      if (
        Array.isArray(logs) &&
        logs.length
      ) {

        allLogs.push(
          ...logs
        );

      }


      /*
        Once we have enough real transactions,
        stop searching older blocks.
      */

      if (
        allLogs.length >= 8
      ) {

        break;

      }

    } catch (error) {

      console.warn(
        "Transfer range failed:",
        range,
        error
      );

    }

  }


  return allLogs
    .sort(
      (a, b) =>
        hexToNumber(b.blockNumber) -
        hexToNumber(a.blockNumber)
    )
    .slice(0, 8);

}


/* =========================================================
   RENDER ACTIVITY
========================================================= */

function renderActivity(
  logs
) {

  const grid =
    $("#activityGrid");

  if (!grid) return;


  if (
    !Array.isArray(logs) ||
    !logs.length
  ) {

    grid.innerHTML = `
      <div class="activity-empty">
        No recent IO transfer activity was found
        for the configured contract.
      </div>
    `;

    return;

  }


  grid.innerHTML =
    logs.map(log => {

      const fromAddress =
        cleanAddress(
          log.topics[1]
        );


      const toAddress =
        cleanAddress(
          log.topics[2]
        );


      const amount =
        tokenAmountFromHex(
          log.data
        );


      const block =
        hexToNumber(
          log.blockNumber
        );


      const transaction =
        log.transactionHash;


      return `

        <article class="activity-row">

          <div class="activity-icon">
            ↗
          </div>


          <div class="activity-main">

            <strong>
              ${formatNumber(amount)} IO
            </strong>

            <span>
              ${shortAddress(fromAddress)}
              →
              ${shortAddress(toAddress)}
            </span>

          </div>


          <div class="activity-meta">

            <strong>
              ON-CHAIN
            </strong>

            <small>
              Block ${block}
            </small>

          </div>

        </article>

      `;

    }).join("");

}


/* =========================================================
   LOAD ACTIVITY
========================================================= */

async function loadActivity() {

  const grid =
    $("#activityGrid");

  if (!grid) return;


  grid.innerHTML = `
    <div class="activity-loading">
      Loading recent IO transactions...
    </div>
  `;


  try {

    await loadTokenDecimals();

    const logs =
      await getTransferLogs();

    renderActivity(logs);

  } catch (error) {

    console.error(
      "Activity error:",
      error
    );


    grid.innerHTML = `
      <div class="activity-empty">
        Unable to load recent IO activity right now.
        Please refresh the page and try again.
      </div>
    `;

  }

}


/* =========================================================
   COPY CONTRACT
========================================================= */

function setupCopy() {

  const button =
    $("#copyContract");

  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          CONTRACT_ADDRESS
        );

        button.textContent =
          "Copied";

        setTimeout(
          () => {
            button.textContent =
              "Copy";
          },
          1500
        );

      } catch {

        button.textContent =
          "Copy failed";

        setTimeout(
          () => {
            button.textContent =
              "Copy";
          },
          1500
        );

      }

    }
  );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

  const button =
    $("#themeToggle");

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light"
      );


      button.textContent =
        document.body.classList.contains(
          "light"
        )
          ? "☼"
          : "☾";

    }
  );

}


/* =========================================================
   WALLET MODAL
========================================================= */

function setupWallet() {

  const modal =
    $("#walletModal");

  const open =
    $("#connectWallet");

  const close =
    $("#closeWallet");

  const modalButton =
    $("#modalConnectWallet");


  function show() {

    modal?.classList.remove(
      "hidden"
    );

  }


  function hide() {

    modal?.classList.add(
      "hidden"
    );

  }


  open?.addEventListener(
    "click",
    show
  );


  close?.addEventListener(
    "click",
    hide
  );


  modal?.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        hide();

      }

    }
  );


  modalButton?.addEventListener(
    "click",
    () => {

      modalButton.textContent =
        "Wallet connection unavailable";

    }
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

  setupCopy();

  setupTheme();

  setupWallet();


  $("#bnbAmount")?.addEventListener(
    "input",
    calculateAllocation
  );


  $("#calculateBtn")?.addEventListener(
    "click",
    calculateAllocation
  );


  loadPrices();

  loadActivity();


  /*
    Refresh market prices every minute.
  */

  setInterval(
    loadPrices,
    60000
  );


  /*
    Refresh on-chain activity every two minutes.
  */

  setInterval(
    loadActivity,
    120000
  );

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

}
