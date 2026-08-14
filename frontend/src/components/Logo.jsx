import React from "react";

const publicUrl = process.env.PUBLIC_URL || "";
const LOGO_COLOR = `${publicUrl}/images/artnovax-wordmark.png`;
const LOGO_WHITE = `${publicUrl}/images/artnovax-wordmark-white.png`;

const Logo = ({ className = "", variant = "default" }) => {
  const isLight = variant === "light";
  const src = isLight ? LOGO_WHITE : LOGO_COLOR;

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={src}
        alt="ArtNovaX Mental Health Foundation"
        draggable={false}
        className="block h-[54px] md:h-[62px] w-auto max-w-[260px] object-contain"
      />
    </div>
  );
};

export const LogoWithTagline = ({ variant = "default" }) => (
  <Logo variant={variant} />
);
export default Logo;
