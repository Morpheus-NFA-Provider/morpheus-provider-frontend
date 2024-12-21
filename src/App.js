import React, { useState } from "react";
import { ethers, BrowserProvider, Contract, encodeBytes32String } from "ethers";

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [nfaName, setNfaName] = useState("");
  const [nfaSymbol, setNfaSymbol] = useState("");
  const [status, setStatus] = useState("");

  const sepoliaChainId = "0xaa36a7";

  // Contract addresses
  const nfaProviderAddress = "0x6136d466F878e6C6Dd8d050e7Ae2e57888Dcab22"; // Replace with deployed address
  const morTokenAddress = "0x155aD9f83F88c19C17E931f8a57d250984467561"; // Replace with deployed address

  // Contract ABIs
  const nfaProviderABI = [
    {
      "inputs": [
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "name": "symbol", "type": "string" },
        { "internalType": "bytes32", "name": "offchainNFAData", "type": "bytes32" }
      ],
      "name": "createNFA",
      "outputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "token", "type": "address" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "name": "symbol", "type": "string" },
        { "internalType": "bytes32", "name": "offchainNFAData", "type": "bytes32" }
      ],
      "name": "createNFAWithPayment",
      "outputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const morABI = [
    {
      "inputs": [],
      "name": "faucet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "spender", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setWalletConnected(true);
      setStatus("Wallet connected: " + accounts[0]);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: sepoliaChainId }]
      });
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  }

  async function createNFA() {
    if (!walletConnected) return setStatus("Connect wallet first!");
    if (!nfaName || !nfaSymbol) return setStatus("Please enter name and symbol.");
  
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // Используем await для получения Signer
      const nfaProvider = new Contract(nfaProviderAddress, nfaProviderABI, signer);
  
      const tx = await nfaProvider.createNFA(nfaName, nfaSymbol, ethers.encodeBytes32String("ExampleData"));
      setStatus("Transaction sent: " + tx.hash);
      await tx.wait(); // Ожидание завершения транзакции
      setStatus("NFA created successfully!");
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  }

  async function callFaucet() {
    if (!walletConnected) return setStatus("Connect wallet first!");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const mor = new Contract(morTokenAddress, morABI, signer);
      const tx = await mor.faucet();
      setStatus("Faucet transaction sent: " + tx.hash);
      await tx.wait();
      setStatus("MOR tokens received!");
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  }

  async function createNFAWithPayment() {
    if (!walletConnected) return setStatus("Connect wallet first!");
    if (!nfaName || !nfaSymbol) return setStatus("Please enter name and symbol.");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const nfaProvider = new Contract(nfaProviderAddress, nfaProviderABI, signer);
      const mor = new Contract(morTokenAddress, morABI, signer);

      // Approve MOR tokens
      const approveTx = await mor.approve(nfaProviderAddress, ethers.parseEther("1"));
      setStatus("Approval transaction sent: " + approveTx.hash);
      await approveTx.wait();

      // Create NFA with payment
      const tx = await nfaProvider.createNFAWithPayment(morTokenAddress, nfaName, nfaSymbol, encodeBytes32String("ExampleData"));
      setStatus("Transaction sent: " + tx.hash);
      await tx.wait();
      setStatus("NFA created with MOR payment!");
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create easily your NFA on morpheus NFA factory!</h1>
      <button onClick={connectWallet}>{walletConnected ? "Wallet Connected" : "Connect Wallet"}</button>
      <p>{status}</p>

      <input
        type="text"
        placeholder="NFA name"
        value={nfaName}
        onChange={(e) => setNfaName(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />
      <input
        type="text"
        placeholder="NFA symbol"
        value={nfaSymbol}
        onChange={(e) => setNfaSymbol(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />

      <button onClick={createNFA} style={{ display: "block", margin: "10px auto" }}>
        Create NFA
      </button>

      <h2>Get MOR Tokens</h2>
      <button onClick={callFaucet} style={{ display: "block", margin: "10px auto" }}>
        Call Faucet
      </button>

      <h2>Create NFA with MOR</h2>
      <button onClick={createNFAWithPayment} style={{ display: "block", margin: "10px auto" }}>
        Create NFA with MOR Payment
      </button>
    </div>
  );
}

export default App;