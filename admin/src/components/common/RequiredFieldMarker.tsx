"use client";

import { useEffect } from "react";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * App-wide: an empty `required` field blocks the submit as before, but instead of the browser's
 * "Please fill out this field" tooltip it gets `data-invalid` (red border, see globals.css), and the
 * first one is focused. The mark clears as soon as the field is filled.
 */
export default function RequiredFieldMarker() {
  useEffect(() => {
    let focusedThisSubmit = false;

    const onInvalid = (e: Event) => {
      const field = e.target as Field;
      e.preventDefault(); // no native tooltip
      field.setAttribute("data-invalid", "");
      // `invalid` fires once per bad field in one submit; focus only the first.
      if (!focusedThisSubmit) {
        focusedThisSubmit = true;
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => (focusedThisSubmit = false));
      }
    };

    const onEdit = (e: Event) => {
      const field = e.target as Field;
      if (field.hasAttribute?.("data-invalid") && field.validity?.valid) field.removeAttribute("data-invalid");
    };

    // Capture: `invalid` doesn't bubble.
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, []);

  return null;
}
