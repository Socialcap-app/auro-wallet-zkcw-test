
<script lang="ts">
  import { Mina } from "o1js";
  import { onMount } from 'svelte'
  import { txnData } from './serializedTxn';
  import { Chains } from "$lib/networks";
	import { createTransactionOnZkcloudworker, TXNFEE } from "./transactions";

  const MINA = 1e9;
  const userAccountId = import.meta.env.VITE_DEPLOYER_ID;
  const depositsAddress = import.meta.env.VITE_DEPOSITS_ADDRESS;
  const chainId = 'devnet';

  let view = "result";
  let result = "Select some API function ...";
  let serializedTxn = txnData;
  let amount = 0;

  onMount(async () => {  })

  function has_window_mina() {
    let exists = typeof window.mina !== 'undefined';
    result =  `
      <b>window.mina</b> 
      <br>
      ${exists}
      ${exists 
        ? '(We have a Wallet)' 
        : '(Need to connect Wallet)'}
    `;
  }

  async function mina_getAccounts() {
    result = `<b>getAccounts</b><br>`;
    try {
      const accounts: any[] = await window.mina?.getAccounts() || [];
      result = result +`<pre>${JSON.stringify(accounts, null, 2)}</pre>`;
    }
    catch (err) {
      result = result + `<pre>${JSON.stringify(err, null, 2)}</pre>`;
    }
  }

  async function mina_requestAccounts() {
    result = `<b>requestAccounts()</b><br>`;
    try {
      const accounts: any[] = await window.mina?.requestAccounts() || [];
      result = result + `<pre>${JSON.stringify(accounts, null, 2)}</pre>`;
    }
    catch (err) {
      result = result + `<pre>${JSON.stringify(err, null, 2)}</pre>`;
    }
  }

  async function mina_requestNetwork() {
    result = `<b>requestNetwork</b><br>`;
    try {
      const netw: any = await window.mina?.requestNetwork() || {};
      result = result + `<pre>${JSON.stringify(netw, null, 2)}</pre>`;
    }
    catch (err) {
      result = result + `<pre>${JSON.stringify(err, null, 2)}</pre>`;
    }
  }

  async function mina_sendTransaction() {
    view = "transaction";
    result = ``;
  }

  async function sendTxn() {
    view = "result";
    result = `<b>sendTransaction</b><br>`;
    try {
      const accounts: any[] = await window.mina?.requestAccounts() || [];      
      if (!accounts.length) throw Error("Could not get payer account");
      const payer = accounts[0];

      const t0 = Date.now();
      const serializedTxn = await createTransactionOnZkcloudworker(
        chainId,
        depositsAddress,
        payer,
        2 // amount,  MIN is 2
      );
      console.log("serializedTxn: ", serializedTxn);
      const dt = Number((Date.now() - t0)/1000);

      let response = await window.mina?.sendTransaction({
        transaction: serializedTxn, // serializedTxn,
        feePayer: {
            fee: TXNFEE,
            memo: "Send txnJSON",
        },
      });      

      let txnHash = response.hash;
      let href = `${Chains[chainId].explorerTransactionUrl}${txnHash}?type=zk-tx$`;
      result = result + 
        `<pre>${JSON.stringify(response, null, 2)}</pre>`+
        `<a href="${href}" style="color:blue;text-decoration:underline;">Txn: ${txnHash}</a>`+
        `<br>Elapsed: ${dt} secs`
    }
    catch (err) {
      result = result + `<pre>ERROR: ${err}</pre>`;
    }
  }

  async function mina_sendPayment() {
    view = "payment";
    result = ``;
  }

  async function sendPay() {
    view = "result";
    result = `<b>sendPayment</b><br>`;
    try {
      let response = await window.mina?.sendPayment({
        amount: 1.0, // Number(amount),
        to: depositsAddress,
        feePayer: {
            fee: TXN_FEE,
            memo: "Send Payment",
        },
      });      
      result = result + `<pre>${JSON.stringify(response, null, 2)}</pre>`;
    }
    catch (err) {
      result = result + `<pre>ERROR: ${JSON.stringify(err, null, 2)}</pre>`;
    }
  }

</script>

<style global>
  @import '../styles/globals.css';

  body {
    font-size: 16px;
  }

  .main {
    padding: 2rem 4rem ;
  }

  p {
    padding: 1rem 0 ;
    line-height: 1.68rem;
  }

  a {
    color: blue;
    text-decoration: underline;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .buttons-list {
    text-align: left;
  }

  .buttons-list button {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .results {
    padding: 1rem;
    line-height: 1.765rem;
    font-size: 1rem;
    text-align: left;
  }
</style>

<svelte:head>
  <title>Mina zkApp UI</title>
</svelte:head>

<div>
  <main class="main">
    <div class="">
      <h1>Auro Wallet API Testing</h1>
      <p>See: 
        <a 
          target="_blank"
          href="https://docs.aurowallet.com/general/reference/api-reference"
          >
          Auro Wallet Docs | API reference
        </a>
        <br>
        SvelteKit, WITHOUT importing <b>o1js</b>.
      </p>
      <br/>

      <table style="layout: fixed; width: 100%;">
        <tr>
          <td style="width: 16rem; border-right: 1px solid gray;vertical-align:top;">
            <div class="buttons-list">
              <button on:click={has_window_mina}>
                window.mina           
              </button>
              <br>
              
              <button on:click={mina_getAccounts}>
                mina_getAccounts
              </button>

              <button on:click={mina_requestAccounts}>
                mina_requestAccounts
              </button>

              <button on:click={mina_requestNetwork}>
                mina_requestNetwork
              </button>

              <button on:click={mina_sendPayment}>
                mina_sendPayment
              </button>

              <button on:click={mina_sendTransaction}>
                mina_sendTransaction
              </button>
            </div>
          </td>

          <td style="vertical-align: top;">
            {#if view==="payment"}
              <div>
                <input 
                  style="width: 32rem;padding:1rem;font-size:1rem;" 
                  bind:value={amount}/>
                  <br>
                  <button on:click={() => sendPay()}>Send !</button>
              </div>
            {/if}  

            {#if view==="transaction"}
              <div class="transaction">
                <!-- <textarea 
                  rows="16"
                  style="width: 100%;max-width:48rem;padding:1rem;font-size:1rem;" 
                  bind:value={serializedTxn}></textarea>
                  <br> -->
                  <button on:click={() => sendTxn()}>Send !</button>
              </div>
            {/if}  

            <div class="results">
              <div>
                {@html result }
              </div>
            </div>
          </td>
        </tr>        
      </table>
    </div>
  </main>
</div>
