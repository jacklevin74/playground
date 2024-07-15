const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;
const fs = require('fs');

async function main() {
    const customRpcUrl = 'https://xolana.xen.network/';
    const connection = new anchor.web3.Connection(customRpcUrl, 'confirmed');
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
    anchor.setProvider(provider);

    const idl = JSON.parse(fs.readFileSync('./xns.json', 'utf8'));
    const programId = new anchor.web3.PublicKey('8FQVJkqxcSzFsoLva4a4aHrKXhva3V65xvucjP8NMHN9');
    const program = new anchor.Program(idl, programId, provider);

    // Derive the PDA for the text account
    const [textAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("text_account"), wallet.publicKey.toBuffer()],
        programId
    );

    const user = provider.wallet.publicKey;

    // Airdrop SOL to the user account to cover transaction fees
    const airdropSignature = await connection.requestAirdrop(user, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSignature);

    // Check if the text account already exists
    const accountInfo = await connection.getAccountInfo(textAccount);

    if (!accountInfo) {
        // Initialize the account if it does not exist
        await program.rpc.initialize(bump, {
            accounts: {
                textAccount: textAccount,
                user: user,
                systemProgram: SystemProgram.programId,
            },
        });

        console.log('Text account initialized:', textAccount.toString());
    } else {
        console.log('Text account already exists:', textAccount.toString());
    }

    const text = Buffer.from("jackjack.x1");

    // Store the text
    await program.rpc.storeText(text, {
        accounts: {
            textAccount: textAccount,
            user: user,
        },
    });

    console.log('Text stored in text account:', textAccount.toString());

    // Read the text
    await program.rpc.readText({
        accounts: {
            textAccount: textAccount,
        },
    });

    console.log('Text read from text account:', textAccount.toString());

    // Fetch and decode the text from the account
    const accountData = await program.account.textAccount.fetch(textAccount);
    const storedText = Buffer.from(accountData.text).toString();

    console.log('Decoded text:', storedText);
}

main().catch(err => {
    console.error(err);
});
