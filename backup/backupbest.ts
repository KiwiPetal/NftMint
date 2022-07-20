import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  createKeypairFromFile,
} from './util';
import { Nft } from "../target/types/nft";

describe("nft", () => {

  const nftTitle = "Testing Nft V2";
  const nftSymbol = "TESTV2";
  const nftUri = "https://raw.githubusercontent.com/KiwiPetal/NftTest/main/new.json";

  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  const newpubkey: anchor.web3.PublicKey = new anchor.web3.PublicKey("9qz923RtkeWQEVCRMz2pAbjnc9F4cWskgw4zuaBRVxMu");
  anchor.setProvider(provider);
  
  const program = anchor.workspace.Nft as Program<Nft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  it("Mint!", async () => {
    // Derive the mint address and the associated token account address

    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
    const toAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: newpubkey
    })
    console.log(`New token: ${mintKeypair.publicKey}`);

    // Derive the metadata and master edition addresses

    const metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Metadata initialized");
    const masterEditionAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Master edition metadata initialized");

    // Transact with the "mint" function in our on-chain program
    
    await program.methods.mint(
      nftTitle, nftSymbol, nftUri
    ).accounts({
      masterEdition: masterEditionAddress,
      metadata: metadataAddress,
      mint: mintKeypair.publicKey,
      tokenAccount: tokenAddress,
      mintAuthority: wallet.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([mintKeypair])
    .rpc();

  });
});
