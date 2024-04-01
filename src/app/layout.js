"use client";
import { Righteous } from "next/font/google";
import { createWeb3Modal, defaultConfig, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { ethers } from 'ethers';
import { useEffect, useState } from "react";
import { GlobalContext } from "./globalContext";
import { Tooltip } from 'react-tooltip';
import { ToastContainer } from 'react-toastify';
import "./globals.css";
import 'react-tooltip/dist/react-tooltip.css';
import 'react-toastify/dist/ReactToastify.css';

const defaultFont = Righteous({ subsets: ["latin"], weight: "400" });

export const base = {
  chainId: 8453, 
  name: 'Base Mainnet', 
  currency: 'ETH',
  explorerUrl: 'https://basescan.org',  
  rpcUrl: 'https://rpc.ankr.com/base' 
};

export const baseSepolia = {
  chainId: 84532,
  name: 'Base Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.basescan.org/', 
  rpcUrl: 'https://rpc.ankr.com/base_sepolia' 
};

export const defaultNetwork = base;

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata: {
    name: 'QuizChain Challenge',
    description: 'Super quiz challenge on blockchain',
    url: '', 
    icons: ['']
  }}),
  chains: [defaultNetwork],
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  enableAnalytics: true,
  themeMode: 'dark'
});

export default function RootLayout({ children }) {
  const web3modalProvider = useWeb3ModalProvider();
  const [defaultProvider, setDefaultProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);

  useEffect(() => {
    if(window && window.ethereum) {
      (window.ethereum).on('accountsChanged', () => {
        window.location.reload();
      });
    }
  
    const defaultProviderT = new ethers.JsonRpcProvider(defaultNetwork.rpcUrl);
    setDefaultProvider(defaultProviderT);
  }, []);

  useEffect(() => {
    if(!web3modalProvider.walletProvider) return;

    const browserProvider = new ethers.BrowserProvider(web3modalProvider.walletProvider);

    const setSignerObject = async () => {
      const signerT = await browserProvider.getSigner();
      setSigner(signerT);
    };

    if (!signer) setSignerObject();
  }, [web3modalProvider.walletProvider]);

  return (
    <html lang="en">
      <head>
        <title>QuizChain Challenge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={defaultFont.className + " bg-[#02061B]"}>
        <GlobalContext.Provider value={{ defaultProvider, signer }}>
          {children}
        </GlobalContext.Provider>
        <Tooltip id="info-tooltip" className="z-10 !mb-6 !px-3 !py-2 !bg-white/5 !border !rounded-xl !border-white/10"/>
        <ToastContainer />
      </body>
    </html>
  );
}
