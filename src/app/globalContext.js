import { createContext } from "react";

export const GlobalContext = createContext({
    defaultProvider: undefined,
    signer: undefined
});