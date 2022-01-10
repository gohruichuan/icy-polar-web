import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Col, Row, Image, Input, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
// import ReactJson from "react-json-view";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import ReCAPTCHA from "react-google-recaptcha";
var CryptoJS = require("crypto-js");
const crypto = require("crypto");
require('dotenv').config()
var jwt = require('jsonwebtoken');

const { ethers } = require("ethers");
/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = false;
const IS_PRESALE_BUY = true;
const IS_LAUNCH_BUY = false;
let PRICE = 0.06;
let MAX_MINT = 5;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
const scaffoldEthProvider = null && navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

function App(props) {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  // const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "average");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);
  useEffect(() => {
    async function getAddress() {
      if (web3Modal.cachedProvider && userSigner) {
        const newAddress = await userSigner.getAddress();
        console.warn("newAddress ", newAddress);
        setAddress(newAddress);
      }
    }
    // if(!address){
    getAddress();
    // }
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  // const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  // const yourLocalBalance = useBalance(localProvider, address);

  // // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  // const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
  //   "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  // ]);

  // keep track of a variable from the contract in the local React state:
  // const balance = useContractReader(readContracts, "IcyPolar", "balanceOf", [address]);
  // console.log("🤗 balance:", balance);


  // // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "IcyPolar", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  // const yourBalance = balance && balance.toNumber && balance.toNumber();
  // console.log("🤗 yourBalance:", yourBalance);

  // const totalSupplyBigNum = useContractReader(readContracts, "IcyPolar", "totalSupply");
  // console.log("CALLED INFURA");
  // const totalSupply = totalSupplyBigNum && totalSupplyBigNum.toNumber();


  // const contract = new web3.eth.Contract(contractInfo.ABI, contractInfo.contract_address);

  // console.warn("contract ", contract);
  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  // useEffect(() => {
  //   if (
  //     DEBUG 
  //     // &&
  //     // mainnetProvider &&
  //     // address &&
  //     // selectedChainId &&
  //     // yourLocalBalance &&
  //     // yourMainnetBalance &&
  //     // readContracts &&
  //     // writeContracts &&
  //     // mainnetContracts
  //   ) {
  //     console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
  //     // console.log("🌎 mainnetProvider", mainnetProvider);
  //     // console.log("🏠 localChainId", localChainId);
  //     // console.log("👩‍💼 selected address:", address);
  //     // console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
  //     // console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
  //     // console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
  //     // console.log("📝 readContracts", readContracts);

  //     // console.log("🌍 DAI contract on mainnet:", mainnetContracts);
  //     // console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
  //     // console.log("🔐 writeContracts", writeContracts);
  //   }
  // }, [
  //   // mainnetProvider,
  //   // address,
  //   // selectedChainId,
  //   // yourLocalBalance,
  //   // yourMainnetBalance,
  //   readContracts,
  //   // writeContracts,
  //   // mainnetContracts,
  // ]);

  // const totalSupply = new Promise((resolve, reject) => {
  //    readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => result.toNumber());
  // });

  //  let totalSupply = readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(function(result) {
  //   return result && result.toNumber();
  //  });


  // totalSupply && totalSupply.then( res => {return res});

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    const tx = await ethereum.request({ method: "wallet_addEthereumChain", params: data }).catch();
                    if (tx) {
                      console.log(tx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>.
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    // console.warn("web3Modal.cachedProvider ", web3Modal.cachedProvider);
    if (web3Modal.cachedProvider && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);


  const genToken = () => {
    var token = jwt.sign({
      data: crypto.randomBytes(9).toString("base64"),
      iat: (new Date().getTime()) / 1000,
      exp: (new Date().getTime() + 5 * 1000) / 1000,
    }, process.env.REACT_APP_API_SECRET_KEY);
    return token;
  }
  const validateWhitelist = async (address, tokenQuantity) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/check/whitelist/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/check/whitelist/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const successfulMint = async (address, tokenQuantity) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/successful/mint/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/successful/mint/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const failMint = async (address) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/fail/mint/" + address;
    // const requestUrl = "http://localhost:4000/fail/mint/" + address;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    })
    let data = await getData.json();
    return data;
  }

  let [whitelistMessage, setWhitelistMessage] = useState();

  let [tokenQuantity, setTokenQuantity] = useState(1);

  let [isCaptchaVerified, setCaptchaVerified] = useState(false);

  let [totalSupply, setTotalSupply] = useState();

  let [isLoading, setIsLoading] = useState(false);

  let spinnerDiplay = "";

  if (isLoading) {
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    spinnerDiplay = (
      <h5>
        <Spin indicator={antIcon} /> <span style={{ color: "white" }}>MINT</span>
      </h5>
    )
  } else {
    spinnerDiplay = (
      <h5>
        <span style={{ color: "white" }}>MINT</span>
      </h5>
    )
  }
  // let [isCaptchaVerified, setCaptchaVerified] = useState(false); // default tokenQuantity


  (IS_PRESALE_BUY || IS_LAUNCH_BUY) && !totalSupply && readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => setTotalSupply(result.toNumber()));

  function refreshTotalSupply() {
    (IS_PRESALE_BUY || IS_LAUNCH_BUY) && readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => setTotalSupply(result.toNumber()));
  }

  function onChange(value) {
    console.log("Captcha value:", value);
    if (value) {
      setCaptchaVerified(true);
    }
  }


  let mintDisplay = "";
  if (!IS_LAUNCH_BUY && !IS_PRESALE_BUY) {
    mintDisplay = (
      <span>
        <h1 style={{ marginTop: 50, fontSize: "3rem" }}> Minting Coming Soon...</h1>
        <a href="https://discord.gg/H5SvcdehF3"><h1>Get whitelisted for our presale <FontAwesomeIcon icon={faExternalLinkAlt} /></h1></a>
        <h2 style={{ fontSize: "2rem" }}>Presale Mint Price: 0.04<span className="ether">Ξ</span> each</h2>
        <h2 style={{ fontSize: "2rem" }}>Launch Mint Price: 0.06<span className="ether">Ξ</span> each</h2>
      </span>
    )
  } else {

    if (IS_PRESALE_BUY) {
      MAX_MINT = 2;
      PRICE = 0.04;
    }

    mintDisplay = (
      <div style={{ margin: "auto", marginTop: 32, paddingBottom: 32 }} className="mint" >
        <h1 style={{ fontSize: "5rem", margin: 0 }}> {totalSupply} / 10,000 </h1>
        <h1 style={{ margin: 0 }}>Philodendomes Minted</h1>
        <br></br>
        <h2>Philodendome {PRICE} ETH Each</h2>
        <Image className="scalable-image" preview={false} src={require('./minus.png')} onClick={_ => {
          console.warn("minus!");
          let min = 0;
          let max = 0;

          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }

          let _tempQuantity = tokenQuantity - 1;
          let value = Math.max(Number(min), Math.min(Number(max), Number(_tempQuantity)));
          console.warn("value ", value);
          setTokenQuantity(value);
        }} />
        <Input placeholder="Quantity" maxLength={3} defaultValue={tokenQuantity} value={tokenQuantity} className="inputMint" onChange={event => {

          let min;
          let max;
          let value = event.target.value;
          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }

          value = Math.max(Number(min), Math.min(Number(max), Number(value)));
          setTokenQuantity(value)
        }} />
        <Image className="scalable-image" preview={false} src={require('./plus.png')} onClick={_ => {
          console.warn("plus!");
          let min = 0;
          let max = 0;

          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }
          let _tempQuantity = tokenQuantity + 1;
          let value = Math.max(Number(min), Math.min(Number(max), Number(_tempQuantity)));
          console.warn("value ", value);
          setTokenQuantity(value);
        }} />
        {IS_PRESALE_BUY ? (
          <h3>
            <span>Max {MAX_MINT} mints per Whitelisted Wallet Address</span>
          </h3>
        ) : (
          <h3>
            <span>Max {MAX_MINT} mints per transaction</span>
          </h3>
        )}
        {/* <br></br>
        <h2>
          <span >Total {(tokenQuantity * PRICE).toFixed(4)} ETH</span>
        </h2> */}

        <ReCAPTCHA style={{ textAlign: "-webkit-center" }}
          sitekey="6LeqU6QdAAAAALJi2OFNbsf1pS8Q9nArkJ03Mm7A"
          onChange={onChange}
        />
        <br></br>
        <Button disabled={!isCaptchaVerified || isLoading} className="mintBtn" size="large"
          onClick={() => {
            if (tokenQuantity === 0) {
              setWhitelistMessage(
                <div style={{ color: "red" }}>
                  Quantity is 0
                </div>
              );
              return;
            }
            if (!address && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
              loadWeb3Modal();
            } else {
              if (!IS_PRESALE_BUY && IS_LAUNCH_BUY) { // Launch
                setIsLoading(true);
                let etherPrice = (tokenQuantity * PRICE);
                console.warn("LAUNCH MINTING!");
                console.warn("tokenQuantity ! ", tokenQuantity);
                console.warn("etherPrice ! ", etherPrice);

                etherPrice = Math.round(etherPrice * 1e4) / 1e4;
                tx(writeContracts.IcyPolar.buy(tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                  update => {
                    setIsLoading(false);
                    if (update.status === "confirmed" || update.status === 1) {
                      refreshTotalSupply();
                      setWhitelistMessage(
                        <div style={{ color: "green" }}>
                          Successfully minted {tokenQuantity} tokens!
                        </div>
                      );
                    } else if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                      console.warn("📡 TX FAILED");
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Failed to mint {tokenQuantity} tokens!
                        </div>
                      );
                    }
                  });
              } else if (IS_PRESALE_BUY && !IS_LAUNCH_BUY) { // PRESALE
                setIsLoading(true);
                const getValidateWhitelist = async () => {
                  await validateWhitelist(address, tokenQuantity).then(res => {
                    if (res.result === "Whitelisted") {
                      let etherPrice = (tokenQuantity * PRICE);
                      console.warn("PRESALE MINTING!");
                      console.warn("tokenQuantity ! ", tokenQuantity);
                      console.warn("etherPrice ! ", etherPrice);

                      etherPrice = Math.round(etherPrice * 1e4) / 1e4;

                      var bytes = CryptoJS.AES.decrypt(res.ciphertext, process.env.REACT_APP_CRYPTO_SECRET_KEY);
                      var decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                      tx(writeContracts.IcyPolar.presaleBuy(decrypted.signature, decrypted.nonce, decrypted.tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                        update => {
                          setIsLoading(false);

                          console.warn("📡 Transaction Update:", update);
                          if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                            console.warn("📡 TX FAILED");
                            failMint(address)
                          } else if (update.status === "confirmed" || update.status === 1) {
                            refreshTotalSupply();
                            // const balance = useContractReader(readContracts, "IcyPolar", "balanceOf", [address]);
                            // const yourBalance = balance && balance.toNumber && balance.toNumber();
                            // console.warn("yourBalance ", yourBalance);
                            // for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
                            //   const tokenId = readContracts.IcyPolar.tokenOfOwnerByIndex(address, tokenIndex);
                            //   console.warn("tokenId ", tokenId);
                            // }
                            successfulMint(address, decrypted.tokenQuantity).then(res => {
                              setWhitelistMessage(
                                <div style={{ color: "green" }}>
                                  Successfully minted {decrypted.tokenQuantity} tokens!
                                </div>
                              );
                            });
                          }
                        });
                    }
                    else if (res.result === "pending") {
                      setWhitelistMessage(
                        <div>
                          Please wait while we proccess your mint!
                        </div>
                      );
                    }
                    else if (res.result === "Mint exceed limit") {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          You have exceed the presale mint limit of 2
                        </div>
                      );
                    }
                    else if (res.result === "Not Whitelisted") {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Sorry! You are Not whitelisted!
                        </div>
                      );
                    }
                    else {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Failed to mint {tokenQuantity} tokens!
                        </div>
                      );
                    }
                  });
                }
                getValidateWhitelist();
              }
            }
          }}
        >
          {spinnerDiplay}
        </Button>
        {whitelistMessage}
      </div>
    )
  }
  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <Header /> */}
      <BrowserRouter>
        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}
            {/* 
             */}

            {/* <ReactFullpage
              scrollOverflow={false}
              anchors={['firstPage', 'secondPage', 'thirdPage']}
              render={({ state, fullpageApi }) => {
                return ( */}
            <div id="fullpage-wrapper">
              {/* <div style={{position: "fixed"}}>
                      <img style={{ height:"82vh"}} src="hero.jpg"/>
                    </div> */}
              <div className="section1" id="home">
                <Row type="flex" align="middle" className="blankSection">
                </Row>
              </div>
              <div className="section" >
                <Row justify="center">
                  <Col>
                    <div className="container" >
                      <Image className="grey-bg" preview={false} src={require('./greyBG_dome.png')} id="mint"/>
                      <div className="centered" >
                        {mintDisplay}
                      </div>
                    </div>
                  </Col>

                </Row>
              </div>
              <span id="about"></span>
              <div className="section" >
                <Row justify="center">
                  <Col>
                    <h2 style={{ fontSize: "5rem", textAlign: "center" }}>
                      About
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col span={14}>
                    <p className="verticalAlignText">
                      Welcome to The Dome, a community space that aim to bridge the metaverse and real world with our series of randomly generated non-fungible tokens (NFTs). <br></br><br></br>
                      The Dome hopes to expand its community with synergistic mechanics and collaboration between both Web3 and IRL communities. <br></br><br></br>The Dome will kick start its collection with 10,000 variegated plant; each granting its holder exclusive utility within the metaverse and the real world. <br></br><br></br>Each The Dome NFT also passively generate Oxygen which can be use to create new life within the metaverse. <br></br><br></br>Start breathing on the blockchain within The Dome
                    </p>
                  </Col>
                  <Col>
                    <Row justify="center">
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila1.png')} />
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila2.png')} />
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila3.png')} />
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila3.png')} />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
              {/* <span id="roadmap"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h2 style={{ fontSize: "5rem", textAlign: "center" }}>
                      Roadmap v1.0
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col span={14}>
                    <Row>
                      <Col span={8} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-0.png')} />
                      </Col>
                      <Col span={15} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Launching The Dome Community <br></br>
                          Announce Whitelist participation events <br></br>
                          Community engagement; first AMA on discord server <br></br>
                          Community engagement; voting on royalties % <br></br>
                          Launching presale and public sale
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={8} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-25.png')} />
                      </Col>
                      <Col span={15} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          30 <span className="ether">Ξ</span> committed to purchase first batch of NFT assets <br></br>
                          Launch The Dome trivia season 1 with 4 <span className="ether">Ξ</span> prize pool <br></br>
                          5 Lucky community members to receive Philodendome airdrop <br></br>
                          Initial guerrilla/social media marketing <br></br>
                          Special IRL giveaway
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={8} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-50.png')} />
                      </Col>
                      <Col span={15} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          30 <span className="ether">Ξ</span> committed to purchase second batch of NFT assets <br></br>
                          The Dome merchandise development <br></br>
                          Maintain guerrilla/social media marketing <br></br>
                          The Dome trivia season 2 with 5 <span className="ether">Ξ</span> prize pool <br></br>
                          Community engagement; 2nd AMA on discord server
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={8} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-75.png')} />
                      </Col>
                      <Col span={15} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          35 <span className="ether">Ξ</span> committed to purchase third batch of NFT assets <br></br>
                          Purchase 3x3 plot of land on SANDBOX <br></br>
                          The Dome trivia season 3 with 8 ETH prize pool <br></br>
                          NYC takeover <br></br>
                          Expand IRL utility partnerships
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={8} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-100.png')} />
                      </Col>
                      <Col span={15} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          40 <span className="ether">Ξ</span> committed to purchase last batch of NFT assets
                          The Dome Merch Pop-Up
                          Prepare fractionalization of NFT assets
                          Initial PP2E game development
                        </p>
                      </Col>
                      <br></br><br></br>
                      <p className="verticalAlignText">
                        More development to be unfold; so keep a look out for Roadmap 2.0
                      </p>
                    </Row>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col>
                    <h2 style={{ fontSize: "5rem", textAlign: "center" }}>
                      POST LAUNCH
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col span={19}>
                    <p className="verticalAlignText">
                      The Dome community will further extend our reach into the real world bringing our holder an array of IRL utility from partnership with varies institutes. <br></br><br></br>
                      
                      A series of virtual and IRL events will be roll out; starting with a charity run (more details to be finalize), followed by a virtual auction of our one of ones held in our very own land on The Sandbox. <br></br><br></br>
                      
                      With our ever-growing community the possibility we are able to achieve are limitless; so buckled up and enjoy what The Dome have installed for all of you degen!
                    </p>
                  </Col>
                </Row>
              </div> */}

              <div className="section">
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2>
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                        Your very own 
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>
                      COMMUNITY
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                    A Genesis Philodendome is your token into this community. 
                    Stay active, make connection, and earn $Oxygen daily.Unlock The Dome's full potential together as a community. 
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2 >
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                        A portal 
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>
                      BRIDGE INTO THE REAL WORLD
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                    The Dome will be your portal that bridge into the real world, bringing you tangible real life benefits. 
                    Allowing you to reap benefits from both metaverse and IRL.  
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2 >
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                      Passive income 
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>PLAY TO EARN
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                    A virtual horticulture game that allow you to not only find your inner peace but trade your cultivated plants for $Oxygen. Summon your inner agriculturists and start earning. 
                    </p>
                  </Col>
                </Row>
              </div>

              <span id="roadmap"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h2 style={{ fontSize: "5rem", textAlign: "center" }}>
                      Roadmap
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2 >
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                      Phase I 
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>THE DOME
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      <ul>
                        <li>
                          Mint your Genesis Philodendome
                        </li>
                        <li>
                          Earn $Oxygen daily
                        </li>
                        <li>
                          Enjoy IRL benefits from our pioneering partners as an early adopter
                        </li>
                      </ul>
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2 >
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                      Phase II 
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>CULTIVATE & TRADE
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      <ul>
                        <li>
                          Customize your own nursery in a P2E game
                        </li>
                        <li>
                          Grow and nurture your virtual plants
                        </li>
                        <li>
                          Cultivate, sell & trade your rare in-game plants for $Oxygen
                        </li>
                      </ul>
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <h2 >
                      <p style={{ fontSize: "2rem", textAlign: "left", marginBottom: "0px"}}>
                      Phase III
                      </p>
                      <span style={{ fontSize: "2rem", textAlign: "left" }}>REAL WORLD INTEGRATION
                      </span>
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      <ul>
                        <li>
                          Bridging into the real world with our crypto powered groupon app
                        </li>
                        <li>
                          Subscribe using $Oxygen to enjoy RL tangible benefits from participating partners
                        </li>
                      </ul>
                    </p>
                  </Col>
                </Row>
              </div>

              <span id="team"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h2 style={{ fontSize: "5rem", textAlign: "center" }}>
                      THE DOME TEAM
                    </h2>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col>
                    <Row justify="center">
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila1.png')} />
                        <div className="teamName">
                          <h1>RICKY</h1>
                          <a href="https://twitter.com/TheDomebyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                          <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila2.png')} />
                        <div className="teamName">
                          <h1>SUNNY</h1>
                          <a href="https://twitter.com/TheDomebyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                          <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila3.png')} />
                        <div className="teamName">
                          <h1>MING KUANG</h1>
                          <a href="https://twitter.com/TheDomebyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                          <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Image className="scalable-phila-image" preview={false} src={require('./phila3.png')} />
                        <div className="teamName">
                          <h1>REI</h1>
                          <a href="https://twitter.com/TheDomebyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                          <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col span={19}>
                    {/* <span>
                      <a href="https://twitter.com/TheDomebyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                      <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                    </span> */}
                    <br></br><br></br><br></br><br></br>
                  </Col>
                </Row>
              </div>
            </div>
          </Route>

          {/* <Route path="/debugcontracts">
            <Contract
              name="IcyPolar"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route> */}
        </Switch>
      </BrowserRouter>

      {/* <ThemeSwitch /> */}

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", right: 0, top: 0, padding: "10px 0 0 0", backgroundColor: "rgba(255, 255, 255, 0.8)", width: "100vw" }}>
        <h1 style={{ marginLeft: 20, textAlign: "left" }} >
          <a href="#home" style={{ color: "black" }}>THE DOME</a>
          <Account
            address={address}
            IS_LAUNCH_BUY={IS_LAUNCH_BUY}
            IS_PRESALE_BUY={IS_PRESALE_BUY}
            // localProvider={localProvider}
            // userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            // price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </h1>
      </div>
    </div>
  );
}

export default App;
