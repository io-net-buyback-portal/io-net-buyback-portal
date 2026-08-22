const IO_PRICE_ID = "io-net";
const BNB_PRICE_ID = "binancecoin";

const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

let ioPrice = 0;
let bnbPrice = 0;

const $ = (selector) =>
  document.querySelector(selector);


/* =========================
   PRICE DATA
========================= */

async function loadPrices() {

  const ioPriceEl = $("#ioPrice");
  const bnbPriceEl = $("#bnbPrice");

  try {

    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=io-net,binancecoin" +
      "&vs_currencies=usd" +
      "&include_24hr_change=true";

    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Price request failed");
    }

    const data = await response.json();

    ioPrice = Number(data?.[IO_PRICE_ID]?.usd || 0);
    bnbPrice = Number(data?.[BNB_PRICE_ID]?.usd || 0);

    if (ioPrice > 0) {
      ioPriceEl.textContent =
        formatUSD(ioPrice);
    } else {
      ioPriceEl.textContent = "Unavailable";
    }

    if (bnbPrice > 0) {
      bnbPriceEl.textContent =
        formatUSD(bnbPrice);
    } else {
      bnbPriceEl.textContent = "Unavailable";
    }


    updateChange(
      "#ioChange",
      data?.[IO_PRICE_ID]?.usd_24h_change
    );

    updateChange(
      "#bnbChange",
      data?.[BNB_PRICE_ID]?.usd_24h_change
    );


    calculateAllocation();

  } catch (error) {

    ioPriceEl.textContent = "Unavailable";
    bnbPriceEl.textContent = "Unavailable";

    $("#ioChange").textContent =
      "Market feed unavailable";

    $("#bnbChange").textContent =
      "Market feed unavailable";

  }

}


function updateChange(selector, value) {

  const element = $(selector);

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    element.textContent =
      "Market change unavailable";
    return;
  }

  const sign = value >= 0 ? "+" : "";

  element.textContent =
    `${sign}${value.toFixed(2)}% 24h`;

  element.classList.toggle(
    "negative",
    value < 0
  );
}


function formatUSD(value) {

  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1000) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
      }
    ).format(value);
  }

  if (value >= 1) {
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

  return `$${value.toFixed(4)}`;
}


/* =========================
   CALCULATOR
========================= */

function calculateAllocation() {

  const input = $("#bnbAmount");
  const message = $("#calculatorMessage");

  const amount = Number(input.value);

  if (
    !amount ||
    amount < MIN_BNB ||
    amount > MAX_BNB ||
    !ioPrice ||
    !bnbPrice
  ) {

    $("#estimatedIO").textContent = "0 IO";
    $("#bonusIO").textContent = "0 IO";
    $("#totalIO").textContent = "0 IO";

    if (amount && amount < MIN_BNB) {
      message.textContent =
        "Minimum participation is 5 BNB.";
    } else if (amount > MAX_BNB) {
      message.textContent =
        "Maximum participation is 500 BNB.";
    } else {
      message.textContent =
        "Minimum 5 BNB · Maximum 500 BNB";
    }

    return;
  }


  message.textContent =
    "Allocation estimate calculated from current market prices.";


  const baseIO =
    (amount * bnbPrice) / ioPrice;

  const bonusIO =
    baseIO * BONUS_RATE;

  const totalIO =
    baseIO + bonusIO;


  $("#estimatedIO").textContent =
    `${formatNumber(baseIO)} IO`;

  $("#bonusIO").textContent =
    `${formatNumber(bonusIO)} IO`;

  $("#totalIO").textContent =
    `${formatNumber(totalIO)} IO`;

}


function formatNumber(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(value);

}


$("#bnbAmount").addEventListener(
  "input",
  calculateAllocation
);

$("#calculateBtn").addEventListener(
  "click",
  calculateAllocation
);


/* =========================
   ACTIVITY
========================= */

const activity = [

  {
    amount: "4,096.73",
    address: "0x5680...7f0c",
    time: "Recently",
    status: "Allocation processed"
  },

  {
    amount: "3,214.66",
    address: "0x6a84...42fd",
    time: "Recently",
    status: "Allocation processed"
  },

  {
    amount: "1,918.27",
    address: "0x34c1...0ea1",
    time: "Recently",
    status: "Allocation processed"
  },

  {
    amount: "6,758.34",
    address: "0x95c3...ebdf",
    time: "Recently",
    status: "Allocation processed"
  },

  {
    amount: "8,421.15",
    address: "0xb01b...4914",
    time: "Recently",
    status: "Allocation processed"
  },

  {
    amount: "5,672.91",
    address: "0x709e...3635",
    time: "Recently",
    status: "Allocation processed"
  }
];


function renderActivity() {

  const grid = $("#activityGrid");

  grid.innerHTML = activity.map(
    item => `

      <article class="activity-card">

        <div class="activity-arrow">
          ↗
        </div>

        <div class="activity-main">

          <strong>
            ${item.amount} IO
          </strong>

          <code>
            ${item.address}
          </code>

          <span>
            ${item.status}
          </span>

        </div>

        <time>
          ${item.time}
        </time>

      </article>

    `
  ).join("");

}


/* =========================
   COPY CONTRACT
========================= */

$("#copyContract").addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        CONTRACT_ADDRESS
      );

      $("#copyContract").textContent =
        "Copied";

      setTimeout(() => {

        $("#copyContract").textContent =
          "Copy";

      }, 1600);

    } catch {

      $("#copyContract").textContent =
        "Copy failed";

    }

  }
);


/* =========================
   WALLET MODAL
========================= */

const walletModal =
  $("#walletModal");


function openWallet() {
  walletModal.classList.remove("hidden");
}


function closeWallet() {
  walletModal.classList.add("hidden");
}


$("#connectWallet").addEventListener(
  "click",
  openWallet
);

$("#modalConnectWallet").addEventListener(
  "click",
  () => {

    $("#modalConnectWallet").textContent =
      "Wallet connection unavailable";

  }
);

$("#closeWallet").addEventListener(
  "click",
  closeWallet
);

walletModal.addEventListener(
  "click",
  event => {

    if (event.target === walletModal) {
      closeWallet();
    }

  }
);


/* =========================
   THEME
========================= */

const themeButton =
  $("#themeToggle");


themeButton.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light-mode"
    );

    themeButton.textContent =
      document.body.classList.contains(
        "light-mode"
      )
        ? "☾"
        : "☼";

  }
);


/* =========================
   INITIALIZE
========================= */

renderActivity();
loadPrices();

setInterval(
  loadPrices,
  60000
);
