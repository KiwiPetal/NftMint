use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, MintTo};
use mpl_token_metadata:: {
    ID as TOKEN_METADATA_ID,
    instruction as token_instruction,
};

declare_id!("FETvoP1R2ZEaK8jZBVeG8c4VkVqHDP1fRz1Tb5QGhW1T");

#[program]
pub mod token_contract {
    use anchor_lang::solana_program::program::{invoke, invoke_unchecked};

    use super::*;

    pub fn mint_token(
        ctx: Context<MintToken>,
        metadata_title: String, 
        metadata_symbol: String, 
        metadata_uri: String,
    ) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::mint_to(cpi_ctx, 1)?;

        invoke(
            &token_instruction::create_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(), 
                ctx.accounts.metadata.key(), 
                ctx.accounts.mint.key(), 
                ctx.accounts.authority.key(), 
                ctx.accounts.authority.key(), 
                ctx.accounts.authority.key(), 
                metadata_title, 
                metadata_symbol, 
                metadata_uri, 
                None,
                0,
                true, 
                false, 
                None, 
                None,
            ),
            &[
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.token_account.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.system_program.to_account_info()
            ],
        )?;

        
        Ok(())
    }

}

#[derive(Accounts)]
pub struct MintToken<'info> {
    /// CHECK: We're about to create this with Metaplex
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This is the token that we want to mint
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,
}
