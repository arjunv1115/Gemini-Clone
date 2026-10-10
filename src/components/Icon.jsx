import { assets } from "../assets/assets";

// Colored icons keep their colors in dark mode; the rest are line icons that get inverted.
const COLORED = new Set(["gemini_icon", "youtube_icon", "user_icon"]);

export default function Icon({ name, size = 20, className = "", alt = "", ...rest }) {
  const src = assets[name];
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      draggable={false}
      className={`icon ${COLORED.has(name) ? "" : "icon-mono"} ${className}`}
      {...rest}
    />
  );
}
