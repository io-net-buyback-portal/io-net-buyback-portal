const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

// Example allocation rate used by the interface.
// Replace with your verified allocation formula when available.
const IO_PER_BNB = 1000;

const bnbAmount = document.getElementById("bnbAmount");
const calculateBtn = document.getElementById("calculateBtn");
const allocationResult = document.getElementById("allocationResult");
const calculatorMessage = document.getElementById("calculatorMessage");

const estimatedIO = document.getElementById("estimatedIO");
const bonusIO = document.getElementById("bonusIO");
const totalIO = document.getElementById("totalIO");

const connectWallet = document.getElementById("connectWallet");
const walletModal = document.getElementById("walletModal");
const closeWallet = document.getElementById("closeWallet");
const modalConnectWallet = document.getElementById("modalConnectWallet");

const themeToggle = document.getElementById("themeToggle");

const ioPriceElement = document.getElementById("ioPrice");
const bnbPriceElement = document.getElementById("bnbPrice");


// ===============================
// HELPERS
// ===============================

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


// ===============================
// ALLOCATION CALCULATOR
// ===============================

calculateBtn.addEventListener("click", () => {
  const amount = Number(bnbAmount.value);

  calculatorMessage.textContent = "";
  allocationResult.classList.add("hidden");

  if (!amount || Number.isNaN(amount)) {
    calculatorMessage.textContent = "Enter a BNB amount.";
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

  const estimated = amount * IO_PER_BNB;
  const bonus = estimated * BONUS_RATE;
  const total = estimated + bonus;

  estimatedIO.textContent =
    `${formatNumber(estimated)} IO`;

  bonusIO.textContent =
    `+${formatNumber(bonus)} IO`;

  totalIO.textContent =
    `${formatNumber(total)} IO`;

  allocationResult.classList.remove("hidden");
});


// Allow Enter key inside calculator
bnbAmount.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    calculateBtn.click();
  }
});


// ===============================
// WALLET CONNECTION
// ===============================

function openWalletModal() {
  walletModal.classList.remove("hidden");
}

function closeWalletModal() {
  walletModal.classList.add("hidden");
}

connectWallet.addEventListener("click", async () => {

  if (!window.ethereum) {
    openWalletModal();
    return;
  }

  try {

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (accounts && accounts.length > 0) {
      connectWallet.textContent =
        shortenAddress(accounts[0]);
    }

  } catch (error) {

    console.error("Wallet connection failed:", error);

  }
});


modalConnectWallet.addEventListener("click", async () => {

  if (!window.ethereum) {
    modalConnectWallet.textContent = "Wallet not detected";
    return;
  }

  try {

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (accounts && accounts.length > 0) {

      connectWallet.textContent =
        shortenAddress(accounts[0]);

      closeWalletModal();

    }

  } catch (error) {

    console.error("Wallet connection failed:", error);

  }

});


closeWallet.addEventListener("click", closeWalletModal);


walletModal.addEventListener("click", (event) => {

  if (event.target === walletModal) {
    closeWalletModal();
  }

});


// ===============================
// THEME BUTTON
// ===============================

let lightMode = false;

themeToggle.addEventListener("click", () => {

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

});


// ===============================
// MARKET PRICES
// ===============================

async function loadMarketPrices() {

  try {

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=io-net,bnb&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error("Market request failed");
    }

    const data = await response.json();

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

    console.error("Unable to load market prices:", error);

    ioPriceElement.textContent = "Unavailable";
    bnbPriceElement.textContent = "Unavailable";

  }

}


// Load prices when the page opens
loadMarketPrices();


// Refresh market information periodically
setInterval(loadMarketPrices, 60000);


// ===============================
// WALLET ACCOUNT CHANGES
// ===============================

if (window.ethereum) {

  window.ethereum.on("accountsChanged", (accounts) => {

    if (!accounts || accounts.length === 0) {

      connectWallet.textContent = "Connect Wallet";

    } else {

      connectWallet.textContent =
        shortenAddress(accounts[0]);

    }

  });

}


// ===============================
// INITIAL PAGE STATE
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  allocationResult.classList.add("hidden");

  if (ioPriceElement) {
    ioPriceElement.textContent = "Loading...";
  }

  if (bnbPriceElement) {
    bnbPriceElement.textContent = "Loading...";
  }

});
