/* =========================================================
   IO NETWORK — COMPLETE APP
========================================================= */

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

let ioPrice = 0;
let bnbPrice = 0;
let ioSymbol = null;

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   BINANCE MARKET DATA
========================================================= */

async function binanceJSON(path) {

  const urls = [
    `https://api.binance.com${path}`,
    `https://data-api.binance.vision${path}`
  ];

  let lastError;

  for (const url of urls) {

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
   FIND IO/USDT SYMBOL
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
    symbols.find(symbol =>

      symbol.status === "TRADING" &&

      symbol.quoteAsset === "USDT" &&

      (
        String(symbol.baseAsset).toUpperCase() === "IO" ||
        String(symbol.baseAsset).toUpperCase() === "IONET"
      )

    );

  if (!match) {

    throw new Error(
      "No active IO/USDT Binance spot pair found."
    );

  }

  return match.symbol;
}


/* =========================================================
   TICKER
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

  if (value < 1) {

    return `$${value.toFixed(4)}`;

  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(value);

}


/* =========================================================
   24H CHANGE
========================================================= */

function setChange(selector, value) {

  const element = $(selector);

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

  element.classList.toggle(
    "negative",
    value < 0
  );

}


/* =========================================================
   LOAD PRICES
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
      "Market data unavailable:",
      error
    );


    if (!ioPrice) {

      $("#ioPrice").textContent =
        "Unavailable";

    }


    if (!bnbPrice) {

      $("#bnbPrice").textContent =
        "Unavailable";

    }


    calculateAllocation();

  }

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(value);

}


/* =========================================================
   ALLOCATION CALCULATOR
========================================================= */

function calculateAllocation() {

  const input =
    $("#bnbAmount");

  const message =
    $("#calculatorMessage");

  if (!input || !message) return;


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


  if (!ioPrice || !bnbPrice) {

    message.textContent =
      "Waiting for current market prices.";

    return;

  }


  const base =
    (amount * bnbPrice) / ioPrice;


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
   ON-CHAIN ACTIVITY
========================================================= */

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a6b2f9b0e8";


const RPC_URLS = [

  "https://bsc-dataseed.binance.org/",

  "https://bsc-dataseed1.defibit.io/",

  "https://bsc-dataseed1.ninicoin.io/"

];


async function rpc(
  method,
  params
) {

  let lastError;


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
    new Error(
      "BSC RPC unavailable"
    )
  );

}


/* =========================================================
   ADDRESS HELPERS
========================================================= */

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


function hexToNumber(hex) {

  return Number.parseInt(
    hex,
    16
  );

}


/* =========================================================
   LOAD REAL TRANSFER ACTIVITY
========================================================= */

async function loadActivity() {

  const grid =
    $("#activityGrid");

  if (!grid) return;


  grid.innerHTML = `
    <div class="activity-loading">
      Loading recent on-chain activity...
    </div>
  `;


  try {

    const latestHex =
      await rpc(
        "eth_blockNumber",
        []
      );


    const latest =
      hexToNumber(
        latestHex
      );


    const from =
      Math.max(
        0,
        latest - 2500
      );


    const logs =
      await rpc(
        "eth_getLogs",
        [
          {
            address:
              CONTRACT_ADDRESS,

            fromBlock:
              "0x" +
              from.toString(16),

            toBlock:
              latestHex,

            topics:
              [TRANSFER_TOPIC]
          }
        ]
      );


    const recent =
      Array.isArray(logs)
        ? logs.slice(-8).reverse()
        : [];


    if (!recent.length) {

      grid.innerHTML = `
        <div class="activity-empty">
          No recent on-chain transfer events found
          for this contract.
        </div>
      `;

      return;

    }


    grid.innerHTML =
      recent.map(log => {

        const fromAddress =
          cleanAddress(
            log.topics[1]
          );


        const toAddress =
          cleanAddress(
            log.topics[2]
          );


        const amountRaw =
          BigInt(log.data);


        const amount =
          Number(amountRaw) /
          1e18;


        return `
          <article class="activity-row">

            <div class="activity-icon">
              ↗
            </div>

            <div class="activity-main">

              <strong>
                ${
                  Number.isFinite(amount)
                    ? formatNumber(amount)
                    : "Transfer"
                } IO
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
                Block ${
                  hexToNumber(
                    log.blockNumber
                  )
                }
              </small>

            </div>

          </article>
        `;

      }).join("");


  } catch (error) {

    console.warn(
      "On-chain activity unavailable:",
      error
    );


    grid.innerHTML = `
      <div class="activity-empty">
        On-chain activity is temporarily unavailable.
        The portal will retry automatically.
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


  const show = () => {

    modal?.classList.remove(
      "hidden"
    );

  };


  const hide = () => {

    modal?.classList.add(
      "hidden"
    );

  };


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


  setInterval(
    loadPrices,
    60000
  );


  setInterval(
    loadActivity,
    120000
  );

}


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
