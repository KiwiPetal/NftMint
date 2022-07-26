import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TokenContract } from "../target/types/token_contract";
import addresses from "./SolanaAddressParse";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token"; 
import { assert } from "chai";


  const nftTitle = "Testing Nft V2";
  const nftSymbol = "TESTV2";
  const nftUri = "https://raw.githubusercontent.com/KiwiPetal/NftTest/main/new.json";

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  // Retrieve the TokenContract struct from our smart contract
  const program = anchor.workspace.TokenContract as Program<TokenContract>;
  // Generate a random keypair that will represent our token
  // AssociatedTokenAccount for anchor's workspace wallet
  let associatedTokenAccount = undefined;
  const key = anchor.AnchorProvider.env().wallet.publicKey;
  let sendkey = undefined;
  async function mintnft() {
  for (let index = 7; index < addresses.length;) {
    
    // Get anchor's wallet's public key
    let mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    sendkey = new anchor.web3.PublicKey(addresses[index]);
    // Get the amount of SOL needed to pay rent for our Token Mint
    let lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );

    // Get the ATA for a token and the account that we want to own the ATA (but it might not existing on the SOL network yet)
    associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      sendkey
    );

    // Fires a list of instructions
    let mint_tx = new anchor.web3.Transaction().add(
      // Use anchor to create an account from the mint key that we created
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: key,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      // Fire a transaction to create our mint account that is controlled by our anchor wallet
      createInitializeMintInstruction(
        mintKey.publicKey, 0, key, key
      ),
      // Create the ATA account that is associated with our mint on our anchor wallet
      createAssociatedTokenAccountInstruction(
        key, associatedTokenAccount, sendkey, mintKey.publicKey
      )
    );

    // sends and create the transaction
    let res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);

    let metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];

    let masterEditionAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];

    // console.log(
    //   await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
    // );

    // console.log("Account: ", res);
    // console.log("Mint key: ", mintKey.publicKey.toString());
    // console.log("User: ", key.toString());

    // Executes our code to mint our token into our specified ATA
    await program.methods.mintToken(
      nftTitle, nftSymbol, nftUri
    ).accounts({
      metadata: metadataAddress,
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      authority: key,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();

    console.log("Minted " + index + "/" + addresses.length + "For address: " + addresses[index]);
    index += 1;
    
  }
  }
  mintnft();

