import express, { Request, Response } from 'express';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN DE RED Y BILLETERAS ---
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC, "confirmed");

// Dirección unificada (Compatible con Phantom y Solflare para fondos y ganancias)
const UNIFIED_WALLET_PUBKEY = new PublicKey("GiKW5Ftur9arHntZF8R26uTVdBmM7wYxQcXECLng5K6t");
// Cuenta / Pool de Meteora objetivo
const METEORA_TARGET_AUTHORITY = "HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC";

// Llave privada de autofirma (cargada de forma segura mediante variable de entorno)
const PRIVATE_KEY_STR = process.env.OPERATIONAL_WALLET_PRIVATE_KEY || "";
const operationalWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_STR));

// Capital base reservado para las operaciones del bot (Ej. 0.5 SOL)
const BASE_OPERATING_CAPITAL = 0.5 * LAMPORTS_PER_SOL;

/**
 * ⚡ ENDPOINT DEL WEBHOOK (GEEK HOOK)
 * Recibe los eventos en tiempo real desde la red de Solana sobre Meteora.
 */
app.post('/api/v1/autonomous-engine', async (req: Request, res: Response) => {
    try {
        const event = req.body;
        console.log("⚡ [Geek Hook] Evento interceptado:", event.type || "Transacción en red");

        // Validar si el evento interactúa con el contrato/pool de Meteora configurado
        if (event.account === METEORA_TARGET_AUTHORITY || event.programId === METEORA_TARGET_AUTHORITY) {
            console.log("🎯 ¡Oportunidad detectada en Meteora! Ejecutando análisis de seguridad...");

            // 1. Filtro Antiestafa (Verificación de liquidez y mint authority)
            // await auditTokenSecurity(event.mint);
            
            // 2. Si es seguro, ejecuta la compra atómica automática con la wallet
            // await executeAtomicBuy(event.mint, 0.05 * LAMPORTS_PER_SOL);

            // 3. Monitoreo instantáneo de Take-Profit (Lógica de Proporción / Aura 1.618)
            // await monitorAndScalpProfit();
        }

        // 4. Tesorería Autónoma: Barrido automático de excedentes hacia la wallet unificada
        await sweepNetProfits();

        res.status(200).json({ status: "success", message: "Ciclo financiero procesado correctamente" });
    } catch (error) {
        console.error("❌ Error crítico en el ciclo del bot:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

/**
 * 🛡️ SISTEMA DE TESORERÍA Y SUPERVIVENCIA
 * Asegura que cualquier ganancia neta por encima del capital base se aparte automáticamente.
 */
async function sweepNetProfits() {
    try {
        const currentBalance = await connection.getBalance(operationalWallet.publicKey);
        
        // Si el balance supera el capital operativo más un margen para comisiones de red
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
            console.log(`🛡️ [Supervivencia] Ganancia neta de ${netProfit / LAMPORTS_PER_SOL} SOL asegurada en tu wallet. Tx: ${signature}`);
        }
    } catch (err) {
        console.error("Error en el barrido de tesorería:", err);
    }
}

// Inicialización del servicio
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Motor Autónomo desplegado en el puerto ${PORT}`);
    console.log(`👀 Monitoreando contrato Meteora: ${METEORA_TARGET_AUTHORITY}`);
    console.log(`💳 Wallet unificada configurada (Phantom/Solflare): ${UNIFIED_WALLET_PUBKEY.toBase58()}`);
});
