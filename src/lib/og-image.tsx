import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export function createVowenaOgImage({
  eyebrow,
  title,
  description,
  path,
  statLabel = "Stellar",
  statValue = "USDC",
}: {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  statLabel?: string;
  statValue?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FEFCFF",
          color: "#0E0D18",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(#C5C0D8 1px, transparent 1px), linear-gradient(90deg, #C5C0D8 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#6B4EFF",
          }}
        />

        <div
          style={{
            width: "58%",
            padding: "62px 54px 58px 70px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <VowenaMark />
            <span
              style={{
                fontSize: 22,
                fontWeight: 650,
                color: "#0E0D18",
              }}
            >
              vowena
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#6B4EFF",
              }}
            >
              {eyebrow}
            </span>
            <span
              style={{
                fontSize: 54,
                fontWeight: 700,
                lineHeight: 1.02,
                color: "#0E0D18",
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: 20,
                lineHeight: 1.45,
                color: "#48436A",
                maxWidth: 560,
              }}
            >
              {description}
            </span>
          </div>

          <span style={{ fontSize: 14, color: "#6E6894" }}>{path}</span>
        </div>

        <div
          style={{
            width: "42%",
            padding: "70px 70px 70px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 420,
              border: "1px solid #E8E5F0",
              borderRadius: 8,
              background: "#FFFFFF",
              boxShadow: "0 22px 70px rgba(14, 13, 24, 0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid #E8E5F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#6E6894",
                  }}
                >
                  Status
                </span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>
                  On-chain
                </span>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: "#EDE9FF",
                  color: "#6B4EFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <VowenaMark size={26} />
              </div>
            </div>

            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {[
                ["Network", statLabel],
                ["Asset", statValue],
                ["Settlement", "Exact tx hash"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: "1px solid #F6F4FA",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#6E6894",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}

function VowenaMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path
        d="M44 18C44 18 28 22 24 40C20 58 36 62 36 62"
        stroke="#6B4EFF"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 62C36 62 52 58 56 40C60 22 44 18 44 18"
        stroke="#6B4EFF"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
      <circle cx="40" cy="40" r="3.5" fill="#6B4EFF" />
    </svg>
  );
}
