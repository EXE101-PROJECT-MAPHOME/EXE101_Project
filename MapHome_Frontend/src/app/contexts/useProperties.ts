import { useContext } from "react";
import { PropertiesContext } from "./PropertiesContext";

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return context;
}
