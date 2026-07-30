import React from "react";
import {
  CloudSun,
  Leaf,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Bug,
  Beaker,
  Sprout,
  Clock,
  CloudRain,
  CheckCircle2
} from "lucide-react";

// 1. Weather Card
interface WeatherCardProps {
  data: {
    location: string;
    temp: string;
    feelsLike?: string;
    humidity: string;
    wind: string;
    condition: string;
    rainfallProbability: string;
    airQuality: string;
    advice: string;
  };
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  return (
    <div className="copilot-card">
      <div className="copilot-card-header">
        <div className="copilot-card-icon">
          <CloudSun size={18} />
        </div>
        <span className="copilot-card-title">Weather Intelligence Forecast</span>
      </div>
      <div className="copilot-card-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--copilot-text)" }}>{data.temp}</span>
            <span style={{ fontSize: "12px", color: "var(--copilot-text-muted)", marginLeft: "6px" }}>
              ({data.condition})
            </span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--copilot-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={12} /> {data.location}
          </span>
        </div>

        <div className="copilot-weather-summary">
          <div>
            <div className="copilot-weather-val">{data.humidity}</div>
            <div className="copilot-weather-lbl">Humidity</div>
          </div>
          <div>
            <div className="copilot-weather-val">{data.wind}</div>
            <div className="copilot-weather-lbl">Wind</div>
          </div>
          <div>
            <div className="copilot-weather-val">{data.rainfallProbability}</div>
            <div className="copilot-weather-lbl">Rain Prob</div>
          </div>
          <div>
            <div className="copilot-weather-val">{data.airQuality}</div>
            <div className="copilot-weather-lbl">Air Quality</div>
          </div>
        </div>

        <div className="copilot-alert success" style={{ margin: "8px 0 0 0" }}>
          <div className="copilot-alert-title" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> Agricultural Outlook Action
          </div>
          <div className="copilot-alert-body">{data.advice}</div>
        </div>
      </div>
    </div>
  );
};

// 2. Disease Card
interface DiseaseCardProps {
  data: {
    disease: string;
    crop: string;
    symptoms: string;
    treatment: string;
    organicSolution?: string;
    prevention: string;
    product?: string;
    safety?: string;
    recovery?: string;
  };
}

export const DiseaseCard: React.FC<DiseaseCardProps> = ({ data }) => {
  return (
    <div className="copilot-card">
      <div className="copilot-card-header">
        <div className="copilot-card-icon" style={{ backgroundColor: "rgba(211, 47, 47, 0.08)", color: "#d32f2f" }}>
          <Leaf size={18} />
        </div>
        <span className="copilot-card-title">Crop Disease Diagnosis</span>
      </div>
      <div className="copilot-card-content" style={{ gap: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--copilot-text-muted)" }}>
            Detected Issue ({data.crop})
          </span>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#d32f2f" }}>{data.disease}</div>
        </div>

        <div style={{ borderLeft: "3px solid #ff9800", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#ff9800" }}>Key Symptoms</div>
          <div style={{ fontSize: "13px", color: "var(--copilot-text)" }}>{data.symptoms}</div>
        </div>

        <div style={{ borderLeft: "3px solid var(--copilot-primary)", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--copilot-primary)" }}>Chemical Treatment</div>
          <div style={{ fontSize: "13px", color: "var(--copilot-text)" }}>{data.treatment}</div>
          {data.product && (
            <div style={{ fontSize: "11px", fontStyle: "italic", marginTop: "2px", color: "var(--copilot-text-muted)" }}>
              Recommended Product: {data.product}
            </div>
          )}
        </div>

        {data.organicSolution && (
          <div style={{ borderLeft: "3px solid #4caf50", paddingLeft: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#4caf50" }}>Organic Control Method</div>
            <div style={{ fontSize: "13px", color: "var(--copilot-text)" }}>{data.organicSolution}</div>
          </div>
        )}

        <div className="copilot-alert warning" style={{ margin: "4px 0 0 0" }}>
          <div className="copilot-alert-title">Preventive Measures</div>
          <div className="copilot-alert-body">{data.prevention}</div>
        </div>
      </div>
    </div>
  );
};

// 3. Market Card
interface MarketCardProps {
  data: {
    crop: string;
    price: string;
    change: string;
    trend: string;
    market: string;
    location: string;
    asOfDate?: string;
    recommendation?: string;
  };
}

export const MarketCard: React.FC<MarketCardProps> = ({ data }) => {
  const isUp = data.trend?.toLowerCase() === "upward" || data.change?.includes("+");

  return (
    <div className="copilot-card">
      <div className="copilot-card-header">
        <div className="copilot-card-icon" style={{ backgroundColor: isUp ? "rgba(76, 175, 80, 0.08)" : "rgba(244, 67, 54, 0.08)", color: isUp ? "#4caf50" : "#f44336" }}>
          {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <span className="copilot-card-title">Mandi Commodity Rates</span>
      </div>
      <div className="copilot-card-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--copilot-text-muted)" }}>{data.crop} Price Index</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--copilot-text)" }}>{data.price}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: isUp ? "rgba(76, 175, 80, 0.12)" : "rgba(244, 67, 54, 0.12)",
                color: isUp ? "#2e7d32" : "#d32f2f"
              }}
            >
              {data.change}
            </span>
            <div style={{ fontSize: "10px", color: "var(--copilot-text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>
              <Calendar size={10} /> {data.asOfDate || "Today"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--copilot-text-muted)", margin: "4px 0" }}>
          <MapPin size={12} /> Registered Market: <strong>{data.market}</strong>
        </div>

        {data.recommendation && (
          <div className="copilot-alert success" style={{ margin: "8px 0 0 0" }}>
            <div className="copilot-alert-title">Trading Suggestion</div>
            <div className="copilot-alert-body">{data.recommendation}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Recommendation Card
interface RecommendationCardProps {
  data: {
    title: string;
    details: string;
    actionable: string;
  };
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ data }) => {
  return (
    <div className="copilot-card" style={{ borderLeft: "4px solid var(--copilot-primary)" }}>
      <div className="copilot-card-header">
        <div className="copilot-card-icon">
          <Sparkles size={18} />
        </div>
        <span className="copilot-card-title">{data.title || "Farming Advisory"}</span>
      </div>
      <div className="copilot-card-content">
        <p style={{ fontSize: "13.5px", color: "var(--copilot-text)", lineHeight: "1.5" }}>{data.details}</p>
        <div className="copilot-alert success" style={{ margin: "8px 0 0 0", padding: "10px" }}>
          <div className="copilot-alert-title" style={{ fontSize: "12.5px" }}>Action Steps</div>
          <div className="copilot-alert-body" style={{ fontSize: "12px" }}>{data.actionable}</div>
        </div>
      </div>
    </div>
  );
};

// 5. Diagnosis Card (Vision Pipeline — Crop Disease Report)
interface DiagnosisCardProps {
  data: {
    crop: string;
    disease: string;
    confidence: number;
    isHealthy: boolean;
    severity: string;
    summary: string;
    weatherRisk?: string | null;
    treatmentOrganic?: string[];
    treatmentChemical?: string[];
    prevention?: string[];
    expectedRecovery?: string | null;
  };
}

const SEVERITY_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  Healthy: { accent: "#4caf50", bg: "rgba(76, 175, 80, 0.08)", text: "#2e7d32" },
  Mild: { accent: "#ffc107", bg: "rgba(255, 193, 7, 0.08)", text: "#f57f17" },
  Moderate: { accent: "#ff9800", bg: "rgba(255, 152, 0, 0.08)", text: "#e65100" },
  Severe: { accent: "#f44336", bg: "rgba(244, 67, 54, 0.08)", text: "#c62828" }
};

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ data }) => {
  const colors = SEVERITY_COLORS[data.severity] || SEVERITY_COLORS.Moderate;
  const confidencePercent = Math.min(100, Math.max(0, data.confidence));

  return (
    <div className="copilot-card diagnosis-card" style={{ borderLeft: `4px solid ${colors.accent}` }}>
      {/* Header */}
      <div className="copilot-card-header">
        <div className="copilot-card-icon" style={{ backgroundColor: colors.bg, color: colors.accent }}>
          {data.isHealthy ? <CheckCircle2 size={18} /> : <Bug size={18} />}
        </div>
        <span className="copilot-card-title">Crop Health Diagnostic Report</span>
      </div>

      <div className="copilot-card-content" style={{ gap: "12px" }}>
        {/* Crop + Status Row */}
        <div className="diagnosis-status-row">
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--copilot-text-muted)", letterSpacing: "0.5px" }}>
              Crop Identified
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--copilot-text)" }}>
              🌿 {data.crop}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="diagnosis-severity-badge" style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.accent}30` }}>
              {data.isHealthy ? "✅ Healthy" : `⚠️ ${data.severity}`}
            </span>
          </div>
        </div>

        {/* Disease + Confidence */}
        {!data.isHealthy && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: colors.text, textTransform: "uppercase" }}>
                Detected Condition
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: colors.accent }}>
                {data.disease}
              </div>
            </div>
            <div className="diagnosis-confidence">
              <div className="diagnosis-confidence-bar">
                <div
                  className="diagnosis-confidence-fill"
                  style={{ width: `${confidencePercent}%`, backgroundColor: colors.accent }}
                />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: colors.text }}>
                {confidencePercent}%
              </span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ borderLeft: `3px solid var(--copilot-border)`, paddingLeft: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--copilot-text-muted)", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={11} /> Observations
          </div>
          <div style={{ fontSize: "13px", color: "var(--copilot-text)", lineHeight: 1.55 }}>
            {data.summary}
          </div>
        </div>

        {/* Weather Risk */}
        {data.weatherRisk && (
          <div className="copilot-alert warning" style={{ margin: 0 }}>
            <div className="copilot-alert-title" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CloudRain size={12} /> Weather Risk
            </div>
            <div className="copilot-alert-body">{data.weatherRisk}</div>
          </div>
        )}

        {/* Treatment Sections */}
        {data.treatmentOrganic && data.treatmentOrganic.length > 0 && (
          <div style={{ borderLeft: "3px solid #4caf50", paddingLeft: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4caf50", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Sprout size={11} /> Organic Treatment
            </div>
            <ul className="diagnosis-treatment-list">
              {data.treatmentOrganic.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {data.treatmentChemical && data.treatmentChemical.length > 0 && (
          <div style={{ borderLeft: "3px solid #2196f3", paddingLeft: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2196f3", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Beaker size={11} /> Chemical Treatment
            </div>
            <ul className="diagnosis-treatment-list">
              {data.treatmentChemical.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {data.prevention && data.prevention.length > 0 && (
          <div style={{ borderLeft: "3px solid #9c27b0", paddingLeft: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#9c27b0", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <ShieldCheck size={11} /> Prevention
            </div>
            <ul className="diagnosis-treatment-list">
              {data.prevention.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Expected Recovery */}
        {data.expectedRecovery && (
          <div className="copilot-alert success" style={{ margin: 0 }}>
            <div className="copilot-alert-title" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} /> Expected Recovery
            </div>
            <div className="copilot-alert-body">{data.expectedRecovery}</div>
          </div>
        )}
      </div>
    </div>
  );
};
