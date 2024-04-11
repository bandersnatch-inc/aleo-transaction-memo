# aleo-transaction-memo

This example shows a custom way to include a memo in an Aleo transaction using Aleo SDK.

SDK imports and account config:

```javascript
import { Account, AleoKeyProvider, AleoNetworkClient, NetworkRecordProvider, ProgramManager } from '@aleohq/sdk';

const nodeBaseUrl = `https://api.explorer.aleo.org/v1`;
const apiBaseUrl = `{nodeBaseUrl}/testnet3`

const account = new Account({
  privateKey: "PRIVATE_KEY",
});

const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const networkClient = new AleoNetworkClient(nodeBaseUrl);
const recordProvider = new NetworkRecordProvider(account, networkClient);
const programManager = new ProgramManager(nodeBaseUrl, keyProvider, recordProvider);
```

Usefull functions for what comes next:

```javascript
const get_memo_program_instructions = (program_id, memo_max_length, function_name) => (`
  import credits.aleo;
  program ${program_id}.aleo;
  
  function ${function_name}:
      input r0 as address.public;
      input r1 as u64.public;
      input r2 as [u8; ${memo_max_length}u32].public;
      call credits.aleo/transfer_public r0 r1 into r3;
      async ${function_name} r3 into r4;
      output r4 as ${program_id}.aleo/${function_name}.future;
  
  finalize ${function_name}:
      input r0 as credits.aleo/transfer_public.future;
      await r0;
`);

const encode_string_to_u8s = (str_to_encode, max_length) => {
  const missing_char_amount = max_length - str_to_encode.length;
  if(missing_char_amount < 0) {
    throw new Error("Memo is too long.");
  }
  const text_encoder = new TextEncoder(); 
  const uint8Array = text_encoder.encode(str_to_encode);
  const encoded = ([
    ...Array(missing_char_amount).fill(0), 
    ...uint8Array,
  ]).map(b => (`${b}u8`));
  return encoded;
};

const decode_u8s_to_string = (encoded_u8s) => {
  const byteValues = encoded_u8s
    .map(encoded_u8 => parseInt(encoded_u8.slice(0,-2), 10))
    .filter(byte => byte !== 0);
  const text_decoder = new TextDecoder();
  const decoded = text_decoder.decode(new Uint8Array(byteValues));
  return decoded;
};
```

Deploy custom program implementing memo and transfer_public call:

```javascript
const deploy_fee = 2; // Aleo credits
const program_id = "test_memo_program";
const function_name = "transfer_public_memo";
const memo_max_length = 32;

const program = get_memo_program_instructions(program_id, memo_max_length);
const tx_id = await programManager.deploy(program, deploy_fee);

console.log(`Successfully deployed program: '${programId}.aleo'.`);
console.log(`Transaction id: '${tx_id}'.`);
```

Make a public transfer with memo:

```javascript
const transfer_receiver = "aleo1x7udnshfsl28vh6k7mfr6u8z3uu5002f5zfmkgg3xphw3uc5dc8sagn08u";
const transfer_amount = 0.5;  // Aleo credits
const memo = "This is a test."
const transfer_fee = 0.1; // Aleo credits

const encoded_memo = encode_string_to_u8s(memo, memo_max_length);
const transfer_amount_microcredits = `{parseInt(transfer_amount*1_000)}u64`;

const transfer_tx_id = await programManager.execute({
  programName: `${program_id}.aleo`,
  functionName: function_name,
  fee: transfer_fee,
  privateFee: false,
  inputs: [
    transfer_receiver,
    transfer_amount_microcredits,
    encoded_memo
  ]
});

console.log(`Successfully transfered with memo: '${programId}.aleo'.`);
console.log(`Transaction id: '${transfer_tx_id}'.`);
const transaction = await programManager.networkClient.getTransaction(transfer_tx_id);
console.log(transaction);
```
