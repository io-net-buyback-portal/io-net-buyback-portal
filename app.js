const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

let ioPrice = 0;
let bnbPrice = 0;

const $ = (selector) =>
  document.querySelector(selector);

/* =========================================================
   TOKEN LOGOS
========================================================= */

const IO_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="100" fill="#050505"/>
  <g fill="none" stroke="#f4f5f7" stroke-width="16"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M58 70h30"/>
    <path d="M58 130h30"/>
    <path d="M74 70v60"/>
    <path d="M112 70h25c10 0 18 8 18 18v24c0 10-8 18-18 18h-25"/>
    <path d="M112 70v60"/>
    <path d="M112 100h28"/>
  </g>
</svg>
`)}`;

const BNB_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="22" fill="#fff"/>
  <g fill="#F3BA2F">
    <path d="M100 22l25 25-25 25-25-25z"/>
    <path d="M53 69l25-25 16 16-25 25z"/>
    <path d="M147 69l-16-16 25-25 25 25z"/>
    <path d="M100 72l28 28-28 28-28-28z"/>
    <path d="M53 109l25 25-16 16-25-25z"/>
    <path d="M147 109l16 16-25 25-16-16z"/>
    <path d="M100 139l25 25-25 25-25-25z"/>
  </g>
</svg>
`)}`;

function installLogos() {
  document
    .querySelectorAll('img[alt="IO"], img[alt="IO logo"]')
    .forEach((img) => {
      img.src = IO_LOGO;
      img.removeAttribute("srcset");
    });

  document
    .querySelectorAll(
      'img[alt="BNB logo"], img[alt="BNB Chain"]'
    )
    .forEach((img) => {
      img.src = BNB_LOGO;
      img.removeAttribute("srcset");
    });
}

/* =========================================================
   BINANCE MARKET DATA
========================================================= */

async function getBinancePrice(symbol) {
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    {
      method: "GET",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Binance request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const price = Number(data.lastPrice);
  const change = Number(data.priceChangePercent);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      `${symbol} price unavailable`
    );
  }

  return {
    price,
    change: Number.isFinite(change)
      ? change
      : null
  };
}

/* =========================================================
   LOAD LIVE PRICES
========================================================= */

async function loadPrices() {
  const ioPriceElement = $("#ioPrice");
  const bnbPriceElement = $("#bnbPrice");

  try {
    const [ioData, bnbData] =
      await Promise.all([
        getBinancePrice("IOUSDT"),
        getBinancePrice("BNBUSDT")
      ]);

    ioPrice = ioData.price;
    bnbPrice = bnbData.price;

    if (ioPriceElement) {
      ioPriceElement.textContent =
        formatUSD(ioPrice);
    }

    if (bnbPriceElement) {
      bnbPriceElement.textContent =
        formatUSD(bnbPrice);
    }

    updateChange(
      "#ioChange",
      ioData.change
    );

    updateChange(
      "#bnbChange",
      bnbData.change
    );

    calculateAllocation();

  } catch (error) {
    console.warn(
      "Binance market data error:",
      error
    );

    /*
      Keep the last successful price on screen.
      Only show unavailable if we have never
      received a price.
    */

    if (
      ioPriceElement &&
      !ioPrice
    ) {
      ioPriceElement.textContent =
        "Unavailable";
    }

    if (
      bnbPriceElement &&
      !bnbPrice
    ) {
      bnbPriceElement.textContent =
        "Unavailable";
    }

    if (!ioPrice) {
      setText(
        "#ioChange",
        "Market feed unavailable"
      );
    }

    if (!bnbPrice) {
      setText(
        "#bnbChange",
        "Market feed unavailable"
      );
    }

    calculateAllocation();
  }
}

/* =========================================================
   PRICE CHANGE
========================================================= */

function updateChange(
  selector,
  value
) {
  const element = $(selector);

  if (!element) return;

  if (
    !Number.isFinite(value)
  ) {
    element.textContent =
      "Live market data";

    element.classList.remove(
      "negative"
    );

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
   HELPERS
========================================================= */

function setText(
  selector,
  value
) {
  const element = $(selector);

  if (element) {
    element.textContent = value;
  }
}

function formatUSD(value) {
  if (
    !Number.isFinite(value)
  ) {
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

  if (!input || !message) {
    return;
  }

  const amount =
    Number(input.value);

  if (
    !amount ||
    amount < MIN_BNB ||
    amount > MAX_BNB ||
    !ioPrice ||
    !bnbPrice
  ) {
    setText(
      "#estimatedIO",
      "0 IO"
    );

    setText(
      "#bonusIO",
      "0 IO"
    );

    setText(
      "#totalIO",
      "0 IO"
    );

    if (
      amount &&
      amount < MIN_BNB
    ) {
      message.textContent =
        "Minimum participation is 5 BNB.";

    } else if (
      amount > MAX_BNB
    ) {
      message.textContent =
        "Maximum participation is 500 BNB.";

    } else if (
      !ioPrice ||
      !bnbPrice
    ) {
      message.textContent =
        "Waiting for current market prices.";

    } else {
      message.textContent =
        "Minimum 5 BNB · Maximum 500 BNB";
    }

    return;
  }

  message.textContent =
    "Estimate calculated from the current displayed market prices.";

  const baseIO =
    (amount * bnbPrice) /
    ioPrice;

  const bonusIO =
    baseIO * BONUS_RATE;

  const totalIO =
    baseIO + bonusIO;

  setText(
    "#estimatedIO",
    `${formatNumber(baseIO)} IO`
  );

  setText(
    "#bonusIO",
    `${formatNumber(bonusIO)} IO`
  );

  setText(
    "#totalIO",
    `${formatNumber(totalIO)} IO`
  );
}

/* =========================================================
   DEMO ACTIVITY
========================================================= */

const activity = [
  {
    amount: "4,096.73",
    address: "0x5680...7f0c"
  },
  {
    amount: "3,214.66",
    address: "0x6a84...42fd"
  },
  {
    amount: "1,918.27",
    address: "0x34c1...0ea1"
  },
  {
    amount: "6,758.34",
    address: "0x95c3...ebdf"
  },
  {
    amount: "8,421.15",
    address: "0xb01b...4914"
  },
  {
    amount: "5,672.91",
    address: "0x709e...3635"
  },
  {
    amount: "2,480.40",
    address: "0x8d42...91af"
  },
  {
    amount: "7,318.52",
    address: "0xa721...4bc8"
  }
];

function activityCard(item) {
  return `
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
          Demo allocation
        </span>

      </div>

      <time>
        DEMO
      </time>

    </article>
  `;
}

function renderActivity() {
  const grid =
    $("#activityGrid");

  if (!grid) return;

  const cards =
    [...activity, ...activity];

  grid.innerHTML =
    cards
      .map(activityCard)
      .join("");
}

/* =========================================================
   COPY CONTRACT
========================================================= */

const copyButton =
  $("#copyContract");

if (copyButton) {
  copyButton.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          CONTRACT_ADDRESS
        );

        copyButton.textContent =
          "Copied";

        setTimeout(() => {
          copyButton.textContent =
            "Copy";
        }, 1600);

      } catch {

        copyButton.textContent =
          "Copy failed";

      }

    }
  );
}

/* =========================================================
   WALLET MODAL
========================================================= */

const walletModal =
  $("#walletModal");

function openWallet() {
  if (walletModal) {
    walletModal.classList.remove(
      "hidden"
    );
  }
}

function closeWallet() {
  if (walletModal) {
    walletModal.classList.add(
      "hidden"
    );
  }
}

const connectWallet =
  $("#connectWallet");

const modalConnectWallet =
  $("#modalConnectWallet");

const closeWalletButton =
  $("#closeWallet");

if (connectWallet) {
  connectWallet.addEventListener(
    "click",
    openWallet
  );
}

if (modalConnectWallet) {
  modalConnectWallet.addEventListener(
    "click",
    () => {
      modalConnectWallet.textContent =
        "Wallet connection unavailable";
    }
  );
}

if (closeWalletButton) {
  closeWalletButton.addEventListener(
    "click",
    closeWallet
  );
}

if (walletModal) {
  walletModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === walletModal
      ) {
        closeWallet();
      }

    }
  );
}

/* =========================================================
   THEME
========================================================= */

const themeButton =
  $("#themeToggle");

if (themeButton) {
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
}

/* =========================================================
   CALCULATOR EVENTS
========================================================= */

const bnbInput =
  $("#bnbAmount");

const calculateButton =
  $("#calculateBtn");

if (bnbInput) {
  bnbInput.addEventListener(
    "input",
    calculateAllocation
  );
}

if (calculateButton) {
  calculateButton.addEventListener(
    "click",
    calculateAllocation
  );
}

/* =========================================================
   INITIALIZE
========================================================= */

installLogos();

renderActivity();

loadPrices();

/*
  Refresh Binance prices every 60 seconds.
*/
setInterval(
  loadPrices,
  60000
);
