import { importKey, InMemorySigner } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import { Tzip16Module } from "@taquito/tzip16";
import { TaquitoUser } from "./taquitoUser";

export async function setUser(tezos: TezosToolkit, currentUser: TaquitoUser) {
    tezos.setSignerProvider(InMemorySigner.fromFundraiser(currentUser.email, currentUser.password, currentUser.mnemonic.join(' ')));

    tezos.addExtension(new Tzip16Module());

    importKey(
        tezos,
        currentUser.email,
        currentUser.password,
        currentUser.mnemonic.join(' '),
        currentUser.activation_code
    ).catch((e: any) => console.error(e));
}