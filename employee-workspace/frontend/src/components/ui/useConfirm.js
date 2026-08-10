import { useContext } from "react";
import ConfirmContext from "./confirm-context";

const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside ConfirmProvider");
  return confirm;
};

export default useConfirm;
