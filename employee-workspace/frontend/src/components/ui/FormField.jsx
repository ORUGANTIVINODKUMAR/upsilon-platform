import { Children, cloneElement, isValidElement, useId } from "react";

// Keep existing inputs, validation and handlers; associate legacy sibling labels.
export default function FormField({ children, className = "input-group", ...props }) {
  const generatedId = useId();
  const items = Children.toArray(children);
  const controls = items.filter(child => isValidElement(child) && ["input", "select", "textarea"].includes(child.type));
  const control = controls.length === 1 ? controls[0] : null;
  const id = control?.props.id || `field-${generatedId}`;
  return <div {...props} className={className}>{items.map(child => {
    if (!isValidElement(child) || !control) return child;
    if (child === control) return cloneElement(child, { id });
    if (child.type === "label") return cloneElement(child, { htmlFor: id });
    return child;
  })}</div>;
}
