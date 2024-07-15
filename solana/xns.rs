use anchor_lang::prelude::*;

declare_id!("8FQVJkqxcSzFsoLva4a4aHrKXhva3V65xvucjP8NMHN9");

#[program]
pub mod text_storage {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _bump: u8) -> Result<()> {
        msg!("Initialize function called");
        let text_account = &mut ctx.accounts.text_account;
        text_account.text = vec![];
        text_account.owner = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn store_text(ctx: Context<StoreText>, text: Vec<u8>) -> Result<()> {
        msg!("StoreText function called");
        let text_account = &mut ctx.accounts.text_account;
        if text_account.owner != *ctx.accounts.user.key {
            return Err(ProgramError::IllegalOwner.into());
        }
        text_account.text = text;
        msg!("Text stored: {:?}", text_account.text);
        Ok(())
    }

    pub fn read_text(ctx: Context<ReadText>) -> Result<()> {
        let text_account = &ctx.accounts.text_account;
        msg!("Reading text from account:");
        msg!("Owner: {}", text_account.owner);

        match String::from_utf8(text_account.text.clone()) {
            Ok(text) => {
                msg!("Text: {}", text);
            },
            Err(_) => {
                msg!("Text: [invalid UTF-8]");
            }
        }
        Ok(())
    }

}

#[account]
pub struct TextAccount {
    pub owner: Pubkey,
    pub text: Vec<u8>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 4 + 128, seeds = [b"text_account", user.key().as_ref()], bump)]
    pub text_account: Account<'info, TextAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StoreText<'info> {
    #[account(mut, seeds = [b"text_account", user.key().as_ref()], bump)]
    pub text_account: Account<'info, TextAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReadText<'info> {
    #[account(seeds = [b"text_account", text_account.owner.as_ref()], bump)]
    pub text_account: Account<'info, TextAccount>,
}
