import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import ConfirmContext from "./confirm-context";

const ConfirmProvider = ({ children }) => {
  const resolverRef = useRef(null);
  const [options, setOptions] = useState(null);

  const confirm = useCallback((nextOptions) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setOptions(nextOptions);
  }), []);

  const finish = (result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(options)}
        title={options?.title}
        description={options?.description}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        tone={options?.tone}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
