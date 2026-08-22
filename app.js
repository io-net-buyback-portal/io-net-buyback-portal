const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;
const IO_PER_BNB = 1000;

const IO_CONTRACT =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";


// =====================================================
// ELEMENTS
// =====================================================

const bnbAmount = document.getElementById("bnbAmount");
const calculateBtn = document.getElementById("calculateBtn");
const allocationResult =
  document.getElementById("allocationResult");

const calculatorMessage =
  document.getElementById("calculatorMessage");

const estimatedIO =
  document.getElementById("estimatedIO");

const bonusIO =
  document.getElementById("bonusIO");

const totalIO =
  document.getElementById("totalIO");

const connectWallet =
  document.getElementById("connectWallet");

const walletModal =
  document.getElementById("walletModal");

const closeWallet =
  document.getElementById("closeWallet");

const modalConnectWallet =
  document.getElementById("modalConnectWallet");

const themeToggle =
  document.getElementById("themeToggle");

const ioPriceElement =
  document.getElementById("ioPrice");

const bnbPriceElement =
  document.getElementById("bnbPrice");

const transactionList =
  document.getElementById("transactionList");


// =====================================================
// HELPERS
// =====================================================

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}


function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


function randomHex(length) {
  const characters =
    "0123456789abcdef";

  let output = "";

  for (let i = 0; i < length; i++) {
    output += characters[
      Math.floor(
        Math.random() * characters.length
      )
    ];
  }

  return output;
}


function randomWallet() {
  return (
    "0x" +
    randomHex(40)
  );
}


function randomHash() {
  return (
    "0x" +
    randomHex(64)
  );
}


// =====================================================
// ALLOCATION CALCULATOR
// =====================================================

calculateBtn.addEventListener("click", () => {

  const amount =
    Number(bnbAmount.value);

  calculatorMessage.textContent = "";

  allocationResult.classList.add(
    "hidden"
  );


  if (!amount || Number.isNaN(amount)) {

    calculatorMessage.textContent =
      "Enter a BNB amount.";

    return;
  }


  if (amount < MIN_BNB) {

    calculatorMessage.textContent =
      `Minimum participation is ${MIN_BNB} BNB.`;

    return;
  }


  if (amount > MAX_BNB) {

    calculatorMessage.textContent =
      `Maximum participation is ${MAX_BNB} BNB.`;

    return;
  }


  const estimated =
    amount * IO_PER_BNB;

  const bonus =
    estimated * BONUS_RATE;

  const total =
    estimated + bonus;


  estimatedIO.textContent =
    `${formatNumber(estimated)} IO`;

  bonusIO.textContent =
    `+${formatNumber(bonus)} IO`;

  totalIO.textContent =
    `${formatNumber(total)} IO`;


  allocationResult.classList.remove(
    "hidden"
  );

});


bnbAmount.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {
      calculateBtn.click();
    }

  }
);


// =====================================================
// WALLET
// =====================================================

function openWalletModal() {

  if (walletModal) {
    walletModal.classList.remove(
      "hidden"
    );
  }

}


function closeWalletModal() {

  if (walletModal) {
    walletModal.classList.add(
      "hidden"
    );
  }

}


connectWallet.addEventListener(
  "click",
  async () => {

    if (!window.ethereum) {

      openWalletModal();

      return;
    }


    try {

      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts"
        });


      if (
        accounts &&
        accounts.length
      ) {

        connectWallet.textContent =
          shortenAddress(accounts[0]);

      }

    } catch (error) {

      console.error(
        "Wallet connection failed:",
        error
      );

    }

  }
);


if (modalConnectWallet) {

  modalConnectWallet.addEventListener(
    "click",
    async () => {

      if (!window.ethereum) {

        modalConnectWallet.textContent =
          "Wallet not detected";

        return;
      }


      try {

        const accounts =
          await window.ethereum.request({
            method: "eth_requestAccounts"
          });


        if (
          accounts &&
          accounts.length
        ) {

          connectWallet.textContent =
            shortenAddress(accounts[0]);

          closeWalletModal();

        }

      } catch (error) {

        console.error(
          "Wallet connection failed:",
          error
        );

      }

    }
  );

}


if (closeWallet) {

  closeWallet.addEventListener(
    "click",
    closeWalletModal
  );

}


if (walletModal) {

  walletModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === walletModal
      ) {

        closeWalletModal();

      }

    }
  );

}


// =====================================================
// THEME
// =====================================================

let lightMode = false;


themeToggle.addEventListener(
  "click",
  () => {

    lightMode = !lightMode;


    if (lightMode) {

      document.documentElement.style.setProperty(
        "--bg",
        "#f4f6fb"
      );

      document.documentElement.style.setProperty(
        "--bg-soft",
        "#ffffff"
      );

      document.documentElement.style.setProperty(
        "--panel",
        "#ffffff"
      );

      document.documentElement.style.setProperty(
        "--panel-2",
        "#f7f8fc"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#111827"
      );

      document.documentElement.style.setProperty(
        "--muted",
        "#667085"
      );

      document.documentElement.style.setProperty(
        "--faint",
        "#98a2b3"
      );

      document.documentElement.style.setProperty(
        "--line",
        "rgba(17,24,39,.10)"
      );

      themeToggle.textContent = "☾";

    } else {

      document.documentElement.style.setProperty(
        "--bg",
        "#070914"
      );

      document.documentElement.style.setProperty(
        "--bg-soft",
        "#0b0e1b"
      );

      document.documentElement.style.setProperty(
        "--panel",
        "#0f1322"
      );

      document.documentElement.style.setProperty(
        "--panel-2",
        "#121729"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#f7f8ff"
      );

      document.documentElement.style.setProperty(
        "--muted",
        "#9299b0"
      );

      document.documentElement.style.setProperty(
        "--faint",
        "#656d84"
      );

      document.documentElement.style.setProperty(
        "--line",
        "rgba(255,255,255,.09)"
      );

      themeToggle.textContent = "☼";

    }

  }
);


// =====================================================
// MARKET PRICES
// =====================================================

async function loadMarketPrices() {

  try {

    const response =
      await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=io-net,bnb&vs_currencies=usd"
      );


    if (!response.ok) {
      throw new Error(
        "Market request failed"
      );
    }


    const data =
      await response.json();


    if (data["io-net"]?.usd) {

      ioPriceElement.textContent =
        `$${data["io-net"].usd.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
          }
        )}`;

    }


    if (data.bnb?.usd) {

      bnbPriceElement.textContent =
        `$${data.bnb.usd.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )}`;

    }

  } catch (error) {

    console.error(
      "Unable to load market prices:",
      error
    );

    ioPriceElement.textContent =
      "Unavailable";

    bnbPriceElement.textContent =
      "Unavailable";

  }

}


loadMarketPrices();

setInterval(
  loadMarketPrices,
  60000
);


// =====================================================
// SIMULATED ACTIVITY INTERFACE
// =====================================================

const simulatedActivity = [

  {
    amount: "2,486.40",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "7,315.82",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "1,948.27",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "5,672.91",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "3,214.66",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "8,421.15",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "4,096.73",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "6,758.34",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "2,917.48",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "9,104.26",
    wallet: randomWallet(),
    hash: randomHash()
  }

];


let activityIndex = 0;


// =====================================================
// CREATE ACTIVITY CARD
// =====================================================

function createActivityCard(data) {

  const item =
    document.createElement("div");

  item.className =
    "activityItem";


  item.style.opacity = "0";

  item.style.transform =
    "translateY(14px)";


  item.innerHTML = `

    <span>↗</span>

    <div>

      <b>
        ${data.amount} IO
      </b>

      <small>
        ${shortenAddress(data.wallet)}
      </small>

      <small
        style="
          color:#656d84;
          font-size:9px;
          font-weight:600;
          margin-top:3px;
        "
      >
        ${shortenAddress(data.hash)}
      </small>

    </div>

  `;


  return item;
}


// =====================================================
// ADD ACTIVITY SLOWLY
// =====================================================

function addActivity() {

  if (!transactionList) {
    return;
  }


  const data =
    simulatedActivity[
      activityIndex %
      simulatedActivity.length
    ];


  activityIndex++;


  const card =
    createActivityCard(data);


  transactionList.prepend(card);


  requestAnimationFrame(() => {

    setTimeout(() => {

      card.style.transition =
        "opacity 1.2s ease, transform 1.2s ease";

      card.style.opacity = "1";

      card.style.transform =
        "translateY(0)";

    }, 120);

  });


  const cards =
    transactionList.querySelectorAll(
      ".activityItem"
    );


  if (cards.length > 6) {

    const oldest =
      cards[cards.length - 1];


    oldest.style.transition =
      "opacity 3.5s ease, transform 3.5s ease";

    oldest.style.opacity = "0";

    oldest.style.transform =
      "translateY(-12px)";


    setTimeout(() => {

      if (oldest.parentNode) {

        oldest.parentNode.removeChild(
          oldest
        );

      }

    }, 3600);

  }

}


// =====================================================
// START ACTIVITY FEED
// =====================================================

if (transactionList) {

  transactionList.innerHTML = "";

  // Start gently instead of filling
  // the whole section instantly.

  setTimeout(
    addActivity,
    900
  );

  setTimeout(
    addActivity,
    2600
  );

  setTimeout(
    addActivity,
    4400
  );

  setTimeout(
    addActivity,
    6200
  );

  setTimeout(
    addActivity,
    8000
  );

  setInterval(
    addActivity,
    5200
  );

}


// =====================================================
// WALLET ACCOUNT CHANGES
// =====================================================

if (window.ethereum) {

  window.ethereum.on(
    "accountsChanged",
    (accounts) => {

      if (
        !accounts ||
        accounts.length === 0
      ) {

        connectWallet.textContent =
          "Connect Wallet";

      } else {

        connectWallet.textContent =
          shortenAddress(
            accounts[0]
          );

      }

    }
  );

}


// =====================================================
// INITIAL STATE
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (allocationResult) {

      allocationResult.classList.add(
        "hidden"
      );

    }

    if (ioPriceElement) {

      ioPriceElement.textContent =
        "Loading...";

    }

    if (bnbPriceElement) {

      bnbPriceElement.textContent =
        "Loading...";

    }

  }
);
