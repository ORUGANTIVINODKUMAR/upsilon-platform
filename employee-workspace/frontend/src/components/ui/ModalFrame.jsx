import { useEffect, useId, useRef } from "react";

const stack = [];
const selector = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A presentation wrapper for the existing dialogs. Submission and dismissal
// remain owned by each screen, including dialogs which cannot be dismissed.
export default function ModalFrame({ children, as: Tag = "div", onClose, ...props }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  const id = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stack.push(dialog);
    const heading = dialog.querySelector("h2, h3");
    if (!dialog.hasAttribute("aria-label") && !dialog.hasAttribute("aria-labelledby") && heading) {
      if (!heading.id) heading.id = `dialog-${id}`;
      dialog.setAttribute("aria-labelledby", heading.id);
    }
    const focusable = () => [...dialog.querySelectorAll(selector)].filter(element => element.getClientRects().length && !element.closest('[inert]'));
    const timer = window.setTimeout(() => {
      if (stack.at(-1) === dialog) (dialog.querySelector("[autofocus]") || (dialog.contains(document.activeElement) ? document.activeElement : focusable()[0]) || dialog).focus();
    }, 0);
    const keydown = event => {
      if (stack.at(-1) !== dialog) return;
      // Confirmation dialogs manage their own keyboard lifecycle.
      const confirmation = document.querySelector('[role="alertdialog"]');
      if (confirmation && confirmation !== dialog && !dialog.contains(confirmation)) return;
      if (event.key === "Escape" && closeRef.current) {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      window.clearTimeout(timer);
      stack.splice(stack.indexOf(dialog), 1);
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [id]);
  return <Tag {...props} ref={ref} role={props.role || "dialog"} aria-modal="true" tabIndex={-1}>{children}</Tag>;
}
