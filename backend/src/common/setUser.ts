import { importKey, InMemorySigner } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import { TaquitoUser } from "./taquitoUser";

export async function setUser(tezos: TezosToolkit, currentUser: TaquitoUser) {
    tezos.setSignerProvider(await InMemorySigner.fromSecretKey(currentUser.privateKey));
    await importKey(tezos, currentUser.privateKey);
}
