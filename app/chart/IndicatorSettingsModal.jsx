"use client";

import { useState } from "react";

export default function IndicatorSettingsModal({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  const handleChange = (indicator, field, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [indicator]: {
        ...prev[indicator],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Indicator Settings</h3>
          <button className="closeBtn" onClick={onClose}>✕</button>
        </div>
        <div className="modalBody">
          {/* SMA 20 */}
          <div className="settingGroup">
            <h4>Simple Moving Average (SMA 20)</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.sma20?.period || 20}
                  onChange={(e) => handleChange("sma20", "period", Number(e.target.value))}
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={localSettings.sma20?.color || "#f59e0b"}
                  onChange={(e) => handleChange("sma20", "color", e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* SMA 50 */}
          <div className="settingGroup">
            <h4>Simple Moving Average (SMA 50)</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.sma50?.period || 50}
                  onChange={(e) => handleChange("sma50", "period", Number(e.target.value))}
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={localSettings.sma50?.color || "#a855f7"}
                  onChange={(e) => handleChange("sma50", "color", e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* EMA 9 */}
          <div className="settingGroup">
            <h4>Exponential Moving Average (EMA 9)</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.ema9?.period || 9}
                  onChange={(e) => handleChange("ema9", "period", Number(e.target.value))}
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={localSettings.ema9?.color || "#22d3ee"}
                  onChange={(e) => handleChange("ema9", "color", e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* EMA 21 */}
          <div className="settingGroup">
            <h4>Exponential Moving Average (EMA 21)</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.ema21?.period || 21}
                  onChange={(e) => handleChange("ema21", "period", Number(e.target.value))}
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={localSettings.ema21?.color || "#fb923c"}
                  onChange={(e) => handleChange("ema21", "color", e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Bollinger Bands */}
          <div className="settingGroup">
            <h4>Bollinger Bands</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.bb?.period || 20}
                  onChange={(e) => handleChange("bb", "period", Number(e.target.value))}
                />
              </label>
              <label>
                StdDev:
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.bb?.mult || 2}
                  onChange={(e) => handleChange("bb", "mult", Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          {/* RSI */}
          <div className="settingGroup">
            <h4>RSI</h4>
            <div className="settingRow">
              <label>
                Length:
                <input
                  type="number"
                  value={localSettings.rsi?.period || 14}
                  onChange={(e) => handleChange("rsi", "period", Number(e.target.value))}
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={localSettings.rsi?.color || "#c084fc"}
                  onChange={(e) => handleChange("rsi", "color", e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* MACD */}
          <div className="settingGroup">
            <h4>MACD</h4>
            <div className="settingRow">
              <label>
                Fast:
                <input
                  type="number"
                  value={localSettings.macd?.fast || 12}
                  onChange={(e) => handleChange("macd", "fast", Number(e.target.value))}
                />
              </label>
              <label>
                Slow:
                <input
                  type="number"
                  value={localSettings.macd?.slow || 26}
                  onChange={(e) => handleChange("macd", "slow", Number(e.target.value))}
                />
              </label>
              <label>
                Signal:
                <input
                  type="number"
                  value={localSettings.macd?.signal || 9}
                  onChange={(e) => handleChange("macd", "signal", Number(e.target.value))}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="modalFooter">
          <button className="secondaryBtn" onClick={onClose}>Cancel</button>
          <button className="primaryBtn" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
