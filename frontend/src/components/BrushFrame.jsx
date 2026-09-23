import React from "react";

// Reusable brush-frame image component with organic mask + burgundy paint outline.
const BrushFrame = ({
  src,
  alt,
  className = "",
  aspect = "aspect-[4/3]",
  objectPosition = "center",
}) => {
  /*
   * Static-first pages intentionally allow an empty media slot when a hero
   * image has not yet been promoted from the CMS into the repository.
   * Avoid rendering <img src="">, which can trigger an unnecessary request
   * for the current document and create a broken-image flash.
   */
  if (!src) {
    return (
      <div
        className={`brush-frame relative ${aspect} ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`brush-frame relative ${aspect} ${className}`}>
      <img src={src} alt={alt || ""} style={{ objectPosition }} />
    </div>
  );
};

export default BrushFrame;
