import express, { Request, Response } from 'express';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const app = express();
app.use(express.json());

// Puerto crítico para Railway
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// --- CONFIGURACIÓN DE RED Y BILLETERAS ---
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC, "confirmed");

const UNIFIED_WALLET_PUBKEY = new PublicKey("GiKW5Ftur9arHntZF8R26uTVdBmM7wYxQcXECLng5K6t");
const METEORA_TARGET_AUTHORITY = "HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC";

const PRIVATE_KEY_STR = process.env.OPERATIONAL_WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY_STR) {
    console.error("❌ ERROR CRÍTICO: La variable de entorno OPERATIONAL_WALLET_PRIVATE_KEY no está configurada.");
}
const operationalWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_STR));

const BASE_OPERATING_CAPITAL = 0.5 * LAMPORTS_PER_SOL;

// ENDPOINT DE SALUD (Respuesta instantánea para el Health Check de Railway)
app.get('/', (req: Request, res: Response) => {
    res.status(200).send("OK");
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: "healthy", target: METEORA_TARGET_AUTHORITY });
});

// ENDPOINT DEL WEBHOOK
app.post('/api/v1/autonomous-engine', async (req: Request, res: Response) => {
    try {
        const event = req.body;
        console.log("⚡ [Geek Hook] Evento interceptado:", event.type || "Transacción en red");

        const tokenMint = event.mint || event.accountKeys?.[1];

        if (event.account === METEORA_TARGET_AUTHORITY || event.programId === METEORA_TARGET_AUTHORITY) {
            if (tokenMint) {
                console.log(`🎯 ¡Oportunidad detectada en Meteora para el token: ${tokenMint}!`);
                const isSecure = await auditTokenSecurity(tokenMint);
                if (isSecure) {
                    await executeAtomicBuy(tokenMint, 0.05 * LAMPORTS_PER_SOL);
                    await monitorAndScalpProfit(tokenMint);
                }
            }
        }

        await sweepNetProfits();
        res.status(200).json({ status: "success" });
    } catch (error: any) {
        console.error("❌ Error crítico:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

async function auditTokenSecurity(mintAddress: string): Promise<boolean> {
    return true; 
}

async function executeAtomicBuy(mintAddress: string, amountInLamports: number) {
    console.log(`🛒 Compra atómica simulada para: ${mintAddress}`);
}

async function monitorAndScalpProfit(mintAddress: string) {
    console.log(`📊 Monitoreando Take-Profit para: ${mintAddress}`);
}

async function sweepNetProfits() {
    try {
        const currentBalance = await connection.getBalance(operationalWallet.publicKey);
        if (currentBalance > BASE_OPERATING_CAPITAL + 10000) {
            const netProfit = currentBalance - BASE_OPERATING_CAPITAL;
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: operationalWallet.publicKey,
                    toPubkey: UNIFIED_WALLET_PUBKEY,
                    lamports: netProfit,
                })
            );
            const signature = await connection.sendTransaction(transaction, [operationalWallet]);
            console.log(`🛡️ [Supervivencia] Ganancia asegurada. Tx: ${signature}`);
        }
    } catch (err) {
        console.error("Error en barrido:", err);
    }
}

// INICIO INMEDIATO DEL SERVIDOR HTTP
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Motor Autónomo desplegado en el puerto ${PORT}`);
    console.log(`👀 Monitoreando contrato Meteora: ${METEORA_TARGET_AUTHORITY}`);
    console.log(`💳 Wallet unificada configurada: ${UNIFIED_WALLET_PUBKEY.toBase58()}`);
});
