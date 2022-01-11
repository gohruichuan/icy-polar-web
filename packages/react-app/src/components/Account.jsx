import { Button } from "antd";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Address from "./Address";
import Balance from "./Balance";
import Wallet from "./Wallet";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Image } from "antd";

/*
  ~ What it does? ~

  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out

  ~ How can I use? ~

  <Account
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
*/

export default function Account({
  address,
  IS_LAUNCH_BUY,
  IS_PRESALE_BUY,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
}) {
  const modalButtons = [];
  if (web3Modal && web3Modal.cachedProvider && (IS_LAUNCH_BUY || IS_PRESALE_BUY)) {
    modalButtons.push(
      <Button
        key="logoutbutton"
        style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4, color: "black"}}
        shape="round"
        size="large"
        onClick={logoutOfWeb3Modal}
      >
        logout
      </Button>
    );
  } else if (IS_LAUNCH_BUY || IS_PRESALE_BUY) {
    modalButtons.push(
    <Button
        key="connectwallet"
        style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4, color: "black" }}
        shape="round"
        size="large"
        onClick={loadWeb3Modal}
      >
        Connect Wallet
      </Button>
      );
  }

  const { currentTheme } = useThemeSwitcher();

  const display = minimized ? (
    ""
  ) : (IS_LAUNCH_BUY || IS_PRESALE_BUY)?(
    <span style={{ display: "inline-table" }}>
      {address !== "0x419690dFaF22603A9B387Caa59927Dd3d45fd66E" ? (
        <Address address={address} ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
      ) : (
        <p style={{fontSize:"1rem"}}>Wallet Not Connected</p>
      )}
      {/* <Balance address={address} provider={localProvider} price={price} /> */}
    </span>
  ) : ("");

  return (
    <span style={{float: "right"}} className="navBar">
      <span className="navLink">
        <a href="#about">ABOUT</a>
      </span>
      <span className="navLink">
        <a href="#mint">MINT</a>
      </span>
      <span className="navLink">
        <a href="#roadmap">ROADMAP</a>
      </span>
      <span className="navLink">
        <a href="#faq">FAQ</a>
      </span>
      <span className="navLink">
        <a href="#team">TEAM</a>
      </span>
      {/* <span className="navLink">
        <a href="#oxy">$OXYGEN</a>
      </span> */}
      <a style={{marginLeft: 20}} href="https://twitter.com/icypolarnft" target="_blank"><FontAwesomeIcon icon={faTwitter} className="navIcon"/></a>
      <a href="https://discord.gg/U37j6e9m3X" target="_blank"><FontAwesomeIcon  icon={faDiscord} className="navIcon"/></a>
      {/* <a href="https://opensea.io/collection/babygoaty" target="_blank"><Image className="openseaIcon" preview={false} src={require('../opensea.png')}/> </a> */}
      {display}
      {modalButtons}
    </span>
  );
}
