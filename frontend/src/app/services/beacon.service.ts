import {Injectable} from '@angular/core';
import {DAppClient, TezosOperationType} from '@airgap/beacon-sdk';

@Injectable({
  providedIn: 'root'
})
export class BeaconService {

  dAppClient: DAppClient;

  constructor() {
    this.dAppClient = new DAppClient({name: 'Beacon Docs'});
  }

  async connect(): Promise<void> {
    let myAddress: string | undefined;
    // Check if we are connected. If not, do a permission request first.
    const activeAccount = await this.dAppClient.getActiveAccount();
    console.log(this.dAppClient.connectionStatus);
    if (!activeAccount) {
      const permissions = await this.dAppClient.requestPermissions();
      console.log('New connection:', permissions.address);
      myAddress = permissions.address;
    } else {
      myAddress = activeAccount.address;
    }
    console.log(myAddress);
    console.log(activeAccount?.accountIdentifier);
    console.log(activeAccount);

        // At this point we are connected to an account.
        // Let's send a simple transaction to the wallet that sends 1 mutez to ourselves.
        const response = await this.dAppClient.requestOperation({
          operationDetails: [
            {
              kind: TezosOperationType.TRANSACTION,
              destination: myAddress, // Send to ourselves
              amount: '1', // Amount in mutez, the smallest unit in Tezos
            },
          ],
        });
  }
}
