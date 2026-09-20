/**
 * SafnexBD Partner Integration SDK v1.0
 * Universal Widget for WordPress, React, Next.js, Vue, PHP, Python & HTML
 * Provides: Embedded Wallet, Instant Recharge, OTP Withdrawal, Live Chat & Safe Escrow
 */
(function (window, document) {
  'use strict';

  if (window.SafnexBD) {
    return;
  }

  var DEFAULT_API_BASE = 'http://localhost:5000/api/v1';
  if (typeof window !== 'undefined' && window.location.origin.indexOf('localhost') === -1) {
    DEFAULT_API_BASE = window.location.origin + '/api/v1';
  }

  var state = {
    appId: null,
    sessionToken: null,
    apiBase: DEFAULT_API_BASE,
    theme: 'dark', // 'dark' | 'light'
    position: 'bottom-right',
    isOpen: false,
    activeTab: 'wallet', // 'wallet' | 'chat' | 'escrow'
    userData: null,
    balance: { availableBalance: 0, holdBalance: 0, currency: 'BDT', symbol: '৳' },
    messages: [],
    currentConversationId: null,
    listeners: {},
  };

  var elements = {};

  function emit(event, data) {
    if (state.listeners[event]) {
      state.listeners[event].forEach(function (cb) {
        try {
          cb(data);
        } catch (e) {
          console.error('[SafnexBD SDK] Event callback error:', e);
        }
      });
    }
  }

  function apiFetch(endpoint, options) {
    options = options || {};
    options.headers = options.headers || {};
    if (state.sessionToken) {
      options.headers['Authorization'] = 'Bearer ' + state.sessionToken;
    }
    if (state.appId) {
      options.headers['X-Safnex-App-Id'] = state.appId;
    }
    options.headers['Content-Type'] = 'application/json';

    return fetch(state.apiBase + endpoint, options).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data.message || 'API request failed');
        }
        return data;
      });
    });
  }

  function createStyles() {
    if (document.getElementById('safnexbd-sdk-styles')) return;

    var css = `
      #safnexbd-launcher {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4), 0 8px 10px -6px rgba(2, 132, 199, 0.2);
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
      }
      #safnexbd-launcher:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 14px 28px -5px rgba(2, 132, 199, 0.5);
      }
      #safnexbd-launcher.pos-left {
        right: auto;
        left: 24px;
      }
      #safnexbd-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #safnexbd-modal-overlay.open {
        display: flex;
        opacity: 1;
      }
      #safnexbd-modal-card {
        width: 95%;
        max-width: 440px;
        height: 600px;
        max-height: 90vh;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #1e293b;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: safnexbdFadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes safnexbdFadeUp {
        from { transform: translateY(20px) scale(0.97); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      .tbd-header {
        padding: 16px 20px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .tbd-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .tbd-brand-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #0284c7;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-size: 16px;
      }
      .tbd-brand-title {
        font-size: 15px;
        font-weight: 700;
        color: #f8fafc;
      }
      .tbd-brand-sub {
        font-size: 11px;
        color: #38bdf8;
      }
      .tbd-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: 0.15s;
      }
      .tbd-close-btn:hover {
        background: #334155;
        color: #fff;
      }
      .tbd-nav {
        display: flex;
        background: #0f172a;
        border-bottom: 1px solid #1e293b;
      }
      .tbd-tab-btn {
        flex: 1;
        padding: 12px 10px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #94a3b8;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
        text-align: center;
      }
      .tbd-tab-btn.active {
        color: #38bdf8;
        border-bottom-color: #38bdf8;
        background: rgba(56, 189, 248, 0.05);
      }
      .tbd-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }
      .tbd-card-metric {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: center;
      }
      .tbd-metric-label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .tbd-metric-val {
        font-size: 28px;
        font-weight: 800;
        color: #38bdf8;
      }
      .tbd-metric-hold {
        font-size: 12px;
        color: #f59e0b;
        margin-top: 4px;
      }
      .tbd-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      .tbd-btn {
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: 0.15s;
        text-align: center;
      }
      .tbd-btn-primary {
        background: #0284c7;
        color: #fff;
      }
      .tbd-btn-primary:hover {
        background: #0369a1;
      }
      .tbd-btn-secondary {
        background: #334155;
        color: #f8fafc;
      }
      .tbd-btn-secondary:hover {
        background: #475569;
      }
      .tbd-chat-box {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .tbd-chat-msgs {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 4px;
      }
      .tbd-msg-item {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.4;
      }
      .tbd-msg-mine {
        align-self: flex-end;
        background: #0284c7;
        color: #fff;
        border-bottom-right-radius: 2px;
      }
      .tbd-msg-theirs {
        align-self: flex-start;
        background: #1e293b;
        color: #e2e8f0;
        border-bottom-left-radius: 2px;
      }
      .tbd-chat-input-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .tbd-chat-input {
        flex: 1;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 10px 12px;
        color: #fff;
        font-size: 13px;
        outline: none;
      }
      .tbd-chat-input:focus {
        border-color: #38bdf8;
      }
      .tbd-input-group {
        margin-bottom: 12px;
        text-align: left;
      }
      .tbd-input-group label {
        display: block;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 4px;
      }
      .tbd-input-group input, .tbd-input-group select {
        width: 100%;
        box-sizing: border-box;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 12px;
        color: #fff;
        font-size: 13px;
        outline: none;
      }
      .tbd-input-group input:focus, .tbd-input-group select:focus {
        border-color: #38bdf8;
      }
      .tbd-notice {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
        text-align: center;
        margin-top: 14px;
      }
    `;

    var styleEl = document.createElement('style');
    styleEl.id = 'safnexbd-sdk-styles';
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }

  function renderWidget() {
    createStyles();

    // Launcher button
    var launcher = document.createElement('div');
    launcher.id = 'safnexbd-launcher';
    if (state.position === 'bottom-left') {
      launcher.classList.add('pos-left');
    }
    launcher.innerHTML = `
      <div style="width: 20px; height: 20px; border-radius: 50%; background: #fff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">৳</div>
      <span>SafnexBD</span>
    `;
    launcher.onclick = function () {
      SafnexBD.toggle();
    };
    document.body.appendChild(launcher);
    elements.launcher = launcher;

    // Modal overlay
    var overlay = document.createElement('div');
    overlay.id = 'safnexbd-modal-overlay';
    overlay.innerHTML = `
      <div id="safnexbd-modal-card">
        <div class="tbd-header">
          <div class="tbd-brand">
            <div class="tbd-brand-logo">T</div>
            <div>
              <div class="tbd-brand-title">SafnexBD Secured</div>
              <div class="tbd-brand-sub" id="tbd-app-label">Instant Wallet & Escrow</div>
            </div>
          </div>
          <button class="tbd-close-btn" id="tbd-close-modal">&times;</button>
        </div>
        <div class="tbd-nav">
          <button class="tbd-tab-btn active" id="tbd-tab-wallet">Wallet</button>
          <button class="tbd-tab-btn" id="tbd-tab-chat">Live Chat</button>
          <button class="tbd-tab-btn" id="tbd-tab-escrow">Escrow Deals</button>
        </div>
        <div class="tbd-content" id="tbd-content-container">
          <!-- Dynamic Views Injected Here -->
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    elements.overlay = overlay;

    // Overlay events
    document.getElementById('tbd-close-modal').onclick = function () {
      SafnexBD.close();
    };
    overlay.onclick = function (e) {
      if (e.target === overlay) {
        SafnexBD.close();
      }
    };

    // Tab buttons
    document.getElementById('tbd-tab-wallet').onclick = function () {
      setTab('wallet');
    };
    document.getElementById('tbd-tab-chat').onclick = function () {
      setTab('chat');
    };
    document.getElementById('tbd-tab-escrow').onclick = function () {
      setTab('escrow');
    };

    renderContent();
  }

  function setTab(tab) {
    state.activeTab = tab;
    var tabs = ['wallet', 'chat', 'escrow'];
    tabs.forEach(function (t) {
      var btn = document.getElementById('tbd-tab-' + t);
      if (btn) {
        if (t === tab) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    renderContent();
  }

  function renderContent() {
    var container = document.getElementById('tbd-content-container');
    if (!container) return;

    if (state.activeTab === 'wallet') {
      renderWalletView(container);
    } else if (state.activeTab === 'chat') {
      renderChatView(container);
    } else if (state.activeTab === 'escrow') {
      renderEscrowView(container);
    }
  }

  function renderWalletView(container) {
    container.innerHTML = `
      <div class="tbd-card-metric">
        <div class="tbd-metric-label">Available Balance</div>
        <div class="tbd-metric-val">৳${state.balance.availableBalance.toFixed(2)}</div>
        <div class="tbd-metric-hold">Escrow In-Hold: ৳${state.balance.holdBalance.toFixed(2)}</div>
      </div>

      <div class="tbd-actions">
        <button class="tbd-btn tbd-btn-primary" id="tbd-btn-recharge-modal">⚡ Instant Recharge</button>
        <button class="tbd-btn tbd-btn-secondary" id="tbd-btn-withdraw-modal">💸 Withdraw OTP</button>
      </div>

      <div id="tbd-wallet-action-container" style="display: none; background: #1e293b; padding: 14px; border-radius: 12px; margin-top: 10px;"></div>

      <div class="tbd-notice">
        Secured by SafnexBD 256-bit encryption. Funds held safely in escrow until deal completion.
      </div>
    `;

    document.getElementById('tbd-btn-recharge-modal').onclick = function () {
      showRechargeForm();
    };

    document.getElementById('tbd-btn-withdraw-modal').onclick = function () {
      showWithdrawForm();
    };
  }

  function showRechargeForm() {
    var act = document.getElementById('tbd-wallet-action-container');
    act.style.display = 'block';
    act.innerHTML = `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #38bdf8;">Recharge SafnexBD Wallet</div>
      <div class="tbd-input-group">
        <label>Select Gateway</label>
        <select id="tbd-rc-method">
          <option value="BKASH">bKash Online Payment</option>
          <option value="SSLCOMMERZ">SSLCommerz (Cards & MFS)</option>
        </select>
      </div>
      <div class="tbd-input-group">
        <label>Amount (BDT)</label>
        <input type="number" id="tbd-rc-amount" value="500" min="10" placeholder="Minimum ৳10" />
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="tbd-btn tbd-btn-primary" style="flex: 1;" id="tbd-rc-submit">Proceed to Payment</button>
        <button class="tbd-btn tbd-btn-secondary" id="tbd-rc-cancel">Cancel</button>
      </div>
    `;

    document.getElementById('tbd-rc-cancel').onclick = function () {
      act.style.display = 'none';
    };

    document.getElementById('tbd-rc-submit').onclick = function () {
      var amt = parseFloat(document.getElementById('tbd-rc-amount').value);
      var m = document.getElementById('tbd-rc-method').value;
      if (!amt || amt < 10) {
        alert('Please enter a valid amount (Min ৳10)');
        return;
      }
      SafnexBD.recharge(amt, m);
    };
  }

  function showWithdrawForm() {
    var act = document.getElementById('tbd-wallet-action-container');
    act.style.display = 'block';
    act.innerHTML = `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #f59e0b;">Withdraw Funds (OTP Verified)</div>
      <div class="tbd-input-group">
        <label>Withdrawal Method</label>
        <select id="tbd-wd-method">
          <option value="BKASH">bKash Personal</option>
          <option value="NAGAD">Nagad</option>
          <option value="ROCKET">Rocket</option>
          <option value="BANK">Bank Account</option>
        </select>
      </div>
      <div class="tbd-input-group">
        <label>Destination Account Number / Phone</label>
        <input type="text" id="tbd-wd-account" placeholder="e.g. 017xxxxxxxx" />
      </div>
      <div class="tbd-input-group">
        <label>Amount (BDT)</label>
        <input type="number" id="tbd-wd-amount" value="500" min="50" />
      </div>
      <div class="tbd-input-group" id="tbd-otp-group" style="display: none;">
        <label>Enter 6-digit OTP received on phone/email</label>
        <input type="text" id="tbd-wd-otp" placeholder="6-digit OTP code" maxlength="6" />
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="tbd-btn tbd-btn-primary" style="flex: 1;" id="tbd-wd-btn-send-otp">Request 6-digit OTP</button>
        <button class="tbd-btn tbd-btn-secondary" id="tbd-wd-cancel">Cancel</button>
      </div>
    `;

    document.getElementById('tbd-wd-cancel').onclick = function () {
      act.style.display = 'none';
    };

    var otpSent = false;
    var btn = document.getElementById('tbd-wd-btn-send-otp');
    btn.onclick = function () {
      var amt = parseFloat(document.getElementById('tbd-wd-amount').value);
      var acc = document.getElementById('tbd-wd-account').value;
      var method = document.getElementById('tbd-wd-method').value;

      if (!amt || amt < 50) {
        alert('Minimum withdrawal amount is ৳50');
        return;
      }
      if (!acc) {
        alert('Please specify your destination account number');
        return;
      }

      if (!otpSent) {
        btn.disabled = true;
        btn.innerText = 'Sending OTP...';
        SafnexBD.sendWithdrawOtp({ amount: amt, destination: acc })
          .then(function () {
            otpSent = true;
            document.getElementById('tbd-otp-group').style.display = 'block';
            btn.disabled = false;
            btn.innerText = 'Confirm Withdrawal';
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.innerText = 'Request 6-digit OTP';
            alert('Failed to send OTP: ' + err.message);
          });
      } else {
        var otp = document.getElementById('tbd-wd-otp').value;
        if (!otp || otp.length < 4) {
          alert('Please enter the received OTP code');
          return;
        }
        btn.disabled = true;
        btn.innerText = 'Submitting...';
        SafnexBD.withdraw({
          amount: amt,
          destinationAccount: acc,
          method: method,
          otpCode: otp,
        })
          .then(function (res) {
            alert('Withdrawal request submitted successfully!');
            act.style.display = 'none';
            SafnexBD.refreshBalance();
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.innerText = 'Confirm Withdrawal';
            alert('Withdrawal error: ' + err.message);
          });
      }
    };
  }

  function renderChatView(container) {
    container.innerHTML = `
      <div class="tbd-chat-box">
        <div class="tbd-chat-msgs" id="tbd-chat-messages">
          <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
            End-to-end encrypted order chat between buyer and seller.
          </div>
        </div>
        <div class="tbd-chat-input-row">
          <input type="text" class="tbd-chat-input" id="tbd-msg-input" placeholder="Type a message..." />
          <button class="tbd-btn tbd-btn-primary" id="tbd-msg-send">Send</button>
        </div>
      </div>
    `;

    var sendBtn = document.getElementById('tbd-msg-send');
    var input = document.getElementById('tbd-msg-input');

    function doSend() {
      var text = input.value.trim();
      if (!text || !state.currentConversationId) {
        if (!state.currentConversationId) {
          alert('No active conversation initialized yet.');
        }
        return;
      }
      input.value = '';
      SafnexBD.sendMessage(state.currentConversationId, text);
    }

    sendBtn.onclick = doSend;
    input.onkeydown = function (e) {
      if (e.key === 'Enter') doSend();
    };
  }

  function renderEscrowView(container) {
    container.innerHTML = `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">SafnexBD Safe Escrow System</div>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
        Whenever a transaction occurs on this website, buyer funds are securely held in SafnexBD escrow.
        Once the seller delivers the product or service, the buyer releases the funds safely.
      </p>
      <div style="margin-top: 16px; padding: 14px; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
        <div style="display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; font-size: 13px;">
          <span>🛡️ 100% Money-Back Guarantee</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
          If any dispute arises, our 24/7 arbitration team reviews chat logs, transaction proofs, and disburses funds fairly.
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Public SDK Methods
  // ==========================================================================
  var SafnexBD = {
    init: function (config) {
      if (!config || !config.appId) {
        console.error('[SafnexBD SDK] Error: appId is required in config.');
        return;
      }
      state.appId = config.appId;
      if (config.sessionToken) state.sessionToken = config.sessionToken;
      if (config.apiBase) state.apiBase = config.apiBase;
      if (config.theme) state.theme = config.theme;
      if (config.position) state.position = config.position;

      renderWidget();

      // Fetch public app info
      apiFetch('/partner/config/' + state.appId)
        .then(function (info) {
          var lbl = document.getElementById('tbd-app-label');
          if (lbl && info.name) {
            lbl.innerText = info.name + ' Partner';
          }
        })
        .catch(function () {});

      if (state.sessionToken) {
        SafnexBD.refreshBalance();
      }

      if (typeof config.onReady === 'function') {
        config.onReady();
      }
    },

    setSessionToken: function (token) {
      state.sessionToken = token;
      SafnexBD.refreshBalance();
    },

    on: function (event, callback) {
      if (!state.listeners[event]) state.listeners[event] = [];
      state.listeners[event].push(callback);
    },

    open: function (tab) {
      state.isOpen = true;
      if (elements.overlay) elements.overlay.classList.add('open');
      if (tab) setTab(tab);
      emit('open', { tab: state.activeTab });
    },

    close: function () {
      state.isOpen = false;
      if (elements.overlay) elements.overlay.classList.remove('open');
      emit('close', {});
    },

    toggle: function () {
      if (state.isOpen) SafnexBD.close();
      else SafnexBD.open();
    },

    refreshBalance: function () {
      return apiFetch('/partner/wallet/balance')
        .then(function (res) {
          state.balance = res;
          emit('balanceChange', res);
          if (state.isOpen && state.activeTab === 'wallet') {
            renderContent();
          }
          return res;
        })
        .catch(function (err) {
          console.warn('[SafnexBD SDK] Failed to fetch balance:', err);
        });
    },

    recharge: function (amount, method) {
      return apiFetch('/partner/wallet/recharge/initiate', {
        method: 'POST',
        body: JSON.stringify({ amount: amount, method: method }),
      }).then(function (res) {
        if (res.checkoutUrl) {
          window.open(res.checkoutUrl, '_blank', 'width=500,height=700');
        }
        return res;
      });
    },

    sendWithdrawOtp: function (data) {
      return apiFetch('/partner/wallet/withdraw/send-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    withdraw: function (data) {
      return apiFetch('/partner/wallet/withdraw/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    openChat: function (peerPartnerUserId, title) {
      SafnexBD.open('chat');
      return apiFetch('/partner/chat/conversation', {
        method: 'POST',
        body: JSON.stringify({ peerPartnerUserId: peerPartnerUserId, title: title }),
      }).then(function (conv) {
        state.currentConversationId = conv.id;
        SafnexBD.loadMessages(conv.id);
        return conv;
      });
    },

    loadMessages: function (conversationId) {
      return apiFetch('/partner/chat/messages?conversationId=' + conversationId).then(function (
        msgs,
      ) {
        state.messages = msgs;
        var box = document.getElementById('tbd-chat-messages');
        if (box) {
          box.innerHTML = '';
          msgs.forEach(function (m) {
            var el = document.createElement('div');
            el.className =
              'tbd-msg-item ' +
              (m.senderId === state.userData?.safnexUserId
                ? 'tbd-msg-mine'
                : 'tbd-msg-theirs');
            el.innerText = m.content;
            box.appendChild(el);
          });
          box.scrollTop = box.scrollHeight;
        }
        return msgs;
      });
    },

    sendMessage: function (conversationId, content) {
      return apiFetch('/partner/chat/send', {
        method: 'POST',
        body: JSON.stringify({ conversationId: conversationId, content: content }),
      }).then(function (msg) {
        var box = document.getElementById('tbd-chat-messages');
        if (box) {
          var el = document.createElement('div');
          el.className = 'tbd-msg-item tbd-msg-mine';
          el.innerText = content;
          box.appendChild(el);
          box.scrollTop = box.scrollHeight;
        }
        return msg;
      });
    },
  };

  window.SafnexBD = SafnexBD;
})(window, document);

