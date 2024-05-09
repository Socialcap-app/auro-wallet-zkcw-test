import { Mina, PublicKey, UInt64 } from "o1js";
import { SocialcapDeposits } from "@socialcap/payments";
import { zkCloudWorkerClient } from "zkcloudworker";
import { Chains } from "$lib/networks";

const MINA = 1e9;
export const TXNFEE = 150_000_000;
export const MIN_PAYMENT = 2;


export async function createTransactionOnZkcloudworker(
  chainId: string,
  depositsContract: string,
  payer: string,
  amount: number
) {
  const JWT = import.meta.env.VITE_ZKCW_JWT; 

  const api = new zkCloudWorkerClient({ jwt: JWT });

  const response = await api.execute({
    mode: "async",
    repo: "socialcap-deposits",
    developer: "MAZ", // keep it simple, no strange chars here ! 
    task: "create-unsigned-transaction",
    metadata: `Payment for Claim XXX`,
    args: JSON.stringify({ 
      chainId: chainId 
    }),
    transactions: [JSON.stringify({
      memo: `Claim XXX`.substring(0, 32), // memo field in Txn
      payer: payer,
      fee: MIN_PAYMENT,
      amount: amount
    })],
  });

  console.log("API response:", response);
  const jobId = response?.jobId;
  if (jobId === undefined) {
    throw new Error("Job ID is undefined");
  }

  console.log("Waiting for job ...");
  const jobResult = await api.waitForJobResult({ jobId });
  const { result } = jobResult.result;
  const serializedTxn = result; // JSON.stringify(JSON.parse(result), null, 2);  
  return serializedTxn;
}


export async function createTransactionOnBrowser(
  chainId: string,
  depositsContract: string,
  payer: string,
  amount: number
) {
  const chain = Chains[chainId];
  Mina.setActiveInstance(Mina.Network(chain.proxy));

  await SocialcapDeposits.compile();

  const zkapp = new SocialcapDeposits(
    PublicKey.fromBase58(depositsContract)
  );

  const txn = await Mina.transaction(
    { sender: PublicKey.fromBase58(payer), fee: TXNFEE }, 
    async () => { 
      await zkapp.deposit(
        UInt64.from(BigInt(amount*MINA)), 
        UInt64.from(MIN_PAYMENT)
      ); 
    }
  );

  const unsignedTxn = await txn.prove();
  return unsignedTxn.toJSON();
}
