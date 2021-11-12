import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json"

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [wavesCount, setWavesCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [userMessage, setUserMessage] = useState("")

  const contractAddress = "0xA29D6f5Be596792b0E21B351b374f537Ae562CB1";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(userMessage);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.unshift({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
        setWavesCount(wavesCleaned.length);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Listen in for emitter events!
 */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      getAllWaves()
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
      getAllWaves();
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Mykyta and I am trying to build web3 app, pretty cool, huh? Connect your Ethereum wallet and wave at me!
        </div>

        {currentAccount && (
        <div className="waveForm">
          <input className="userMsgInput" type="textbox" value={userMessage} placeholder="type something"
          onChange={e => setUserMessage(e.target.value)} />

          <button className="waveButton" onClick={wave}>
              Send me a message
          </button>
        </div>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {wavesCount > 0 && currentAccount && (
          <div className="totalWaves">Total waves: {wavesCount}</div>
        )} 
         
        {currentAccount && (allWaves.map((wave, index) => {
          return (
            <div className="msgBlock" key={index}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString().substr(0,wave.timestamp.toString().indexOf('GMT'))}</div>
              <div>Message: {wave.message}</div>
            </div>)
        }))}
      </div>
    </div>
  );
}

export default App