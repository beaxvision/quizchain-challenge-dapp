"use client";
import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { ethers } from 'ethers';
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassStart, faInfoCircle, faMedal, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { GlobalContext } from "./globalContext";
import Questions from "../data/questions.json";
import Contracts from "../constants/contracts.js";
import Abi from "../constants/abi.js";

export default function Home() {
  const { defaultProvider, signer } = useContext(GlobalContext);
  const { open, close } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectButtonLabel, setConnectButtonLabel] = useState("Connect Wallet");
  const [quizIndex, setQuizIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isAnswerASubmitLoading, setIsAnswerASubmitLoading] = useState(false);
  const [isAnswerBSubmitLoading, setIsAnswerBSubmitLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [quizChainChallengeContract, setQuizChainChallengeContract] = useState(undefined);
  const [quizChainChallengeContractR, setQuizChainChallengeContractR] = useState(undefined);
  const [players, setPlayers] = useState(0);

  useEffect(() => {
    if (isConnected) {
      setConnectButtonLabel(address?.slice(0, 6) + "..." + address?.slice(-4));

      setIsWalletConnected(!!address);
    } else {
      setConnectButtonLabel("Connect Wallet");
      setIsWalletConnected(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if(!signer) return;

    const quizChainChallengeContractT = new ethers.Contract(Contracts.quizChainChallengeAddress, Abi.quizChainChallengeAbi, signer);
    setQuizChainChallengeContract(quizChainChallengeContractT);
  }, [signer]);

  useEffect(() => {
    if(!quizChainChallengeContract) return;

    quizChainChallengeContract.on("*", async () => {
      getPlayers();
      getQuestionIndex();
    });
  }, [quizChainChallengeContract]);

  useEffect(() => {
    if(!defaultProvider) return;

    const quizChainChallengeContractRT = new ethers.Contract(Contracts.quizChainChallengeAddress, Abi.quizChainChallengeAbi, defaultProvider);
    setQuizChainChallengeContractR(quizChainChallengeContractRT);
  }, [defaultProvider]);

  useEffect(() => {
    if(!quizChainChallengeContractR) return;

    getPlayers();
    getQuestionIndex();
  }, [quizChainChallengeContractR]);

  const getQuestionIndex = async () => {
    if(!address) return;

    try {
      const questionIndexT = Number(await quizChainChallengeContractR.getPlayerQuestionIndex(quizIndex, address));
      setQuestionIndex(questionIndexT);
    } catch (error) {
      return;
    }
  }

  const getPlayers = async () => {
    try {
      const playersT = Number(await quizChainChallengeContractR.players());
      setPlayers(playersT);
    } catch (error) {
      return;
    }
  }

  const answerQuestion = async (questionIndex, userAnswer) => {
    if(!quizChainChallengeContract) return;
    if (questionIndex + 1 === Questions.length) return;

    if(userAnswer == 0) {
      setIsAnswerASubmitLoading(true);
    } else {
      setIsAnswerBSubmitLoading(true);
    }

    const pricePerQuestion = await quizChainChallengeContract.pricePerQuestion();

    try {
      const transaction = await quizChainChallengeContract.answerQuestion(questionIndex, userAnswer, { value: pricePerQuestion });
      await transaction.wait();
    
      setIsAnswerASubmitLoading(false);
      setIsAnswerBSubmitLoading(false);

      toast.success("Answer submitted successfully", {
        className: "!backdrop-blur-sm !bg-white/10 !rounded-xl !p-4 !border !text-white !border-white/10",
      });
    } catch (error) {
      setIsAnswerASubmitLoading(false);
      setIsAnswerBSubmitLoading(false);

      if (error && error.data) {
        const decodedError = quizChainChallengeContract.interface.parseError(error.data);
        toast.error(String(decodedError.args[0]), {
          className: "!backdrop-blur-sm !bg-white/10 !rounded-xl !p-4 !border !text-white !border-white/10",
        })
      } else {
        toast.error("Something went wrong", {
          className: "!backdrop-blur-sm !bg-white/10 !rounded-xl !p-4 !border !text-white !border-white/10",
        })
      }
    }
  }

  return (
    <main className="flex max-h-screen h-screen w-screen flex-col items-center justify-between p-12 lg:p-24 overflow-hidden text-center">
      <Image src="/background.png" alt="logo" width={1920} height={1080} className="absolute inset-0 -z-10 h-screen w-full object-cover"/>
      <div className="z-10 flex max-w-5xl w-full h-full items-center justify-between text-sm">
        <div className="flex flex-col justify-between items-center gap-10 px-8 pt-32 pb-8 md:pt-6 w-screen scrollbar overflow-y-scroll xl:overflow-y-hidden overflow-x-hidden h-full border bg-gradient-to-b backdrop-blur-md border-white/10 rounded-xl bg-white/5">
          <button onClick={() => open()} className="absolute right-0 top-0 mx-6 my-6 px-4 py-3 bg-white/10 border rounded-xl border-white/20 text-lg transition duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 hover:scale-110 active:scale-100 active:duration-100">{connectButtonLabel}</button>
          <button onClick={() => setShowInfo(!showInfo)} className="absolute left-0 top-0 mx-6 my-6 flex flex-col justify-center items-start p-3 bg-white/5 border rounded-xl border-white/10 transition duration-200 ease-in-out hover:scale-110 active:scale-100 hover:bg-white/10 hover:cursor-pointer">
            {!showInfo ?
              <span><FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" /></span>
            :
              <>
                <span><FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" /></span>
                <span className="text-lg mt-2">Quiz Theme: Blockchain</span>
                <span className="text-lg">Rewards Per Question: 0.01 QCT</span>
              </>
            }
          </button>
          <h1 className="text-3xl">QuizChain Challenge</h1>
          {isWalletConnected ?
            <div className="flex flex-col justify-center items-center w-full gap-8">
              <div className="flex flex-col justify-center items-center w-full gap-4">
                <span className="text-2xl">Question {questionIndex + 1}</span>
                <p className="text-xl bg-black/40 border border-white/20 rounded-xl p-4">{Questions[questionIndex].question}</p>
              </div>
              <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 md:gap-10 w-full">
                <div className="flex w-full flex-col justify-center items-center md:items-end gap-6">
                  <span className="text-xl md:text-end">{Questions[questionIndex].answers.a}</span>
                  <button onClick={() => answerQuestion(questionIndex, 0)} disabled={isAnswerASubmitLoading || isAnswerBSubmitLoading} className={"w-[11.25rem] px-6 h-16 bg-green-400/40 border rounded-xl border-green-400/50 text-3xl transition duration-200 ease-in-out hover:bg-green-400/50 hover:border-green/60 hover:scale-110 active:scale-100 active:duration-100 " + (isAnswerASubmitLoading || isAnswerBSubmitLoading ? "cursor-not-allowed grayscale" : "")}>
                    {isAnswerASubmitLoading ?
                      <span><FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin" /></span>
                    :
                      <span>Option A</span>
                    }
                  </button>
                </div>
                <span className="text-2xl md:mb-4">OR</span>
                <div className="flex w-full flex-col justify-center items-center md:items-start gap-6">
                  <span className="text-xl md:text-start">{Questions[questionIndex].answers.b}</span>
                  <button onClick={() => answerQuestion(questionIndex, 1)} disabled={isAnswerASubmitLoading || isAnswerBSubmitLoading} className={"w-[11.25rem] px-6 h-16 bg-blue-400/40 border rounded-xl border-blue-400/50 text-3xl transition duration-200 ease-in-out hover:bg-blue-400/50 hover:border-blue/60 hover:scale-110 active:scale-100 active:duration-100 " + (isAnswerASubmitLoading || isAnswerBSubmitLoading ? "cursor-not-allowed grayscale" : "")}>
                    {isAnswerBSubmitLoading ?
                      <span><FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin" /></span>
                    :
                      <span>Option B</span>
                    }
                  </button>
                </div>
              </div>
            </div>
            :
            <div className="flex flex-col justify-center items-center p-16 gap-4 h-full">
              <span className="text-2xl">Connect your wallet to start</span>
              <FontAwesomeIcon icon={faMedal} className="w-10 h-10" />  
            </div>
          } 
          <div className="flex flex-col md:flex-row justify-center items-center w-full gap-10">
            <div className="flex flex-col justify-between items-center w-36 h-24 px-2 py-4 bg-white/5 border rounded-xl border-white/10">
              <span className="text-xl">Questions</span>
              <span className="text-3xl">{Questions.length}</span>
            </div>
            <div className="flex flex-col justify-between items-center w-36 h-24 px-2 py-4 bg-white/5 border rounded-xl border-white/10">
              <span className="text-xl">Players</span>
              <span className="text-3xl">{players}</span>
            </div>
            <div className="flex flex-col justify-between items-center w-36 h-24 px-2 py-4 bg-white/5 border rounded-xl border-white/10">
              <span className="text-xl">Rewards</span>
              <span className="flex flex-row justify-center items-center gap-2 text-lg"><FontAwesomeIcon icon={faHourglassStart} className="w-5 h-5" /> QCT</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between md:gap-0 gap-6 items-center w-full">
            <span className="md:text-start text-md">We hope you enjoyed this month's quiz! The answers will be announced at the end of the month.</span>
            <div className="flex flex-row justify-center items-center gap-4">
              <a href="#" data-tooltip-id="info-tooltip" data-tooltip-content="Coming Soon" className="text-md transition duration-200 ease-in-out hover:scale-125 active:scale-100 active:duration-100"><FontAwesomeIcon icon={faXTwitter} className="w-5 h-5" /></a>
              <a href="#" className="text-md transition duration-200 ease-in-out hover:scale-125 active:scale-100 active:duration-100"><FontAwesomeIcon icon={faGithub} className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
