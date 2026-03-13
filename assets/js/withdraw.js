document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined") {
    gsap.fromTo(".psp-hero-text", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
    gsap.to(".login-card", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });
  } else {
    const card = document.querySelector(".login-card");
    const text = document.querySelector(".psp-hero-text");
    if (card) { card.style.opacity = "1"; card.style.transform = "none"; }
    if (text) { text.style.opacity = "1"; text.style.transform = "none"; }
  }

  const API_URL = "https://script.google.com/macros/s/AKfycbwWNsRWtnGwvE66VpDOeishxk6jGRT6oJ6Qup73vgHI7mjbMvPPQoTAFcdeHC9CD-_RJQ/exec";
  const ENROLL_WEBHOOK = "https://script.google.com/macros/s/AKfycbyck7pBRCWeseen7SkV4ntkgjRmZ4IepOOwWXq75pk3WbJQnFrVVTV-6FmBoyullnT4/exec";
  
  const els = {
    pid: document.getElementById("w_pid"),
    ppass: document.getElementById("w_ppass"),
    verifyBtn: document.getElementById("verifyBtn"),
    authError: document.getElementById("authError"),
    step1: document.getElementById("step1-auth"),
    step2: document.getElementById("step2-withdraw"),
    step3: document.getElementById("step3-success"),
    availableBalanceDisplay: document.getElementById("availableBalance"),
    emailInput: document.getElementById("w_email"),
    amountInput: document.getElementById("w_amount"),
    methodSelect: document.getElementById("w_method"),
    networkWrapper: document.getElementById("networkWrapper"),
    networkSelect: document.getElementById("w_network"),
    addressInput: document.getElementById("w_address"),
    submitBtn: document.getElementById("submitWithdrawBtn"),
    withdrawError: document.getElementById("withdrawError")
  };
      const toggleWPass = document.getElementById("toggleWPass");
  if (toggleWPass && els.ppass) {
    toggleWPass.addEventListener("click", function () {
      const isPassword = els.ppass.getAttribute("type") === "password";
      els.ppass.setAttribute("type", isPassword ? "text" : "password");
      
      this.classList.remove("fa-eye", "fa-eye-slash");
      this.classList.add(isPassword ? "fa-eye" : "fa-eye-slash");
    });
  }
  let maxAvailableBalance = 0;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('pid')) {
    els.pid.value = urlParams.get('pid');
  }

  function updateSmartInfo() {
    const box = document.getElementById("smartInfoBox");
    const estTime = document.getElementById("estTime");
    const estFee = document.getElementById("estFee");
    const method = els.methodSelect.value;
    const network = els.networkSelect.value;

    if (!method) {
      if (box) box.style.display = "none";
      return;
    }

    if (box) {
      box.style.display = "block";
      if (typeof gsap !== "undefined" && box.style.opacity === "") {
        gsap.fromTo(box, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
      }
    }

    if (method === "PayPal") {
      els.networkWrapper.style.display = "none";
      els.networkSelect.value = "";
      els.addressInput.placeholder = "PayPal Email Address";
      if (estTime) estTime.textContent = "24 - 48 Hours";
      if (estFee) estFee.textContent = "0% (Covered by OPTILINE)";
    } else if (method === "Crypto") {
      els.networkWrapper.style.display = "block";
      els.addressInput.placeholder = "USDT Wallet Address";
      if (estTime) estTime.textContent = "1 - 2 Hours";
      
      if (network === "TRC20" || network === "Polygon" || network === "BEP20") {
        if (estFee) estFee.textContent = "~$1.00 USD";
      } else if (network === "ERC20") {
        if (estFee) estFee.textContent = "~$5.00 - $15.00 USD";
      } else {
        if (estFee) estFee.textContent = "Select Network";
      }
    }
  }

  els.methodSelect.addEventListener("change", updateSmartInfo);
  if (els.networkSelect) els.networkSelect.addEventListener("change", updateSmartInfo);

  els.verifyBtn.addEventListener("click", () => {
    const id = els.pid.value.trim();
    const pass = els.ppass.value.trim();

    if (!id || !pass) {
      showError(els.authError, "Please enter both Partner ID and Access Key.");
      return;
    }

    els.verifyBtn.disabled = true;
    els.verifyBtn.querySelector(".btn-txt").textContent = "Verifying...";
    els.authError.style.display = "none";

    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "partner_login",
        partnerId: id,
        password: pass,
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        calculateBalanceAndProceed(data.data.transactions);
      } else {
        showError(els.authError, "Invalid credentials.");
        resetVerifyBtn();
      }
    })
    .catch((err) => {
      showError(els.authError, "Connection failed. Please check your internet.");
      resetVerifyBtn();
    });
  });

  function calculateBalanceAndProceed(transactions) {
    const paidTransactions = transactions.filter(tx => tx.status === "Paid");
    maxAvailableBalance = paidTransactions.reduce((sum, tx) => sum + (parseFloat(tx.commission) || 0), 0);

    if (maxAvailableBalance < 100) {
      showError(els.authError, `Your available balance is $${maxAvailableBalance}. Minimum withdrawal is $100.`);
      resetVerifyBtn();
      return;
    }

    els.availableBalanceDisplay.textContent = `$${maxAvailableBalance.toLocaleString()}`;
    
    if (typeof gsap !== "undefined") {
      gsap.to(els.step1, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        onComplete: () => {
          els.step1.style.display = "none";
          els.step2.style.display = "block";
          gsap.fromTo(els.step2, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
        }
      });
    } else {
      els.step1.style.display = "none";
      els.step2.style.display = "block";
    }
  }

  els.submitBtn.addEventListener("click", () => {
    const email = els.emailInput.value.trim();
    const amount = parseFloat(els.amountInput.value);
    const method = els.methodSelect.value;
    const network = els.networkSelect.value;
    const address = els.addressInput.value.trim();
    
    els.withdrawError.style.display = "none";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(els.withdrawError, "Please enter a valid email address."); return;
    }
    if (!amount || isNaN(amount) || amount < 100) {
      showError(els.withdrawError, "Minimum withdrawal amount is $100."); return;
    }
    if (amount > maxAvailableBalance) {
      showError(els.withdrawError, `Amount exceeds available balance! Maximum: $${maxAvailableBalance}.`); return;
    }
    if (!method) {
      showError(els.withdrawError, "Please select a payout method."); return;
    }
    if (method === "Crypto") {
      if (!network) {
        showError(els.withdrawError, "Please select a transfer network for USDT."); return;
      }
      if (network === "TRC20" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
        showError(els.withdrawError, "Invalid TRC20 wallet address. It must start with 'T' and be 34 characters long."); return;
      }
      if ((network === "ERC20" || network === "BEP20" || network === "Polygon") && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        showError(els.withdrawError, "Invalid wallet address for the selected network. It must start with '0x'."); return;
      }
    } else if (method === "PayPal") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
        showError(els.withdrawError, "Invalid PayPal email address."); return;
      }
    }
    
    const finalMethod = method === "Crypto" ? `USDT (${network})` : method;

    els.submitBtn.disabled = true;
    els.submitBtn.querySelector(".btn-txt").textContent = "Processing...";

    fetch(ENROLL_WEBHOOK, {
      method: "POST",
      body: JSON.stringify({
        action: "withdraw_request",
        partnerId: els.pid.value.trim(),
        email: email,
        amount: amount,
        method: finalMethod,
        address: address,
        timestamp: new Date().toISOString()
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (typeof gsap !== "undefined") {
        gsap.to(els.step2, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          onComplete: () => {
            els.step2.style.display = "none";
            els.step3.style.display = "block";
            gsap.fromTo(els.step3, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 });
          }
        });
      } else {
        els.step2.style.display = "none";
        els.step3.style.display = "block";
      }
    })
    .catch(err => {
      showError(els.withdrawError, "Network error. Please try again later.");
      els.submitBtn.disabled = false;
      els.submitBtn.querySelector(".btn-txt").textContent = "Confirm Withdrawal";
    });
  });

  function showError(element, msg) {
    element.textContent = msg;
    element.style.display = "block";
    if (typeof gsap !== "undefined") {
      gsap.fromTo(element, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
    }
  }

  function resetVerifyBtn() {
    els.verifyBtn.disabled = false;
    els.verifyBtn.querySelector(".btn-txt").textContent = "Verify & Load Balance";
  }
  [els.pid, els.ppass].forEach(input => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          els.verifyBtn.click();
        }
      });
    }
  });

  [els.emailInput, els.amountInput, els.addressInput].forEach(input => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          els.submitBtn.click();
        }
      });
    }
  });
});
