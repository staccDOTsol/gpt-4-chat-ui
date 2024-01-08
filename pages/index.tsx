import { useState, useRef, useEffect, FormEvent, KeyboardEvent} from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";


import {
  FunctionAccount,
  
} from "../../../sbv3/javascript/solana.js/lib"
import { SwitchboardProgram } from "../../../sbv3/javascript/solana.js/lib"

import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FunctionAccountData } from "@switchboard-xyz/solana.js/lib/generated";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { FunctionRequestAccount } from "@switchboard-xyz/solana.js";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "../../../sbv3/javascript/common/lib";
import {
  AttestationQueueAccount,
  DEVNET_GENESIS_HASH,
  MAINNET_GENESIS_HASH,
  attestationTypes,
} from "../../../sbv3/javascript/solana.js/lib";
import { parseRawMrEnclave } from "@switchboard-xyz/common";

export async function loadDefaultQueue(switchboardProgram: SwitchboardProgram) {
  const genesisHash =
    await switchboardProgram.provider.connection.getGenesisHash();
  const attestationQueueAddress =
    genesisHash === MAINNET_GENESIS_HASH
      ? "2ie3JZfKcvsRLsJaP5fSo43gUo1vsurnUAtAgUdUAiDG"
      : genesisHash === DEVNET_GENESIS_HASH
      ? "CkvizjVnm2zA5Wuwan34NhVT3zFc7vqUyGnA6tuEF5aE"
      : undefined;
  if (!attestationQueueAddress) {
    throw new Error(
      `The request script currently only works on mainnet-beta or devnet (if SWITCHBOARD_FUNCTION_PUBKEY is not set in your .env file))`
    );
  }

  return new AttestationQueueAccount(
    switchboardProgram,
    attestationQueueAddress
  );
}
/**
 * Attempt to load our Switchboard Function from the .env file
 */
export async function loadSwitchboardFunctionEnv(
  switchboardProgram: SwitchboardProgram
): Promise<
  [
    FunctionAccount | undefined,
    attestationTypes.FunctionAccountData | undefined
  ]
> {
    console.log(
      `[env] SWITCHBOARD_FUNCTION_PUBKEY: ${"EbCj1qhgqwcDi619e53wLhzGpKZakpvCEYD4TcBoMmfx"}`
    );
    const functionAccountInfo =
      await switchboardProgram.provider.connection.getAccountInfo(
        new anchor.web3.PublicKey("EbCj1qhgqwcDi619e53wLhzGpKZakpvCEYD4TcBoMmfx")
      );

    if (!functionAccountInfo) {
      console.error(
        `$SWITCHBOARD_FUNCTION_PUBKEY in your .env file is incorrect, please fix. Creating a new Switchboard Function ...`
      );
    } else {
      // We can decode the AccountInfo to reduce our network calls
      return await FunctionAccount.decode(
        switchboardProgram,
        functionAccountInfo
      );
    }

  return [undefined, undefined];
}
export default function Home() {
  const [userInput, setUserInput] = useState("WE DO THE HOOOOOOOOOOOOOOOOOPOOKIE POKIE. THATS WHAT ITS ALL ABOUT");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi there! How can I help?" },
  ]);
  const { connection } = useConnection();
  const wallet = useWallet();
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [switchboardFunction, setSwitchboardFunction] = useState<FunctionAccount>();
  const [functionState, setFunctionState] = useState<FunctionAccountData>();
  const [switchboardProgram, setSwitchboardProgram] = useState<SwitchboardProgram>();
  const [programStatePubkey, setProgramStatePubkey] = useState<anchor.web3.PublicKey>();
  const [oracle, setOracle] = useState<anchor.web3.PublicKey>();
  const [oracleAccountData, setOracleAccountData] = useState<any>();
  const [message, setMessage] = useState<any>();
  const [program, setProgram] = useState<anchor.Program>();
  useEffect(() => {
      async function doit(){
        if (oracleAccountData?.count != 0 && wallet.publicKey != undefined){
          let new_messages: any [] = []
      const messages = await connection.getParsedProgramAccounts(
        new PublicKey("4ciXYKjwSAXsnaDcfofqWL3zxRc6WdYrospqn88Z774X") as anchor.web3.PublicKey,
        {
          filters: [
            {
              memcmp: {
                offset: 8,
                bytes: wallet.publicKey.toBase58(),
              },
            },
          ],
        }
      );
      for (let i = 0; i < messages.length; i++){
        try {
        let message = await program?.account.message.fetch(messages[i].pubkey);
        // @ts-ignore
        if (message.user_content != undefined){
          // @ts-ignore
          new_messages.push({role: "user", content: message.user_content})
        }
        // @ts-ignore
        if (message.assistant_content != undefined){
          // @ts-ignore
          new_messages.push({role: "assistant", content: message.assistant_content})
        }
      } catch (e){
        console.log(e);
      }
      }
      setMessages([
        { role: "assistant", content: "Hi there! How can I help?" },...new_messages
        .map((m: any) => {
          return { role: m.role, content: m.content.replace("\\nkeep your response within 604bytes MAXIMUM", "") }
        }
        )
      ]);
    setLoading(false);
      }

      else {
        setLoading(true);
      }
    }
    setLoading(true);
  doit()
  }, [oracleAccountData]);
  useEffect(() => {
  async function doit(){

  const sb = await SwitchboardProgram.fromConnection(
    connection,
  );


  let [sf, ss] = await loadSwitchboardFunctionEnv(
    sb
  );
  setSwitchboardFunction(sf);
  setFunctionState(ss);
  setSwitchboardProgram(sb);
  console.log(1)
if (sf != undefined ){
  const provider = new anchor.AnchorProvider(
    connection,
    // @ts-ignore
    wallet,
    {
      preflightCommitment: "confirmed",
    },
  );
  const program = new anchor.Program(
    await anchor.Program.fetchIdl(
      new PublicKey("4ciXYKjwSAXsnaDcfofqWL3zxRc6WdYrospqn88Z774X"),
      provider
    ) as anchor.Idl,
    new PublicKey("4ciXYKjwSAXsnaDcfofqWL3zxRc6WdYrospqn88Z774X"),
    provider
  );
  console.log(`PROGRAM: ${program.programId}`);

  const [programStatePubkey, b1] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("STACC_GPT"), sf.publicKey.toBuffer()],
    program.programId
  );
  console.log(`PROGRAM_STATE: ${programStatePubkey}`);
try {
  
const [oracle, b2] = anchor.web3.PublicKey.findProgramAddressSync(
  // @ts-ignore
  [Buffer.from("STACC_GPT_ORACLE"), sf.publicKey.toBuffer(), wallet.publicKey.toBuffer()],
  program.programId
);
console.log(`ORACLE_PUBKEY: ${oracle}`);
let oracle_account_info_maybe = await provider.connection.getAccountInfo(oracle);
if (oracle_account_info_maybe == undefined){
  alert('you gotta pay a one-time fee to create your oracle..')
  const signature = await program.methods
  .initialize(b1, b2) //initialize 
  .accounts({
    oracle,
    program: programStatePubkey,
    authority: wallet.publicKey as PublicKey,
    payer: wallet.publicKey as PublicKey,
    switchboardFunction: sf.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
    dev: new PublicKey("7ihN8QaTfNoDTRTQGULCzbUT3PHwPDTu5Brcu4iT2paP")
  })
  .rpc();
  console.log(`[TX] initialize: ${signature}`);
  await connection.confirmTransaction(signature, "finalized");

console.log(`ORACLE_PUBKEY: ${oracle}`);

let oracle_account_data = await program.account.myOracleState.fetch(oracle);
console.log(`ORACLE_ACCOUNT_DATA`);
console.log(oracle_account_data);
setOracleAccountData(oracle_account_data);

const [message, b3] = anchor.web3.PublicKey.findProgramAddressSync(
  // @ts-ignore
  [Buffer.from("STACC_GPT_ORACLE"), sf.publicKey.toBuffer(), wallet.publicKey.toBuffer(), oracle_account_data.count],
  program.programId
);
console.log(`MESSAGE_PUBKEY: ${message}`);
setMessage(message);
} else {
  

  let oracle_account_data = await program.account.myOracleState.fetch(oracle);
  console.log(`ORACLE_ACCOUNT_DATA`);
  console.log(oracle_account_data);
  setOracleAccountData(oracle_account_data);
  const [message, b3] = anchor.web3.PublicKey.findProgramAddressSync(
    // @ts-ignore
    [Buffer.from("STACC_GPT_ORACLE"), sf.publicKey.toBuffer(), wallet.publicKey.toBuffer(), oracle_account_data.count],
    program.programId
  );
  console.log(`MESSAGE_PUBKEY: ${message}`);
  setMessage(message);
}
setOracle(oracle);
}
catch (e){
  console.log(e);
}
setProgram(program);
setProgramStatePubkey(programStatePubkey);

}
  }
  doit();
  }, [wallet.publicKey]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (messageListRef.current) {
      const messageList = messageListRef.current;
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

// Focus on input field
useEffect(() => {
  if (textAreaRef.current) {
    textAreaRef.current.focus();
  }
}, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content: "Oops! There seems to be an error. Please try again.",
      },
    ]);
    setLoading(false);
    setUserInput("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    const context = [...messages, { role: "user", content: userInput }];
    setMessages(context);
let tokens = (userInput).length  + 64 // 1349 - 1232 = 117
let avg_assistant_tokens = 512;

if (messages.length > 0){
  for (let i = 0; i < messages.length; i++){
    if (messages[i].role == "assistant"){
      avg_assistant_tokens = (messages[i].content).length + 64
    }
  }
} 
console.log(`TOKENS: ${tokens}`);
console.log(`AVG_ASSISTANT_TOKENS: ${avg_assistant_tokens}`);
if (avg_assistant_tokens == undefined){
  avg_assistant_tokens = 0
}

const switchboardRequestKeypair = anchor.web3.Keypair.generate();
const switchboardRequestEscrowPubkey = anchor.utils.token.associatedAddress({
  mint: switchboardProgram?.mint.address as anchor.web3.PublicKey,
  owner: switchboardRequestKeypair.publicKey,
});

const switchboardRequest = new FunctionRequestAccount(
  // @ts-ignore
  switchboardProgram,
  switchboardRequestKeypair.publicKey
);
// @ts-ignore 
const attestationQueue = await loadDefaultQueue(switchboardProgram);
let usdcTokenAccount
try {
  usdcTokenAccount = getAssociatedTokenAddressSync(
    new PublicKey("H8UekPGwePSmQ3ttuYGPU1szyFfjZR4N53rymSFwpLPm"),
    wallet.publicKey as PublicKey
  )
} catch (e){
  alert("You need USDC to play sers... this ain't free lunch")
}
console.log(`Request account: ${switchboardRequestKeypair.publicKey}`);
    // Send chat history to API
    let data = await program?.methods.getMessages(userInput,
     new BN( tokens *2), new BN(avg_assistant_tokens*2))
      
      .accounts(
       
    {
      message,
      payer: wallet.publicKey as PublicKey,
          program: programStatePubkey,
          oracle: oracle,
          // SWITCHBOARD ACCOUNTS
          // @ts-ignore
          switchboard: switchboardProgram.attestationProgramId,
          switchboardState:
          // @ts-ignore
            switchboardProgram.attestationProgramState.publicKey,
          switchboardAttestationQueue: attestationQueue.publicKey,
          switchboardFunction: switchboardFunction?.publicKey,
          switchboardRequest: switchboardRequest.publicKey,
          switchboardRequestEscrow: switchboardRequestEscrowPubkey,
          switchboardMint: switchboardProgram?.mint.address,
   
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
    dev: new anchor.web3.PublicKey("Dg2ESUuuz65xuL1mnKqa9zQvRPwTTuQBkLENtc8Wvr7c"),
    })
    .signers([switchboardRequestKeypair])
    .rpc({skipPreflight: true});
    // Reset user input
    setUserInput("");

    if (!data) {
      handleError();
      return;
    }

  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>Chat UI</title>
        <meta name="description" content="OpenAI interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <Link href="/">Chat UI</Link>
        </div>
        <div className={styles.navlinks}>
          <a
            href="https://platform.openai.com/docs/models/gpt-4"
            target="_blank"
          >
            Docs
          </a>
          
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div
                  key={index}
                  className={
                    message.role === "user" &&
                    loading &&
                    index === messages.length - 1
                      ? styles.usermessagewaiting
                      : message.role === "assistant"
                      ? styles.apimessage
                      : styles.usermessage
                  }
                >
                  {/* Display the correct icon depending on the message type */}
                  {message.role === "assistant" ? (
                    <Image
                      src="/openai.png"
                      alt="AI"
                      width="30"
                      height="30"
                      className={styles.boticon}
                      priority={true}
                    />
                  ) : (
                    <Image
                      src="/usericon.png"
                      alt="Me"
                      width="30"
                      height="30"
                      className={styles.usericon}
                      priority={true}
                    />
                  )}
                  <div className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading || wallet.publicKey == undefined}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                
                id="userInput"
                name="userInput"
                placeholder={
                  loading ? "Waiting for response..." : "Type your question..."
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20} />{" "}
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg
                    viewBox="0 0 20 20"
                    className={styles.svgicon}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className={styles.footer}>
            <p>
              Powered by{" "}
              <a href="https://openai.com/" target="_blank">
                OpenAI
              </a>
              . 
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
