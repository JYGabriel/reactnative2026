export function formatGs(valor) {
    const n = Math.round(valor || 0);
    const s = String(Math.abs(n));
    let salida = '';
    for (let i = 0; i < s.length; i++) {
        if (i > 0 && (s.length - i) % 3 === 0) salida += '.';
        salida += s[i];
    }
    return (n < 0 ? '-Gs. ' : 'Gs. ') + salida;
}

export function soloNumeros(texto) {
    return parseInt(String(texto).replace(/[^0-9]/g, ''), 10) || 0;
}