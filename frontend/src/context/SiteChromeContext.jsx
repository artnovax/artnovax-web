import { createContext, useContext } from "react";

const SiteChromeContext = createContext(false);

export const SiteChromeProvider = SiteChromeContext.Provider;

export const useSiteChromeSuppressed = () => useContext(SiteChromeContext);
