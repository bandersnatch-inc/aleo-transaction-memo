

const get_memo_program_instructions = (memo_max_length) => (`
  import credits.aleo;
  program aleo_memo_transactions.aleo;
  
  function transfer_public_memo:
      input r0 as address.public;
      input r1 as u64.public;
      input r2 as [u8; ${memo_max_length}u32].public;
      call credits.aleo/transfer_public r0 r1 into r3;
      async transfer_public_memo r3 into r4;
      output r4 as aleo_memo_transactions.aleo/transfer_public_memo.future;
  
  finalize transfer_public_memo:
      input r0 as credits.aleo/transfer_public.future;
      await r0;
`);
