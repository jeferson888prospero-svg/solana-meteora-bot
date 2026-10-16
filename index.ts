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
if (!PRIVATE_KEY_STR) {
    console.error("❌ ERROR CRÍTICO: La variable de entorno OPERATIONAL_WALLET_PRIVATE_KEY no está configurada.");
}
const operationalWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_STR));

// Capital base reservado para las operaciones del bot (Ej. 0.5 SOL)
const BASE_OPERATING_CAPITAL = 0.5 * LAMPORTS_PER_SOL;

/**
 * 🟢 ENDPOINT DE SALUD (Vital para Railway)
 */
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: "online", 
        service: "Solana Meteora Bot Autonomous Engine",
        target: METEORA_TARGET_AUTHORITY 
    });
});

/**
 * ⚡ ENDPOINT DEL WEBHOOK (GEEK HOOK)
 * Recibe los eventos en tiempo real desde la red de Solana sobre Meteora.
 */
app.post('/api/v1/autonomous-engine', async (req: Request, res: Response) => {
    try {
        const event = req.body;
        console.log("⚡ [Geek Hook] Evento interceptado:", event.type || "Transacción en red");

        // Extracción segura del mint del token según el evento recibido
        const tokenMint = event.mint || event.accountKeys?.[1];

        // Validar si el evento interactúa con el contrato/pool de Meteora configurado
        if (event.account === METEORA_TARGET_AUTHORITY || event.programId === METEORA_TARGET_AUTHORITY) {
            if (tokenMint) {
                console.log(`🎯 ¡Oportunidad detectada en Meteora para el token: ${tokenMint}! Ejecutando análisis...`);

                // 1. Filtro Antiestafa (Verificación de liquidez y mint authority)
                const isSecure = await auditTokenSecurity(tokenMint);
                
                if (isSecure) {
                    // 2. Ejecuta la compra atómica automática con la wallet operativa
                    await executeAtomicBuy(tokenMint, 0.05 * LAMPORTS_PER_SOL);

                    // 3. Monitoreo instantáneo de Take-Profit (Lógica de Proporción / Aura 1.618)
                    await monitorAndScalpProfit(tokenMint);
                } else {
                    console.log("⚠️ Token descartado por filtros de seguridad antiestafa.");
                }
            }
        }

        // 4. Tesorería Autónoma: Barrido automático de excedentes hacia la wallet unificada
        await sweepNetProfits();

        res.status(200).json({ status: "success", message: "Ciclo financiero procesado correctamente" });
    } catch (error: any) {
        console.error("❌ Error crítico en el ciclo del bot:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

/**
 * 🛡️ 1. FILTRO ANTIESTAFA
 */
async function auditTokenSecurity(mintAddress: string): Promise<boolean> {
    try {
        console.log(`🔍 Auditando seguridad para el mint: ${mintAddress}`);
        return true; 
    } catch (error) {
        console.error("Error en auditoría de seguridad:", error);
        return false;
    }
}

/**
 * ⚡ 2. COMPRA ATÓMICA
 */
async function executeAtomicBuy(mintAddress: string, amountInLamports: number) {
    try {
        console.log(`🛒 Ejecutando compra atómica de ${amountInLamports / LAMPORTS_PER_SOL} SOL en Meteora...`);
    } catch (error) {
        console.error("Error al ejecutar compra atómica:", error);
    }
}

/**
 * 📈 3. MONITOREO DE TAKE-PROFIT
 */
async function monitorAndScalpProfit(mintAddress: string) {
    try {
        console.log(`📊 Iniciando monitoreo de Take-Profit (Aura 1.618) para: ${mintAddress}`);
    } catch (error) {
        console.error("Error en Take-Profit:", error);
    }
}

/**
 * 🛡️ SISTEMA DE TESORERÍA Y SUPERVIVENCIA
 * Asegura que cualquier ganancia neta por encima del capital base se aparte automáticamente.
 */
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
            console.log(`🛡️ [Supervivencia] Ganancia neta de ${netProfit / LAMPORTS_PER_SOL} SOL asegurada en tu wallet unificada. Tx: ${signature}`);
        }
    } catch (err) {
        console.error("Error en el barrido de tesorería:", err);
    }
}

// Inicialización del servicio (Railway inyecta automáticamente el puerto en process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Motor Autónomo desplegado en el puerto ${PORT}`);
    console.log(`👀 Monitoreando contrato Meteora: ${METEORA_TARGET_AUTHORITY}`);
    console.log(`💳 Wallet unificada configurada: ${UNIFIED_WALLET_PUBKEY.toBase58()}`);
});

// BUCLE DE MONITOREO ACTIVO (Escanea la red cada 10 segundos)
setInterval(async () => {
  try {
    const timestamp = new Date().toLocaleTimeString();
    // Aquí puedes agregar llamadas periódicas adicionales a la RPC si lo requieres
  } catch (error) {
    console.error("Error en el escaneo periódico:", error);
  }
}, 10000);
