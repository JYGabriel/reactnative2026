// LECTOR DE SMS BANCARIOS

import { soloNumeros } from './formato';

const BANCOS = [
    [/sudameris/i, 'Sudameris'],
    [/familiar/i, 'Familiar'],
    [/continental/i, 'Continental'],
    [/solar/i, 'Solar'],
    [/bnf/i, 'BNF'],
    [/atlas/i, 'Atlas'],
    [/itau/i, 'Itaú'],
    [/gnb/i, 'GNB'],
    [/basa/i, 'BASA'],
    [/bancop/i, 'BANCOP'],
    [/interfisa/i, 'Interfisa'],
    [/zeta/i, 'Zeta'],
    [/citibank/i, 'Citibank'],
    [/banco\s+do\s+brasil/i, 'Banco do Brasil'],
    [/financiera\s+Paraguayo\s+Japonesa/i, 'Financiera Paraguayo Japonesa'],
    [/finlatina/i, 'Finlatina'],
    [/tu\s+financiera/i, 'Tu Financiera'],
    [/financiera\s+fic/i, 'Financiera FIC'],
    [/medalla/i, 'Medalla'],
];

export function parsearSMS(texto) {
    if (!/(compra|consumo|tarjeta| tc )/i.test(texto)) return null;
    const montos = [...texto.matchAll(/Gs[.]? *([0-9.]+)/gi)].map((m) => soloNumeros(m[1]));
    if (montos.length === 0) return null;

    const deuda = texto.match(/deuda[^G]*Gs[.]? *([0-9.]+)/i);
    const tarjeta = texto.match(/(?:TC|tarjeta) *(?:final *)?[*]* *([0-9]{4})/i);
    const comercio = texto.match(/(?:^| )en +([A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .&-]+?)(?= +Gs| +por|[.] |[.]?$)/i);
    const banco = (BANCOS.find(([re]) => re.test(texto)) || [null, 'Banco'])[1];

    return {
        banco,
        monto: montos[0],
        deudaReportada: deuda ? soloNumeros(deuda[1]) : null,
        ultimos4: tarjeta ? tarjeta[1] : '????',
        comercio: comercio ? comercio[1].trim() : 'Comercio',
    };
}
